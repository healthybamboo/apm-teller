import type { Dependencies } from "./dependencies";
import { PromptTemplateValue, type AgentSession, type AgentKind } from "../domain/mining";
import type { ValidateConventionUseCase } from "./validateConventionUseCase";
import type { Logger, ProgressReporter } from "../domain/shared";
import { DomainError } from "../domain/shared";
import type { CheckReadinessUseCase } from "./checkReadinessUseCase";

/**
 * 言語タグ → プロンプトで使う言語名。
 */
const LANGUAGE_NAMES: Record<string, string> = { ja: "Japanese (日本語)", en: "English" };

/**
 * マイニング実行のオプション。
 */
export interface MineOptionsDto {
  /**
   * 設定済み sources のうち対象にする repo（未指定なら全件）。
   */
  repos?: string[];

  /**
   * gh による取得を省略し、既存の生データを使う。
   */
  skipFetch?: boolean;

  /**
   * 抽出エージェントを起動せず、呼び出し内容のログだけ出す。
   */
  dryRun?: boolean;

  /**
   * 前提条件チェック（doctor）を省略する。
   */
  skipDoctor?: boolean;

  /**
   * 進捗ログの受け口（RunLog への記録とは別に呼ばれる）。
   */
  log?: Logger;

  /**
   * 取得フェーズの進捗通知（source ごとに done/total が進む）。
   */
  onProgress?: ProgressReporter;

  /**
   * プロンプト末尾に追記する追加指示（GUI から入力。例: "テストに関する規約だけ抽出して"）。
   */
  extraPrompt?: string;

  /**
   * エージェントセッションが開いたときに呼ばれる。ブラウザのターミナルへ接続するために使う。
   */
  onSession?: (session: AgentSession) => void;

  /**
   * 規約本文を書かせる言語（例: "ja"）。省略時は teller.yml の mining.language。
   */
  language?: string;

  /**
   * 使うエージェントの上書き（省略時は teller.yml の mining.agent.kind）。
   */
  agent?: AgentKind;
}

/**
 * マイニング実行の結果。
 */
export interface MineResultDto {
  /**
   * 実行 ID（.teller/runs のファイル名、convention の `run` フィールドと対応）。
   */
  runId: string;

  /**
   * 抽出エージェントの終了コード。
   */
  exit: number;
}

/**
 * マイニングのオーケストレーション:
 * 1) doctor 2) ReviewSourcePort で生データ取得 3) ExtractorPort（対話セッションの claude）に convention を書かせる 4) RunLogPort へ記録。
 * Claude の出力検証は hook → `apm-teller validate` → {@link ValidateConventionUseCase} が担う。
 */
export class MineConventionsUseCase {
  constructor(
    private readonly d: Pick<Dependencies, "miningConfigs" | "reviews" | "extractor" | "runs" | "probe" | "prompts" | "runIds" | "layout" | "agentCommands" | "clock">,
    private readonly readiness: CheckReadinessUseCase,
    private readonly validator: ValidateConventionUseCase,
  ) {}

  /**
   * マイニングを実行する。dryRun ならエージェント起動直前で終了する。
   *
   * @param opts 実行オプション。`repos`（対象を `owner/repo` で絞る）、`skipFetch`、`dryRun`、`skipDoctor`、`log`（進捗の受け口）。省略時はすべて既定（全 source を取得し、doctor を通し、エージェントを起動）
   * @returns 実行 ID と抽出エージェントの終了コード（dryRun 時は 0）
   * @throws {DomainError} doctor の必須項目に失敗した場合（code: `not_ready`）、または対象 source が 1 件もない場合（code: `not_configured`）
   * @throws {InvariantViolation} mining ブロックが不正な場合、または `repos` に未設定の repo が含まれる場合
   * @throws {NotFoundError} プロンプトテンプレートファイルが存在しない場合
   */
  async execute(opts: MineOptionsDto = {}): Promise<MineResultDto> {
    if (!opts.skipDoctor) this.readiness.assert();
    const config = this.d.miningConfigs.load();
    const sources = config.select(opts.repos);
    if (sources.length === 0) throw new DomainError("no mining sources configured (teller.yml mining.sources)", "not_configured");

    const { layout } = this.d;
    const runId = this.d.runIds.next();
    const run = this.d.runs.open(runId);
    const log: Logger = (s) => { run.write(s); opts.log?.(s); };
    try {
      if (opts.skipFetch) log(`[${runId}] skipping fetch, reusing ${layout.raw}`);
      else {
        log(`[${runId}] fetching ${sources.length} source(s)`);
        for (const s of sources) await this.d.reviews.fetch(s, layout.raw, log, opts.onProgress);
      }
      const base = new PromptTemplateValue(this.d.prompts.read(layout.prompt)).render({
        RAW_DIR: layout.raw, CONVENTIONS_DIR: layout.conventions, RUN_ID: runId, DATE: this.d.clock().toISOString().slice(0, 10),
        LANGUAGE: LANGUAGE_NAMES[opts.language ?? config.language] ?? (opts.language ?? config.language),
      });
      const prompt = opts.extraPrompt?.trim() ? `${base}\n\n## Additional instructions from the operator\n${opts.extraPrompt.trim()}\n` : base;
      const kind = opts.agent ?? config.agentKind;
      const launch = this.d.agentCommands.build(kind, config.agent, prompt, {
        claudeSettings: this.d.probe.fileExists(layout.agentSettings) ? `${layout.root}/${layout.agentSettings}` : undefined,
      });
      log(`[${runId}] ${this.d.agentCommands.describe(launch)}`);
      if (opts.dryRun) return { runId, exit: 0 };
      const session = this.d.extractor.open(launch);
      opts.onSession?.(session);
      const exit = await this.waitForExit(session, run.write);
      log(`[${runId}] agent session exited with ${exit}`);
      // hooks が無い／効かない環境（codex の apply_patch 等）でも最終状態を保証するため、終了後に全件検証する
      const problems = this.validator.all();
      log(problems.length ? `[${runId}] ${problems.length} validation problem(s):\n${problems.map((p) => "  - " + p).join("\n")}` : `[${runId}] all convention files valid`);
      this.d.runs.summarize(runId, { sources: sources.map((s) => s.repo), exit });
      return { runId, exit };
    } finally {
      run.close();
    }
  }

  /**
   * セッションの終了を待ちつつ、端末出力を ANSI を除いた行単位で実行ログに書く。
   *
   * @param session 起動中のエージェントセッション
   * @param write 実行ログへの 1 行書き込み
   * @returns 終了コード
   */
  private waitForExit(session: AgentSession, write: Logger): Promise<number> {
    let buf = "";
    const strip = (s: string) => s.replace(/\x1b\[[0-9;?]*[ -/]*[@-~]/g, "").replace(/\x1b\][^\x07]*\x07/g, "").replace(/\r/g, "");
    session.onData((d) => {
      buf += strip(d);
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const l of lines) if (l.trim()) write(l);
    });
    return new Promise((resolve) => session.onExit((code) => { if (buf.trim()) write(buf); resolve(code); }));
  }
}

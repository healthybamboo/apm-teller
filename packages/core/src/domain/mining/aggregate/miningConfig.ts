import { AggregateRoot, InvariantViolation } from "../../shared";
import { RepoRefValue } from "../value/repoRefValue";
import { MiningConfigSchema, MiningSourceSchema, DEFAULT_TOOL_REQUIREMENTS, type MiningConfigData, type MiningSource, type ToolRequirement, type AgentOptions, type AgentKind } from "../schema/schema";

/**
 * MiningConfig 集約ルート（vault に 1 つ）。
 * どの repo のレビューを読むか、抽出エージェントをどう起動するか、必要ツールは何か。
 */
export class MiningConfig extends AggregateRoot<"mining"> {
  private constructor(private data: MiningConfigData) { super(); }

  /**
   * vault に 1 つしか存在しないため固定 ID。
   */
  get id() { return "mining" as const; }

  /**
   * teller.yml の `mining:` ブロック等の生データから集約を復元する。
   * `null` / `undefined` は空ブロックとして扱い、既定値で補完する。
   *
   * @param raw teller.yml の mining ブロックをパースした生オブジェクト（スキーマ未検証）。
   * @returns 検証済みデータを保持する MiningConfig。
   * @throws {InvariantViolation} raw が MiningConfigSchema に適合しない場合。issues に項目ごとの理由を含む。
   */
  static from(raw: unknown): MiningConfig {
    const r = MiningConfigSchema.safeParse(raw ?? {});
    if (!r.success) throw new InvariantViolation("invalid mining config", r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`));
    return new MiningConfig(r.data);
  }

  /**
   * 対象 repo を持たない空の設定を生成する。teller.yml に `mining:` が無い vault の初期状態として使う。
   *
   * @returns sources が空で、agent と requirements が既定値の MiningConfig。
   */
  static empty() { return MiningConfig.from({}); }

  /**
   * 永続化・API 応答用のスナップショットを返す。
   * 防御的コピーなので、戻り値を変更しても集約には影響しない。
   *
   * @returns 設定データの深いコピー。
   */
  toData(): MiningConfigData { return structuredClone(this.data); }

  /**
   * レビュー履歴を読む対象リポジトリの一覧。
   */
  get sources(): readonly MiningSource[] { return this.data.sources; }

  /**
   * 抽出エージェント（claude -p）の起動オプション（permission mode・許可ツール・追加引数）。
   */
  get agent(): AgentOptions { return this.data.agent; }

  /**
   * 抽出エージェントの種別（claude / codex）。
   */
  get agentKind(): AgentKind { return this.data.agent.kind; }

  /**
   * 規約本文を書かせる言語（IETF タグ。例: ja, en）。
   */
  get language(): string { return this.data.language; }

  /**
   * doctor が検査するツール要件。teller.yml で未指定なら既定の要件（apm / claude / gh / apm-teller）を返す。
   */
  get toolRequirements(): ToolRequirement[] { return this.data.requirements ?? DEFAULT_TOOL_REQUIREMENTS; }

  /**
   * 対象リポジトリを追加する。同じ repo は 1 件まで。
   *
   * @param src 検証前の対象定義。`repo`（owner/repo 形式）を必須とし、`prs`・`include` は省略可。
   * @throws {ZodError} src が MiningSourceSchema に適合しない場合（repo が owner/repo 形式でない等）。
   * @throws {InvariantViolation} 同じ repo が既に登録されている場合。
   */
  addSource(src: unknown) {
    const raw = (src ?? {}) as { repo?: unknown };
    const ref = RepoRefValue.parse(String(raw.repo ?? ""));
    const s = MiningSourceSchema.parse({ ...(src as object), repo: ref.slug, ...(ref.isSelfHosted ? { host: ref.host } : {}) });
    if (this.data.sources.some((x) => x.repo === s.repo && (x.host ?? RepoRefValue.DEFAULT_HOST) === (s.host ?? RepoRefValue.DEFAULT_HOST))) {
      throw new InvariantViolation(`source ${s.repo} already exists`, [], { key: "mining.sourceExists", params: { repo: s.repo } });
    }
    this.data.sources.push(s);
  }

  /**
   * 対象リポジトリを削除する。存在しなければ何もしない。
   *
   * @param repo 削除する GitHub リポジトリ。`owner/repo` 形式（例: microsoft/apm）。
   */
  removeSource(repo: string) { this.data.sources = this.data.sources.filter((s) => s.repo !== repo); }

  /**
   * 実行対象を指定 repo に絞り込む。未指定または空なら全件を返す。
   *
   * @param repos 絞り込む GitHub リポジトリ（`owner/repo` 形式）の一覧。省略時は全件。
   * @returns 指定順ではなく登録順に並んだ対象定義のコピー。
   * @throws {InvariantViolation} repos に登録されていない repo が含まれる場合。メッセージに未登録の repo を列挙する。
   */
  select(repos?: string[]): MiningSource[] {
    if (!repos?.length) return [...this.data.sources];
    const unknown = repos.filter((r) => !this.data.sources.some((s) => s.repo === r));
    if (unknown.length) throw new InvariantViolation(`unknown source(s): ${unknown.join(", ")}`);
    return this.data.sources.filter((s) => repos.includes(s.repo));
  }
}

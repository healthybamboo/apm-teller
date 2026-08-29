import type { MiningConfig } from "../aggregate/miningConfig";
import type { EnvironmentProbePort } from "../port/environmentProbePort";
import type { ReadinessCheckDto } from "../dto/readinessCheckDto";

/**
 * マイニング実行に必要な、ツール以外のファイル（レイアウト由来）。いずれも vault 相対パス。
 */
export interface RequiredFiles {
  /**
   * 抽出プロンプトテンプレートの vault 相対パス（例: .teller/prompt.md）。
   */
  prompt: string;

  /**
   * 抽出エージェント用 Claude Code 設定ファイルの vault 相対パス（例: .teller/agent-settings.json）。
   */
  agentSettings: string;

  /**
   * Codex の hooks 設定（<vault>/.codex/hooks.json）の vault 相対パス。
   */
  codexHooks: string;
}

/**
 * マイニングの前提条件を評価するドメインサービス。
 * 検査対象のコマンドは MiningConfig（既定は DEFAULT_TOOL_REQUIREMENTS）から受け取り、ここでは列挙しない。
 */
export class ReadinessService {
  constructor(private readonly probe: EnvironmentProbePort) {}

  /**
   * 全項目を評価する。ツール → GitHub 認証・repo アクセス（gh がある場合のみ）→ 必須ファイル → sources 設定の順。
   *
   * @param config 検査するツール要件と対象 repo を持つマイニング設定。
   * @param files 存在確認する必須ファイルの vault 相対パス。
   * @returns 評価順に並んだ検査結果（合格・不合格とも含む）。
   */
  assess(config: MiningConfig, files: RequiredFiles): ReadinessCheckDto[] {
    const checks: ReadinessCheckDto[] = [];
    const available = new Map<string, boolean>();
    for (const req of config.toolRequirements) {
      const r = this.probe.tool(req.command, req.args);
      available.set(req.command, r.ok);
      // エージェント固定の要件は、その種別が選ばれているときだけ必須
      const required = req.agent ? req.agent === config.agentKind && req.required : req.required;
      checks.push({ id: req.id, label: req.label, ok: r.ok, detail: r.detail, required, fix: req.fix });
    }
    if (available.get("gh")) checks.push(...this.githubChecks(config));
    const kind = config.agentKind;
    const fileChecks: [string, string, boolean][] = [["prompt", files.prompt, true], ["agent-settings", files.agentSettings, kind === "claude"], ["codex-hooks", files.codexHooks, kind === "codex"]];
    for (const [id, rel, required] of fileChecks) {
      checks.push({ id, label: rel, ok: this.probe.fileExists(rel), required, fix: "apm-teller init" });
    }
    checks.push({ id: "sources", label: "mining.sources configured", ok: config.sources.length > 0, detail: `${config.sources.length} source(s)`, required: true, fix: "teller.yml か GUI で mining.sources を追加" });
    return checks;
  }

  /**
   * 必須なのに失敗している項目だけ返す。空ならマイニングを実行できる。
   *
   * @param config 検査するツール要件と対象 repo を持つマイニング設定。
   * @param files 存在確認する必須ファイルの vault 相対パス。
   * @returns required=true かつ ok=false の検査結果。
   */
  blocking(config: MiningConfig, files: RequiredFiles): ReadinessCheckDto[] {
    return this.assess(config, files).filter((c) => c.required && !c.ok);
  }

  private githubChecks(config: MiningConfig): ReadinessCheckDto[] {
    const hosts = [...new Set(config.sources.map((s) => s.host ?? "github.com"))];
    if (hosts.length === 0) hosts.push("github.com");
    const out: ReadinessCheckDto[] = hosts.map((h) => {
      const auth = this.probe.ghAuth(h);
      return { id: h === "github.com" ? "gh-auth" : `gh-auth:${h}`, label: `gh authenticated (${h})`, ok: auth.ok, detail: auth.detail, required: true, fix: `gh auth login --hostname ${h}` };
    });
    for (const s of config.sources) {
      const r = this.probe.repoAccess(s.repo, s.host);
      out.push({ id: `repo:${s.repo}`, label: `access to ${s.repo}`, ok: r.ok, detail: r.detail, required: true, fix: "repo 名と gh トークンの read 権限を確認" });
    }
    return out;
  }
}

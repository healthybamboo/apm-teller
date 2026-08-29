import type { AgentKind, AgentOptions } from "../schema/schema";
import type { AgentLaunchValue } from "../value/agentLaunchValue";

/**
 * 起動に必要なファイル（絶対パス）。存在しないものは undefined。
 */
export interface AgentFiles {
  /**
   * Claude Code の設定ファイル（hooks を含む）の絶対パス。
   */
  claudeSettings?: string;
}

/**
 * エージェント種別ごとの起動コマンドを組み立てるドメインサービス。
 * claude: `claude "<prompt>" --settings <file> --permission-mode … --setting-sources … --allowedTools …`
 * codex: `codex --ask-for-approval <approval> --sandbox <sandbox> [--model m] "<prompt>"`（hooks は <vault>/.codex/hooks.json から自動で読まれる）
 */
export class AgentCommandService {
  /**
   * 起動コマンドを組み立てる。
   *
   * @param kind 使うエージェント（claude / codex）
   * @param options teller.yml の mining.agent（両エージェント分のオプション）
   * @param prompt セッション開始時に渡すプロンプト全文
   * @param files 起動に必要なファイルの絶対パス
   * @returns コマンド名と引数
   */
  build(kind: AgentKind, options: AgentOptions, prompt: string, files: AgentFiles): AgentLaunchValue {
    if (kind === "codex") {
      const o = options.codex;
      return { command: "codex", args: ["--ask-for-approval", o.approval, "--sandbox", o.sandbox, ...(o.model ? ["--model", o.model] : []), ...o.extra_args, prompt] };
    }
    const o = options.claude;
    return {
      command: "claude",
      args: [
        prompt,
        ...(files.claudeSettings ? ["--settings", files.claudeSettings] : []),
        "--permission-mode", o.permission_mode,
        "--setting-sources", o.setting_sources.join(","),
        "--allowedTools", ...o.allowed_tools,
        ...o.extra_args,
      ],
    };
  }

  /**
   * ログ表示用の説明文（プロンプトなど長い引数は省略）。
   *
   * @param launch 起動コマンド
   * @returns 例: `codex --ask-for-approval on-request --sandbox workspace-write "You are…"`
   */
  describe(launch: AgentLaunchValue): string {
    return `${launch.command} ${launch.args.map((a) => (a.length > 60 ? `"${a.slice(0, 57)}…"` : a)).join(" ")}`;
  }
}

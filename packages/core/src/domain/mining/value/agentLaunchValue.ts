/**
 * 端末で起動するコマンドとその引数（値オブジェクト）。PTY アダプタはこれをそのまま spawn する。
 */
export interface AgentLaunchValue {
  /**
   * コマンド名（PATH から解決。例: claude, codex）。
   */
  command: string;

  /**
   * 引数配列。プロンプト本文もこの中に入る。
   */
  args: string[];
}

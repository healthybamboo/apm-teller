import type { AgentLaunchValue } from "../value/agentLaunchValue";

/**
 * 起動中のエージェントセッション。通常のターミナルと同じく、出力を受け取り入力を送れる。
 */
export interface AgentSession {
  /**
   * 端末出力（ANSI エスケープを含む生データ）を受け取る。
   *
   * @param cb 出力チャンクごとに呼ばれるコールバック
   */
  onData(cb: (data: string) => void): void;

  /**
   * 終了を受け取る。
   *
   * @param cb 終了コードを受け取るコールバック
   */
  onExit(cb: (code: number) => void): void;

  /**
   * キー入力を送る。
   *
   * @param data 端末に書き込む文字列（改行は "\r"）
   */
  write(data: string): void;

  /**
   * 端末サイズを変更する。
   *
   * @param cols 桁数
   * @param rows 行数
   */
  resize(cols: number, rows: number): void;

  /**
   * セッションを強制終了する。
   */
  kill(): void;
}

/**
 * 生データから convention ファイルを書かせるエージェントのポート。
 * 実装は対話セッション（PTY 上の claude / codex）を開き、ブラウザのターミナルから操作できるようにする。
 */
export interface ExtractorPort {
  /**
   * セッションを開始する。
   *
   * @param launch 起動するコマンドと引数
   * @returns 起動したセッション
   */
  open(launch: AgentLaunchValue): AgentSession;

}

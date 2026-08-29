/**
 * 環境検査 1 件の結果。
 */
export interface ProbeResultDto {
  /**
   * 検査に合格したか。
   */
  ok: boolean;

  /**
   * 人間向けの詳細（バージョン文字列やエラー出力の要約など）。
   */
  detail: string;
}

/**
 * 実行環境の検査ポート。doctor が依存する外部コマンドや認証状態を問い合わせる。
 */
export interface EnvironmentProbePort {
  /**
   * コマンドを実行して存在とバージョンを確認する。
   *
   * @param cmd 実行するコマンド名（PATH 上の実行ファイル、例: gh）。
   * @param args 渡す引数（例: ["--version"]）。
   * @returns 実行できれば ok=true と標準出力の要約、失敗なら ok=false と理由。
   */
  tool(cmd: string, args: string[]): ProbeResultDto;

  /**
   * gh CLI の認証状態（`gh auth status`）を確認する。
   *
   * @returns ログイン済みなら ok=true。detail に認証アカウント等の要約。
   * @param host GitHub のホスト名（例: ghe.example.com）。省略時は github.com
   */
  ghAuth(host?: string): ProbeResultDto;

  /**
   * GitHub リポジトリへの読み取りアクセス可否を確認する。
   *
   * @param repo GitHub リポジトリ。`owner/repo` 形式（例: microsoft/apm）。
   * @returns 読めれば ok=true。detail にエラー理由等。
   * @param host GitHub のホスト名（例: ghe.example.com）。省略時は github.com
   */
  repoAccess(repo: string, host?: string): ProbeResultDto;

  /**
   * vault 相対パスのファイルが存在するか確認する。
   *
   * @param relPath vault ルートからの相対パス（例: .teller/prompt.md）。
   * @returns 存在すれば true。
   */
  fileExists(relPath: string): boolean;
}

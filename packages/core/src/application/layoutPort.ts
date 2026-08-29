/**
 * ツールが vault 内で使うパス群（vault 相対）。ドメイン概念ではなく配置規約なので、
 * teller.yml の `paths:` から infrastructure が組み立ててアプリ層に渡す。
 */
export interface TellerLayout {
  /**
   * vault ルートの絶対パス。相対パスの絶対化に使う。
   */
  root: string;

  /**
   * convention ファイルの置き場所。
   */
  conventions: string;
  /**
   * 実行ログの置き場所。
   */
  runs: string;
  /**
   * 取得した生データの置き場所。
   */
  raw: string;
  /**
   * 抽出プロンプトのテンプレートファイル。
   */
  prompt: string;
  /**
   * 抽出エージェント（Claude Code）の設定ファイル（hooks を含む）。
   */
  agentSettings: string;

  /**
   * Codex の hooks 設定（<vault>/.codex/hooks.json。Codex が自動で読む場所）。
   */
  codexHooks: string;
}

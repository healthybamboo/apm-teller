/**
 * プロンプトテンプレート本文の読み出しポート（レイアウトで指定されたパスから）。
 */
export interface PromptSourcePort {
  /**
   * vault 相対パスで指定されたテンプレートの本文を読み出す。
   *
   * @param relPath テンプレートファイルの vault ルートからの相対パス（例: .teller/prompts/extract-conventions.md。通常は {@link TellerLayout.prompt}）
   * @returns テンプレートの本文（プレースホルダ未置換）
   * @throws {NotFoundError} ファイルが存在しない場合
   */
  read(relPath: string): string;
}

/**
 * プロンプトテンプレートの値オブジェクト。`{{KEY}}` を置換するだけの純粋ロジック。
 */
export class PromptTemplateValue {
  constructor(private readonly text: string) {}

  /**
   * プレースホルダを置換した本文を返す。vars に無いプレースホルダはそのまま残る。
   *
   * @param vars プレースホルダ名（`{{` `}}` を除いた KEY）から置換文字列へのマップ（例: { RAW_DIR: ".teller/raw/run-1" }）。
   * @returns 置換後のプロンプト全文。
   */
  render(vars: Record<string, string>): string {
    return Object.entries(vars).reduce((acc, [k, v]) => acc.replaceAll(`{{${k}}}`, v), this.text);
  }
}

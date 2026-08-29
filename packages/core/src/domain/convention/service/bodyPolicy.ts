/**
 * 規約本文（Markdown）に必須の見出しセクション。`## Rule` と `## Rationale`。
 */
export const REQUIRED_SECTIONS = ["Rule", "Rationale"] as const;

/**
 * 本文（前後の空白を除いた後）に要求する最小文字数。
 */
export const MIN_BODY_LENGTH = 20;

/**
 * 規約本文の構造ポリシー。ファイル I/O を持たないドメインサービス。
 * 必須セクションと最小文字数はコンストラクタで差し替えられる。
 */
export class ConventionBodyPolicy {
  constructor(private readonly sections: readonly string[] = REQUIRED_SECTIONS, private readonly minLength = MIN_BODY_LENGTH) {}

  /**
   * 本文を検証し、違反メッセージの一覧を返す。例外は投げない。
   *
   * @param body front matter を除いた規約本文（Markdown）。`## Rule` `## Rationale` の見出しを含むことを期待する。
   * @returns 違反の説明文。問題がなければ空配列。
   */
  validate(body: string): string[] {
    const errors: string[] = [];
    const b = body.trim();
    if (b.length < this.minLength) errors.push("body is too short — describe the rule and rationale");
    for (const s of this.sections) {
      if (!new RegExp(`^##\\s+${s}`, "m").test(b)) errors.push(`body must contain a "## ${s}" section`);
    }
    return errors;
  }
}

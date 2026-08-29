/**
 * kebab-case 識別子の正規表現（パッケージ名・成果物名・convention id 等で共通）。
 * 小文字英数字で始まり、小文字英数字とハイフンのみからなる。
 */
export const KEBAB_CASE = /^[a-z0-9][a-z0-9-]*$/;

/**
 * 文字列が kebab-case 識別子として有効か判定する。
 *
 * @param s 判定する文字列（例: "review-guidelines"）。
 * @returns {@link KEBAB_CASE} に一致すれば true。
 */
export function isKebabCase(s: string): boolean { return KEBAB_CASE.test(s); }

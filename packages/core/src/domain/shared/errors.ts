/**
 * 表示側で翻訳するためのエラー識別子と穴埋めパラメータ。
 */
export interface ErrorDetail {
  /**
   * 翻訳辞書のキー（例: "convention.invalidTransition"）。無ければ message をそのまま表示する。
   */
  key?: string;

  /**
   * メッセージの穴埋め値（例: { id, from, to }）。
   */
  params?: Record<string, string | number>;
}

/**
 * ドメイン層で発生するエラーの基底。`code` で API 応答のステータスに写像し、`key`/`params` で表示言語に翻訳する。
 */
export class DomainError extends Error {
  /**
   * 翻訳キー（任意）。
   */
  readonly key?: string;

  /**
   * 穴埋め値（任意）。
   */
  readonly params?: Record<string, string | number>;

  /**
   * エラーを生成する。
   *
   * @param message 英語の既定メッセージ（ログ・CLI 表示用）
   * @param code エラー種別（not_found / invariant_violation / not_configured / not_ready）
   * @param detail 翻訳用のキーとパラメータ
   */
  constructor(message: string, public readonly code: string = "domain_error", detail: ErrorDetail = {}) {
    super(message);
    this.name = "DomainError";
    this.key = detail.key;
    this.params = detail.params;
  }
}

/**
 * 参照先が存在しない。
 */
export class NotFoundError extends DomainError {
  /**
   * 対象の説明から "<what> not found" を組み立てる。
   *
   * @param what 見つからなかった対象の説明（例: "convention foo"）
   * @param detail 翻訳用のキーとパラメータ
   */
  constructor(what: string, detail: ErrorDetail = {}) { super(`${what} not found`, "not_found", detail); }
}

/**
 * 集約の不変条件違反。`issues` に個別の理由を持つ。
 */
export class InvariantViolation extends DomainError {
  /**
   * 違反理由の一覧つきで生成する。
   *
   * @param message 英語の既定メッセージ
   * @param issues 個別の違反理由（スキーマ検証の各行など）
   * @param detail 翻訳用のキーとパラメータ
   */
  constructor(message: string, public readonly issues: string[] = [], detail: ErrorDetail = {}) { super(message, "invariant_violation", detail); }
}

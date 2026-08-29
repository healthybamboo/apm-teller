/**
 * ファイル名に使える run ID（UTC 時刻ベース）を発行する。時計は注入する。
 */
export class RunIdGenerator {
  constructor(private readonly clock: () => Date) {}

  /**
   * 現在時刻から新しい run ID を発行する。
   *
   * @returns `YYYY-MM-DDTHH-MM-SS` 形式（ISO 8601 の `:` `.` を `-` に置換し秒まで）の文字列。例: 2026-08-30T12-34-56。
   */
  next(): string { return this.clock().toISOString().replace(/[:.]/g, "-").slice(0, 19); }
}

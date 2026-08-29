import type { ReviewConventionUseCase, ReviewAction } from "@apm-teller/core";
import type { CliCommand } from "./command";

/**
 * CLI から承認・却下・再開する（GUI と同じユースケース）。
 */
export class ReviewCommand implements CliCommand<{ id: string; action: ReviewAction }> {
  constructor(private readonly review: ReviewConventionUseCase) {}

  /**
   * convention の状態を遷移させて保存し、「アクション → 保存先パス」を表示する。
   *
   * @param o 審査指示。`id` は convention の id（`.teller/conventions/<id>.md` のファイル名部分）、
   *   `action` は `accept` | `reject` | `reopen` のいずれか
   * @returns 常に 0（失敗は例外で通知される）
   * @throws {NotFoundError} `o.id` に該当する convention が存在しない場合
   * @throws {InvariantViolation} 現在の状態から `o.action` への遷移が許可されていない場合（例: promoted 済みを reject する）
   */
  run(o: { id: string; action: ReviewAction }) {
    console.log(`${o.action} → ${this.review.act(o.id, o.action)}`);
    return 0;
  }
}

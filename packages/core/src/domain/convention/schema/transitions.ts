import type { ConventionStatus } from "./schema";

/**
 * 許可される状態遷移の表（遷移元 → 遷移先の一覧）。ここに無い遷移はドメインエラー。
 * promoted は終端で、どこにも遷移できない。
 */
export const TRANSITIONS: Record<ConventionStatus, ConventionStatus[]> = {
  proposed: ["accepted", "rejected"],
  accepted: ["promoted", "rejected", "proposed"],
  rejected: ["proposed"],
  promoted: [],
};

/**
 * `from` から `to` への状態遷移が {@link TRANSITIONS} で許可されているか判定する。
 *
 * @param from 現在のライフサイクル状態（proposed / accepted / rejected / promoted）。
 * @param to 遷移先のライフサイクル状態。
 * @returns 許可されていれば true。
 */
export function canTransition(from: ConventionStatus, to: ConventionStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

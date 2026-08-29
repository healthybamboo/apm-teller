import type { Dependencies } from "./dependencies";
import { NotFoundError } from "../domain/shared";
import type { ConventionKind } from "../domain/convention";

/**
 * 審査操作の種類。Convention 集約の同名メソッドに対応する。
 */
export type ReviewAction = "accept" | "reject" | "reopen";

/**
 * GUI での承認・却下・編集。状態遷移のルールは Convention 集約が持つ。
 */
export class ReviewConventionUseCase {
  constructor(private readonly d: Pick<Dependencies, "conventions">) {}

  /**
   * 有効な convention と壊れたファイルの一覧を返す。
   *
   * @returns 読み込めた convention の集約と、検証に失敗したファイルとそのエラー
   */
  list() { return this.d.conventions.list(); }

  /**
   * 審査操作を適用して保存し、保存先パスを返す。
   *
   * @param id 対象 convention の id。kebab-case でファイル名 `<id>.md` に対応（例: prefer-named-exports）
   * @param action 適用する審査操作。accept（承認）/ reject（却下）/ reopen（proposed に戻す）
   * @returns 保存したファイルの vault 相対パス
   * @throws {NotFoundError} id に対応する convention が存在しない（または読めない）場合
   * @throws {InvariantViolation} 現在の status からその操作への遷移が許可されていない場合
   */
  act(id: string, action: ReviewAction): string {
    const c = this.d.conventions.find(id);
    if (!c) throw new NotFoundError(`convention ${id}`, { key: "convention.notFound", params: { id } });
    c[action]();
    return this.d.conventions.save(c);
  }

  /**
   * 本文やメタ情報を編集して保存し、保存先パスを返す。
   *
   * @param id 対象 convention の id。kebab-case でファイル名 `<id>.md` に対応（例: prefer-named-exports）
   * @param patch 変更するフィールドだけを持つ部分オブジェクト。title（見出し）/ tags（文字列配列）/ kind（skill | instruction）/ body（Markdown 本文）
   * @returns 保存したファイルの vault 相対パス
   * @throws {NotFoundError} id に対応する convention が存在しない（または読めない）場合
   * @throws {InvariantViolation} convention が promoted 済みで編集不可の場合、または編集結果が検証に失敗した場合
   */
  edit(id: string, patch: { title?: string; tags?: string[]; kind?: ConventionKind; body?: string }): string {
    const c = this.d.conventions.find(id);
    if (!c) throw new NotFoundError(`convention ${id}`, { key: "convention.notFound", params: { id } });
    c.edit(patch);
    return this.d.conventions.save(c);
  }
}

import type { Dependencies } from "./dependencies";
import type { ReadinessCheckDto } from "../domain/mining";
import { DomainError } from "../domain/shared";

/**
 * doctor。マイニングに必要なツール・認証・到達性を検査する。
 */
export class CheckReadinessUseCase {
  constructor(private readonly d: Pick<Dependencies, "miningConfigs" | "readiness" | "layout">) {}

  private files() { return { prompt: this.d.layout.prompt, agentSettings: this.d.layout.agentSettings, codexHooks: this.d.layout.codexHooks }; }

  /**
   * 全チェック項目を評価して返す（GUI の doctor パネル / CLI の doctor）。
   *
   * @returns 各チェック項目の結果（合否・詳細・修正方法）の一覧
   * @throws {InvariantViolation} teller.yml の mining ブロックがスキーマに適合しない場合
   */
  execute(): ReadinessCheckDto[] { return this.d.readiness.assess(this.d.miningConfigs.load(), this.files()); }

  /**
   * 必須項目が欠けていれば例外を投げる。mine の前段で使う。
   *
   * @throws {DomainError} 必須チェック項目に失敗があった場合（code: `not_ready`）。失敗項目と修正方法をメッセージに含む
   * @throws {InvariantViolation} teller.yml の mining ブロックがスキーマに適合しない場合
   */
  assert() {
    const failed = this.d.readiness.blocking(this.d.miningConfigs.load(), this.files());
    if (failed.length) {
      throw new DomainError("not ready to mine:\n" + failed.map((c) => `  ✗ ${c.label}${c.detail ? ` — ${c.detail}` : ""}${c.fix ? `\n      fix: ${c.fix}` : ""}`).join("\n"), "not_ready");
    }
  }
}

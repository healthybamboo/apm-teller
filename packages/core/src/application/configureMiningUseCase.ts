import type { Dependencies } from "./dependencies";
import type { MiningConfig, MiningConfigData } from "../domain/mining";

/**
 * マイニング対象 repo の追加・削除。
 */
export class ConfigureMiningUseCase {
  constructor(private readonly d: Pick<Dependencies, "miningConfigs">) {}

  /**
   * 現在のマイニング設定のスナップショットを返す。
   *
   * @returns teller.yml の mining ブロックを正規化したデータ
   * @throws {InvariantViolation} teller.yml の mining ブロックがスキーマに適合しない場合
   */
  get(): MiningConfigData { return this.d.miningConfigs.load().toData(); }

  /**
   * 対象 repo を追加して teller.yml に保存する。
   *
   * @param src 追加する取得元の生オブジェクト（スキーマ未検証）。`repo` は `owner/repo` 形式必須、`prs`（取得 PR 数、既定 30）と `include`（reviews / review_comments / issue_comments）は任意。例: `{ repo: "microsoft/apm", prs: 50 }`
   * @returns 保存後のマイニング設定のスナップショット
   * @throws {ZodError} `src` が MiningSource のスキーマに適合しない場合
   * @throws {InvariantViolation} 同じ repo がすでに登録されている場合、または既存設定が不正な場合
   */
  addSource(src: unknown) { return this.mutate((m) => m.addSource(src)); }

  /**
   * 対象 repo を削除して teller.yml に保存する。
   *
   * @param repo 削除する取得元の GitHub リポジトリ。`owner/repo` 形式（例: microsoft/apm）。未登録なら何もしない
   * @returns 保存後のマイニング設定のスナップショット
   * @throws {InvariantViolation} 既存の mining ブロックがスキーマに適合しない場合
   */
  removeSource(repo: string) { return this.mutate((m) => m.removeSource(repo)); }

  private mutate(fn: (m: MiningConfig) => void): MiningConfigData {
    const cfg = this.d.miningConfigs.load();
    fn(cfg);
    this.d.miningConfigs.save(cfg);
    return cfg.toData();
  }
}

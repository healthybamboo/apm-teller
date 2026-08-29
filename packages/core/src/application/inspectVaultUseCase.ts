import type { Dependencies } from "./dependencies";
import type { VaultView } from "../domain/marketplace";
import type { CatalogData } from "../domain/catalog";
import type { MiningConfigData } from "../domain/mining";
import type { TellerLayout } from "./layoutPort";

/**
 * GUI の初期表示に必要な情報の束。
 */
export interface VaultOverviewDto {
  /**
   * apm.yml + packages/** から読んだ vault の読み取りモデル。
   */
  vault: VaultView;

  /**
   * teller.yml の catalog ブロック。
   */
  catalog: CatalogData;

  /**
   * teller.yml の mining ブロック。
   */
  mining: MiningConfigData;

  /**
   * ツールが使うパス群（vault 相対）。
   */
  layout: TellerLayout;

  /**
   * GitHub 上の owner/repo。解決できなければ undefined。
   */
  slug?: string;
}

/**
 * vault・カタログ・マイニング設定をまとめて GUI に返す読み取りユースケース。
 */
export class InspectVaultUseCase {
  constructor(private readonly d: Pick<Dependencies, "vaults" | "catalogs" | "miningConfigs" | "layout">) {}

  /**
   * vault・カタログ・マイニング設定・レイアウトをまとめて返す。
   *
   * @returns GUI 初期表示用の束。vault の読み取りモデル、catalog / mining ブロックのデータ、パス群、解決できた場合の `owner/repo`
   * @throws {InvariantViolation} teller.yml の catalog または mining ブロックがスキーマに適合しない場合
   */
  execute(): VaultOverviewDto {
    return {
      vault: this.d.vaults.load().toView(),
      catalog: this.d.catalogs.load().toData(),
      mining: this.d.miningConfigs.load().toData(),
      layout: this.d.layout,
      slug: this.d.vaults.slug(),
    };
  }
}

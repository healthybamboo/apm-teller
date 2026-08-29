import { Catalog, type CatalogRepository } from "../../domain/catalog";
import type { TellerFile } from "./tellerFile";

/**
 * teller.yml の `catalog:` ブロックを Catalog 集約として読み書きする。
 */
export class YamlCatalogRepository implements CatalogRepository {
  constructor(private readonly file: TellerFile) {}

  /**
   * catalog ブロックを読み込み、検証して集約にする。
   *
   * @returns Catalog 集約（ブロックが無ければ既定値で構築）
   * @throws {InvariantViolation} catalog ブロックがスキーマに適合しない場合
   */
  load(): Catalog { return Catalog.from(this.file.block("catalog")); }

  /**
   * catalog ブロックを書き戻す（他ブロックとコメントは保持）。
   *
   * @param catalog 保存する Catalog 集約
   */
  save(catalog: Catalog) { this.file.setBlock("catalog", catalog.toData()); }
}

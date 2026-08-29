import type { Catalog } from "../aggregate/catalog";

/**
 * Catalog 集約の読み書きポート。
 * 永続化先（teller.yml の `catalog:` ブロック）の詳細はインフラ層の実装に委ねる。
 */
export interface CatalogRepository {
  /**
   * 永続化先からカタログを読み込む。未定義なら空のカタログを返す実装を想定する。
   *
   * @returns 復元した Catalog 集約。
   */
  load(): Catalog;

  /**
   * カタログの現在の状態を永続化する。
   *
   * @param catalog 永続化する Catalog 集約。toData() のスナップショットが書き込まれる。
   */
  save(catalog: Catalog): void;
}

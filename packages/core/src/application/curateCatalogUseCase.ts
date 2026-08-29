import type { Dependencies } from "./dependencies";
import type { Catalog, CatalogData } from "../domain/catalog";

/**
 * 作者がカタログ（見せ方）を編集するユースケース。参照パッケージの実在は Vault と突き合わせる。
 */
export class CurateCatalogUseCase {
  constructor(private readonly d: Pick<Dependencies, "catalogs" | "vaults">) {}

  /**
   * 現在のカタログのスナップショットを返す。
   *
   * @returns teller.yml の catalog ブロックを正規化したデータ
   * @throws {InvariantViolation} teller.yml の catalog ブロックがスキーマに適合しない場合
   */
  get(): CatalogData { return this.d.catalogs.load().toData(); }

  /**
   * パッケージの表示情報（見出し・推奨ターゲット等）を設定する。
   *
   * @param pkg 対象パッケージ名。apm.yml の marketplace.packages に登録済みの kebab-case 名（例: review-conventions）
   * @param entry 表示情報の生オブジェクト（スキーマ未検証）。見出し・説明・推奨ターゲットなど teller.yml の `catalog.packages.<pkg>` に書く内容
   * @returns 保存後のカタログのスナップショット
   * @throws {ZodError} `entry` が CatalogEntry のスキーマに適合しない場合
   * @throws {InvariantViolation} カタログが参照するパッケージが Vault に存在しない場合、または既存カタログが不正な場合
   */
  setEntry(pkg: string, entry: unknown) { return this.mutate((c) => c.setEntry(pkg, entry)); }

  /**
   * おすすめパッケージの一覧を置き換える。
   *
   * @param pkgs おすすめとして表示するパッケージ名（kebab-case）の配列。表示順のまま保存され、重複は除去される
   * @returns 保存後のカタログのスナップショット
   * @throws {InvariantViolation} 指定したパッケージが Vault に存在しない場合、または既存カタログが不正な場合
   */
  setFeatured(pkgs: string[]) { return this.mutate((c) => c.setFeatured(pkgs)); }

  /**
   * プリセットを追加または更新する（同名があれば置き換え）。
   *
   * @param preset プリセットの生オブジェクト（スキーマ未検証）。`name` と対象パッケージ名の配列 `packages` を持つ（例: `{ name: "backend", packages: ["lint-rules"] }`）
   * @returns 保存後のカタログのスナップショット
   * @throws {ZodError} `preset` が Preset のスキーマに適合しない場合
   * @throws {InvariantViolation} プリセットが参照するパッケージが Vault に存在しない場合、または既存カタログが不正な場合
   */
  upsertPreset(preset: unknown) { return this.mutate((c) => c.upsertPreset(preset)); }

  /**
   * プリセットを削除する。
   *
   * @param name 削除するプリセットの `name`（例: backend）。未登録なら何もしない
   * @returns 保存後のカタログのスナップショット
   * @throws {InvariantViolation} 既存カタログが参照するパッケージが Vault に存在しない場合、またはカタログが不正な場合
   */
  removePreset(name: string) { return this.mutate((c) => c.removePreset(name)); }

  private mutate(fn: (c: Catalog) => void): CatalogData {
    const catalog = this.d.catalogs.load();
    fn(catalog);
    this.d.vaults.load().assertPackagesExist(catalog.referencedPackages());
    this.d.catalogs.save(catalog);
    return catalog.toData();
  }
}

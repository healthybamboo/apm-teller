import { AggregateRoot, InvariantViolation } from "../../shared";
import { DEFAULT_INSTALL_TEMPLATES, type InstallTemplate } from "../../marketplace/schema/installTemplateSchema";
import { CatalogSchema, CatalogEntrySchema, PresetSchema, type CatalogData } from "../schema/schema";

/**
 * Catalog 集約ルート（vault に 1 つ）。
 * 作者が決める「見せ方」— おすすめ・表示情報・プリセット・インストール手順テンプレ。
 * パッケージ名が vault に実在するかの照合はアプリ層が Vault と突き合わせて行う。
 */
export class Catalog extends AggregateRoot<"catalog"> {
  private constructor(private data: CatalogData) { super(); }

  /**
   * vault に 1 つしか存在しないため固定 ID。
   */
  get id() { return "catalog" as const; }

  /**
   * teller.yml の `catalog:` ブロック等の生データから集約を復元する。
   * `null` / `undefined` は空ブロックとして扱い、既定値で補完する。
   *
   * @param raw teller.yml の catalog ブロックをパースした生オブジェクト（スキーマ未検証）。null / undefined 可。
   * @returns 検証済みデータを保持する Catalog。
   * @throws {InvariantViolation} raw が CatalogSchema に適合しない場合。issues に項目ごとの理由を含む。
   */
  static from(raw: unknown): Catalog {
    const r = CatalogSchema.safeParse(raw ?? {});
    if (!r.success) throw new InvariantViolation("invalid catalog", r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`));
    return new Catalog(r.data);
  }

  /**
   * おすすめ・表示情報・プリセットを一切持たない空のカタログを生成する。
   * teller.yml に `catalog:` が無い vault の初期状態として使う。
   *
   * @returns 全項目が既定値の Catalog。
   */
  static empty() { return Catalog.from({}); }

  /**
   * 永続化・API 応答用のスナップショットを返す。
   * 内部状態の防御的コピーなので、戻り値を変更しても集約には影響しない。
   *
   * @returns カタログデータの深いコピー。
   */
  toData(): CatalogData { return structuredClone(this.data); }

  /**
   * GUI の先頭に表示するおすすめパッケージ名の一覧。
   */
  get featured(): readonly string[] { return this.data.featured; }

  /**
   * 利用者がまとめて導入できるプリセットの一覧。
   */
  get presets() { return this.data.presets; }

  /**
   * パッケージ名をキーとする表示情報（見出し・推奨ターゲット・非表示フラグ等）。
   */
  get entries() { return this.data.packages; }

  /**
   * インストール手順テンプレート。teller.yml で未指定なら既定テンプレートを返す。
   */
  get installTemplates(): InstallTemplate[] { return this.data.install_templates ?? DEFAULT_INSTALL_TEMPLATES; }

  /**
   * カタログが参照している全パッケージ名を重複なく集める。
   * アプリ層が Vault と突き合わせて実在確認する際に使う。
   *
   * @returns おすすめ・表示情報・プリセットに現れるパッケージ名の集合（配列）。
   */
  referencedPackages(): string[] {
    return [...new Set([...this.data.featured, ...Object.keys(this.data.packages), ...this.data.presets.flatMap((p) => p.packages)])];
  }

  /**
   * パッケージの表示情報を設定する。既存の項目があれば置き換える。
   *
   * @param pkg 表示情報を紐付けるパッケージ名（kebab-case、例: review-guidelines）。
   * @param entry 見出し・推奨ターゲット・想定読者・非表示フラグを持つ生オブジェクト（CatalogEntrySchema で検証する）。
   * @throws {ZodError} entry が CatalogEntrySchema に適合しない場合。
   */
  setEntry(pkg: string, entry: unknown) { this.data.packages[pkg] = CatalogEntrySchema.parse(entry); }

  /**
   * おすすめ一覧を丸ごと置き換える。重複するパッケージ名は 1 件に畳む。
   *
   * @param pkgs おすすめとして表示するパッケージ名（kebab-case）の一覧。指定順を表示順として保持する。
   */
  setFeatured(pkgs: string[]) { this.data.featured = [...new Set(pkgs)]; }

  /**
   * プリセットを追加する。同名のプリセットが既にあれば内容を更新する。
   *
   * @param preset name（kebab-case）・description・packages（パッケージ名の一覧）を持つ生オブジェクト（PresetSchema で検証する）。
   * @throws {ZodError} preset が PresetSchema に適合しない場合（name が kebab-case でない等）。
   */
  upsertPreset(preset: unknown) {
    const p = PresetSchema.parse(preset);
    const i = this.data.presets.findIndex((x) => x.name === p.name);
    if (i >= 0) this.data.presets[i] = p; else this.data.presets.push(p);
  }

  /**
   * 指定名のプリセットを削除する。存在しなければ何もしない。
   *
   * @param name 削除するプリセットの name（kebab-case、例: backend-starter）。
   */
  removePreset(name: string) { this.data.presets = this.data.presets.filter((p) => p.name !== name); }
}

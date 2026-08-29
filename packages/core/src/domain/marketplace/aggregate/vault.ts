import { AggregateRoot, InvariantViolation, isKebabCase } from "../../shared";
import type { PackageView, VaultView } from "../view/views";
import { DEFAULT_VAULT_CONVENTIONS, type PackageRegistrationValue, type VaultConventions } from "../value/packageRegistrationValue";

/**
 * Vault 集約ルート（= apm.yml のマーケットプレイス定義）。
 * パッケージ名の一意性など、カタログ全体の不変条件を守る。
 */
export class Vault extends AggregateRoot<string> {
  constructor(private readonly view: VaultView, private readonly conventions: VaultConventions = DEFAULT_VAULT_CONVENTIONS) { super(); }

  /**
   * 識別子。apm.yml の name があればそれ、無ければ vault ルートの絶対パス。
   */
  get id() { return this.view.name ?? this.view.root; }

  /**
   * apm.yml に書かれたマーケットプレイス名。未設定なら undefined。
   */
  get name() { return this.view.name; }

  /**
   * apm.yml の marketplace.packages に登録済みのパッケージ（ローカルのものはスキャン結果込み）。
   */
  get packages(): readonly PackageView[] { return this.view.packages; }

  /**
   * GUI 用の読み取りモデルを返す。
   *
   * @returns 集約が保持している VaultView（コピーではなく同一参照）。
   */
  toView(): VaultView { return this.view; }

  /**
   * 名前でパッケージを探す。
   *
   * @param name パッケージ名（kebab-case）。
   * @returns 一致した PackageView。無ければ undefined。
   */
  find(name: string): PackageView | undefined { return this.view.packages.find((p) => p.name === name); }

  /**
   * 指定名のパッケージが登録されているか判定する。
   *
   * @param name パッケージ名（kebab-case）。
   * @returns 登録済みなら true。
   */
  has(name: string) { return this.find(name) !== undefined; }

  /**
   * 参照されるパッケージ名がすべて実在することを保証する。カタログの整合性確認に使う。
   *
   * @param names 存在を確認するパッケージ名（kebab-case）の一覧。
   * @throws {InvariantViolation} 1 件でも未登録のパッケージ名が含まれる場合。メッセージに未登録の名前を列挙する。
   */
  assertPackagesExist(names: string[]) {
    const missing = names.filter((n) => !this.has(n));
    if (missing.length) throw new InvariantViolation(`unknown package(s): ${missing.join(", ")}`, [], { key: "package.unknown", params: { names: missing.join(", ") } });
  }

  /**
   * ローカルパッケージを集約に登録し、apm.yml に追記するための登録内容を生成する。
   * 配置先・カテゴリ・タグパターン・初期バージョンは VaultConventions に従う。
   *
   * @param name 新しいパッケージ名（kebab-case、既存と重複不可）。
   * @param description パッケージの説明文。
   * @returns apm.yml の marketplace.packages に追加する 1 件分の登録内容。
   * @throws {InvariantViolation} name が kebab-case でない場合、または同名のパッケージが既に登録されている場合。
   */
  registerLocalPackage(name: string, description: string): PackageRegistrationValue {
    if (!isKebabCase(name)) throw new InvariantViolation(`package name must be kebab-case: ${name}`, [], { key: "package.badName", params: { name } });
    if (this.has(name)) throw new InvariantViolation(`package ${name} already exists`, [], { key: "package.exists", params: { name } });
    const c = this.conventions;
    const subdirStyle = c.sourceStyle === "subdir" && !!c.vaultSlug;
    const reg: PackageRegistrationValue = {
      name, description,
      // subdir 運用ではタグでバージョン解決するので範囲指定にする
      version: subdirStyle ? `^${c.initialVersion}` : c.initialVersion,
      source: subdirStyle ? c.vaultSlug! : `./${c.packagesDir}/${name}`,
      ...(subdirStyle && { subdir: `${c.packagesDir}/${name}` }),
      category: c.defaultCategory, tags: [], tag_pattern: c.tagPattern,
    };
    this.view.packages.push({
      name, description, version: c.initialVersion, versionRange: subdirStyle ? reg.version : undefined, source: reg.source, subdir: reg.subdir, local: true, dir: `${c.packagesDir}/${name}`,
      category: reg.category, tags: [], targets: [], dependencies: { apm: [], mcp: [] }, skills: [], instructions: [], hasPluginJson: true,
    });
    return reg;
  }
}

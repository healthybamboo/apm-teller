import type { Vault } from "../aggregate/vault";
import type { PackageRegistrationValue } from "../value/packageRegistrationValue";

/**
 * apm.yml 由来の Vault 集約の読み書きポート。
 */
export interface VaultRepository {
  /**
   * apm.yml を読み、ローカルパッケージの中身をスキャンして Vault を組み立てる。
   *
   * @returns 復元した Vault 集約。
   */
  load(): Vault;

  /**
   * apm.yml の marketplace.packages に 1 件追加する（既存のコメント・整形を保持）。
   *
   * @param reg 追加するパッケージの登録内容（Vault.registerLocalPackage の戻り値）。
   */
  register(reg: PackageRegistrationValue): void;

  /**
   * この vault の GitHub 上の owner/repo を解決する（git remote などから）。
   *
   * @returns `owner/repo` 形式の文字列（例: acme/apm-vault）。解決できなければ undefined。
   */
  slug(): string | undefined;
}

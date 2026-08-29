/**
 * apm.yml に追加するローカルパッケージの登録内容（値オブジェクト）。
 * marketplace.packages の 1 要素に対応する。
 */
export interface PackageRegistrationValue {
  /**
   * パッケージ名（kebab-case）。
   */
  name: string;

  /**
   * パッケージの説明文。
   */
  description: string;

  /**
   * 初期バージョン（semver、例: 0.1.0）。
   */
  version: string;

  /**
   * vault ルートからの相対参照先（例: ./packages/<name>）。
   */
  source: string;      // ./packages/<name>

  /**
   * source が owner/repo（このリポジトリ自身）のときの、パッケージのサブディレクトリ（例: packages/foo）。
   */
  subdir?: string;

  /**
   * マーケットプレイス上のカテゴリ（例: Productivity）。
   */
  category: string;

  /**
   * 検索用タグの一覧。新規登録時は空。
   */
  tags: string[];

  /**
   * リリースタグの命名パターン（例: {name}-v{version}）。
   */
  tag_pattern: string;
}

/**
 * Vault 集約の生成規約（ハードコード回避のため注入可能）。
 * 新規パッケージ登録時の配置先と既定値を決める。
 */
export interface VaultConventions {
  /**
   * ローカルパッケージを置くディレクトリ名（vault ルート相対、例: packages）。
   */
  packagesDir: string;

  /**
   * 新規パッケージに付ける既定カテゴリ（例: Productivity）。
   */
  defaultCategory: string;

  /**
   * 新規パッケージのリリースタグ命名パターン（例: {name}-v{version}）。
   */
  tagPattern: string;

  /**
   * 新規パッケージの初期バージョン（semver、例: 0.1.0）。
   */
  initialVersion: string;

  /**
   * 新規登録の source の書き方。"path" は `./packages/<name>`、"subdir" は `owner/repo` + `subdir`（タグでバージョン解決する運用）。
   */
  sourceStyle: "path" | "subdir";

  /**
   * sourceStyle が "subdir" のときに source へ書く owner/repo。
   */
  vaultSlug?: string;
}

/**
 * apm-vault テンプレートと同じ既定規約。
 */
export const DEFAULT_VAULT_CONVENTIONS: VaultConventions = {
  packagesDir: "packages", defaultCategory: "Productivity", tagPattern: "{name}-v{version}", initialVersion: "0.1.0", sourceStyle: "path",
};

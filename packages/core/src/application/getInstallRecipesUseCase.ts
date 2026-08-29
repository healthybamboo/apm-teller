import type { Dependencies } from "./dependencies";
import type { InstallRecipeDto } from "../domain/marketplace";
import { DomainError, TARGETS, type Target } from "../domain/shared";

/**
 * 選択したパッケージ群のインストール手順を返す。
 */
export class GetInstallRecipesUseCase {
  constructor(private readonly d: Pick<Dependencies, "vaults" | "catalogs" | "installRecipes">) {}

  /**
   * 指定パッケージのインストール手順を全アシスタント分返す。
   *
   * @param packages インストール対象のパッケージ名（apm.yml に登録済みの kebab-case 名）の配列。1 つでも未知なら例外
   * @param targets 出力するアシスタント（target 値の配列。例: ["claude", "codex"]）。未知の値は無視し、1 つも残らなければ例外
   * @returns アシスタント（claude / copilot など）ごとのインストール手順
   * @throws {InvariantViolation} Vault に存在しないパッケージ名が含まれる場合、または catalog ブロックが不正な場合
   * @throws {DomainError} 有効なターゲットが 1 つも無い場合（not_configured / install.noTargets）
   * @throws {DomainError} vault の `owner/repo` が解決できない場合（code: `not_configured`）
   */
  execute(packages: string[], targets: string[]): InstallRecipeDto[] {
    const vault = this.d.vaults.load();
    vault.assertPackagesExist(packages);
    const slug = this.d.vaults.slug();
    if (!slug) throw new DomainError("vault slug unknown — set `vault: owner/repo` in teller.yml", "not_configured");
    const known = targets.filter((x): x is Target => (TARGETS as readonly string[]).includes(x));
    if (known.length === 0) throw new DomainError("select at least one target", "not_configured", { key: "install.noTargets" });
    return this.d.installRecipes.build(this.d.catalogs.load().installTemplates, slug, vault.name ?? slug.split("/")[1], packages, known);
  }
}

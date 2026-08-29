import type { InstallTemplate } from "../schema/installTemplateSchema";
import type { Target } from "../../shared";

/**
 * 利用者がコピーして実行するインストール手順（DTO）。アシスタント 1 種につき 1 件。
 */
export interface InstallRecipeDto {
  /**
   * 手順の見出し（例: "APM"）。
   */
  title: string;

  /**
   * 順に実行するコマンド行。
   */
  steps: string[];

  /**
   * 補足（必要なバージョンなど）。
   */
  note?: string;
}

/**
 * インストール手順を組み立てるドメインサービス。
 * テンプレートの `{{vault}}` `{{pkg}}` `{{targets}}` を展開する。
 */
export class InstallRecipeService {
  /**
   * テンプレートを展開し、手順を返す（既定は APM の 1 ブロック）。
   * setup 行は 1 回、per_package 行はパッケージごとに繰り返す。
   *
   * @param templates 展開するインストール手順テンプレート（通常は Catalog.installTemplates）。
   * @param vaultSlug `{{vault}}` に埋める GitHub の owner/repo（例: acme/apm-vault）。
   * @param vaultName `{{pkg}}` の `@` 以降に付けるマーケットプレイス名（apm.yml の name）。
   * @param packages インストール対象のパッケージ名（kebab-case）の一覧。
   * @param targets `--target` に渡すアシスタント種別（例: ["claude", "codex", "copilot"]）。カンマ区切りで `{{targets}}` に入る。
   * @returns templates と同じ順序・件数の手順 DTO。
   */
  build(templates: InstallTemplate[], vaultSlug: string, vaultName: string, packages: string[], targets: Target[]): InstallRecipeDto[] {
    const vars = { vault: vaultSlug, targets: targets.join(",") };
    return templates.map((t) => ({
      title: t.title,
      note: t.note,
      steps: [
        ...t.setup.map((l) => this.fill(l, vars)),
        ...packages.flatMap((p) => t.per_package.map((l) => this.fill(l, { ...vars, pkg: `${p}@${vaultName}` }))),
      ],
    }));
  }

  private fill(line: string, vars: Record<string, string | undefined>): string {
    return Object.entries(vars).reduce((acc, [k, v]) => acc.replaceAll(`{{${k}}}`, v ?? ""), line);
  }
}

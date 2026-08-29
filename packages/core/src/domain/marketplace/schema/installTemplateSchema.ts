import { z } from "zod";

/**
 * インストール手順のテンプレート。`{{vault}}`（owner/repo）`{{pkg}}`（name@vault）`{{targets}}`（カンマ区切りのターゲット）を置換する。
 * setup は 1 回だけ、per_package はパッケージごとに繰り返し展開される。
 */
export const InstallTemplateSchema = z.object({
  title: z.string(),
  setup: z.array(z.string()).default([]),       // 1 回だけ実行する行（marketplace add 等）
  per_package: z.array(z.string()).default([]), // パッケージごとに繰り返す行
  note: z.string().optional(),
});

/**
 * 検証済みのインストール手順テンプレートの型。
 */
export type InstallTemplate = z.infer<typeof InstallTemplateSchema>;

/**
 * teller.yml でテンプレート未指定時に使う既定インストール手順。
 * Claude Code / GitHub Copilot CLI のプラグイン機構と、APM 経由の各ターゲットを含む。
 */
export const DEFAULT_INSTALL_TEMPLATES: InstallTemplate[] = [
  { title: "APM", setup: ["apm marketplace add {{vault}}"], per_package: ["apm install {{pkg}} --target {{targets}}"], note: "APM CLI 0.24+" },
];

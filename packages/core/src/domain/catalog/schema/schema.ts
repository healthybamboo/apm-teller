import { z } from "zod";
import { TARGETS } from "../../shared";
import { InstallTemplateSchema } from "../../marketplace/schema/installTemplateSchema";
import { KEBAB_CASE } from "../../shared/naming";

/**
 * カタログ上でのパッケージの見せ方（GUI から編集）。
 * 見出し・推奨ターゲット・想定読者・非表示フラグを持つ。
 */
export const CatalogEntrySchema = z.object({
  headline: z.string().optional(),
  recommended_targets: z.array(z.enum(TARGETS)).default([]),
  audience: z.array(z.string()).default([]),
  hidden: z.boolean().default(false),
});

/**
 * 利用者がまとめて導入できるパッケージの束。name は kebab-case。
 */
export const PresetSchema = z.object({
  name: z.string().regex(KEBAB_CASE, "kebab-case"),
  description: z.string().default(""),
  packages: z.array(z.string()).default([]),
});

/**
 * teller.yml の `catalog:` ブロック。
 * おすすめ・パッケージ表示情報・プリセット・インストール手順テンプレートを束ねる。
 */
export const CatalogSchema = z.object({
  featured: z.array(z.string()).default([]),
  packages: z.record(CatalogEntrySchema).default({}),
  presets: z.array(PresetSchema).default([]),
  install_templates: z.array(InstallTemplateSchema).optional(), // 未指定なら既定
});

/**
 * `catalog:` ブロックを検証・既定値補完した後の型。Catalog 集約の内部状態。
 */
export type CatalogData = z.infer<typeof CatalogSchema>;

/**
 * 検証済みのパッケージ表示情報の型。
 */
export type CatalogEntry = z.infer<typeof CatalogEntrySchema>;

/**
 * 検証済みのプリセットの型。
 */
export type Preset = z.infer<typeof PresetSchema>;

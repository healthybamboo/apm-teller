import { z } from "zod";
import { KEBAB_CASE } from "../../shared/naming";

/**
 * Convention（暗黙のチーム規約）のライフサイクル状態。
 * proposed（抽出直後）→ accepted / rejected（審査）→ promoted（パッケージへ昇格済み）。
 */
export const CONVENTION_STATUSES = ["proposed", "accepted", "rejected", "promoted"] as const;

/**
 * ライフサイクル状態のユニオン型。
 */
export type ConventionStatus = (typeof CONVENTION_STATUSES)[number];

/**
 * 昇格先の種別。instruction = 常時適用のガイダンス、skill = オンデマンドの手順。
 */
export const CONVENTION_KINDS = ["skill", "instruction"] as const;

/**
 * 昇格先種別のユニオン型。
 */
export type ConventionKind = (typeof CONVENTION_KINDS)[number];

/**
 * レビューコメント等、規約の根拠となる出典。repo は必須で、PR 番号・URL・引用は任意。
 */
export const EvidenceSchema = z.object({
  repo: z.string(),
  pr: z.number().int().optional(),
  url: z.string().url().optional(),
  quote: z.string().optional(),
});

/**
 * 検証済みの出典の型。
 */
export type EvidenceValue = z.infer<typeof EvidenceSchema>;

/**
 * `.teller/conventions/<id>.md` の front matter スキーマ。
 * Claude が生成するファイルを hook で検証する際の唯一の正とする。
 */
export const ConventionPropsSchema = z.object({
  id: z.string().regex(KEBAB_CASE, "kebab-case id"),
  title: z.string().min(1),
  status: z.enum(CONVENTION_STATUSES).default("proposed"),
  kind: z.enum(CONVENTION_KINDS).default("instruction"),
  confidence: z.number().min(0).max(1).default(0.5),
  tags: z.array(z.string()).default([]),
  sources: z.array(EvidenceSchema).min(1, "at least one source"),
  run: z.string().optional(),
  // YAML は 2026-08-30 のような値を Date に解釈するため、文字列へ正規化する
  created: z.preprocess((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v), z.string().optional()),
  promoted_to: z.string().optional(),
  package: z.string().optional(),
});

/**
 * 検証・既定値補完後の front matter の型。Convention 集約の内部状態。
 */
export type ConventionProps = z.infer<typeof ConventionPropsSchema>;

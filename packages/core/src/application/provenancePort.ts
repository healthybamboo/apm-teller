/**
 * 昇格時に成果物へ付ける出典欄の入力。
 */
export interface ProvenanceInputDto {
  /**
   * 出典元となる convention の id。
   */
  id: string;

  /**
   * 抽出時の確信度（0〜1）。
   */
  confidence: number;

  /**
   * 根拠となったレビューコメント等の一覧。`url` があればそれを、なければ `repo` を表示する。
   */
  sources: { url?: string; repo: string; quote?: string }[];
}

/**
 * 出典欄の整形ポート。書式は差し替え可能。
 */
export interface ProvenanceFormatterPort {
  /**
   * 成果物本文の末尾に付ける出典欄を整形する。
   *
   * @param ins 出典欄の入力。convention の kebab-case id、0〜1 の確信度、根拠（repo は必須、url / quote は任意）の配列
   * @returns 本文末尾に連結する出典欄のテキスト
   */
  format(ins: ProvenanceInputDto): string;
}

/**
 * 既定の出典欄: 区切り線 + convention id/confidence + 出典リスト。
 */
export class DefaultProvenanceFormatter implements ProvenanceFormatterPort {
  /**
   * 出典欄の Markdown を返す。
   *
   * @param ins 出典欄の入力。convention の kebab-case id、0〜1 の確信度、根拠（repo は必須、url / quote は任意）の配列
   * @returns 空行 2 つ・水平線・出典行・根拠の箇条書きからなる Markdown
   */
  format(ins: ProvenanceInputDto): string {
    const list = ins.sources.map((s) => `- ${s.url ?? s.repo}${s.quote ? ` — “${s.quote}”` : ""}`).join("\n");
    return `\n\n---\n_Source: apm-teller convention \`${ins.id}\` (confidence ${ins.confidence})_\n${list}\n`;
  }
}

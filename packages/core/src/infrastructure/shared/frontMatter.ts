import matter from "gray-matter";

/**
 * Markdown + YAML front matter の分解／合成。
 */
export class FrontMatterCodec {
  /**
   * front matter と本文に分解する。
   *
   * @param text Markdown ファイルの全文。先頭に `---` で囲まれた YAML front matter があってもなくてもよい
   * @returns `data`（front matter をパースしたオブジェクト。無ければ空）と `body`（front matter を除いた本文）
   */
  parse(text: string): { data: Record<string, unknown>; body: string } {
    try {
      const r = matter(text);
      return { data: r.data as Record<string, unknown>, body: r.content };
    } catch {
      // SKILL.md 等は「description: 〜（例: foo）」のように厳密には不正な YAML を含むことがある（各エージェントは許容する）。
      // 1 行 `key: value` だけを素朴に拾って、読み込み自体は止めない。
      return this.parseLenient(text);
    }
  }

  /**
   * YAML パーサが失敗したときの緩い読み取り。`---` で囲まれた部分の `key: value` 行（値は行末まで）だけを取り出す。
   *
   * @param text ファイル全文
   * @returns 取り出せたキーと、front matter を除いた本文
   */
  private parseLenient(text: string): { data: Record<string, unknown>; body: string } {
    const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!m) return { data: {}, body: text };
    const data: Record<string, unknown> = {};
    for (const line of m[1]!.split(/\r?\n/)) {
      const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
      if (kv) data[kv[1]!] = kv[2]!.replace(/^["']|["']$/g, "");
    }
    return { data, body: m[2] ?? "" };
  }

  /**
   * front matter と本文からファイル内容を組み立てる。本文先頭の空行は取り除く。
   *
   * @param body Markdown 本文
   * @param data front matter として YAML 化するキー・値のオブジェクト
   * @returns `---` 区切りの YAML front matter に本文を続けたファイル全文
   */
  stringify(body: string, data: Record<string, unknown>): string {
    return matter.stringify(body.replace(/^\n+/, ""), data);
  }
}

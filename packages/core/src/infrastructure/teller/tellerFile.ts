import path from "node:path";
import { z } from "zod";
import type { TellerLayout } from "../../application/layoutPort";
import { YamlFile } from "../shared/yamlFile";

/**
 * `paths:` ブロック（ツールのレイアウト）。
 */
const PathsSchema = z.object({
  conventions: z.string().default(".teller/conventions"),
  runs: z.string().default(".teller/runs"),
  raw: z.string().default(".teller/raw"),
  prompt: z.string().default(".teller/prompts/extract-conventions.md"),
  agent_settings: z.string().default(".teller/claude/settings.json"),
  codex_hooks: z.string().default(".codex/hooks.json"),
});

/**
 * teller.yml へのアクセス。catalog / mining / paths の各ブロックを別々の集約・設定として読み書きする。
 * 1 ファイルに同居させているのは「設定を全部 repo に置く」という永続化の都合であり、ドメイン境界ではない。
 */
export class TellerFile {
  static readonly NAME = "teller.yml";

  private readonly file: YamlFile;

  constructor(private readonly root: string) { this.file = new YamlFile(path.join(root, TellerFile.NAME)); }

  /**
   * トップレベルブロックを生データのまま返す。ファイルやブロックが無ければ空オブジェクト。
   *
   * @param name 取り出すブロック名。`catalog`（見せ方）または `mining`（マイニング設定）
   * @returns 該当ブロックをパースした生オブジェクト（スキーマ未検証）
   */
  block(name: "catalog" | "mining"): unknown { return this.file.read()[name] ?? {}; }

  /**
   * トップレベルブロックを置き換える（他ブロックとコメントは保持）。
   *
   * @param name 置き換えるブロック名。`catalog` または `mining`
   * @param data ブロックの新しい内容（集約の `toData()` が返すプレーンなオブジェクト）
   */
  setBlock(name: "catalog" | "mining", data: unknown) { this.file.update((doc) => doc.set(name, data)); }

  /**
   * `vault: owner/repo` の明示指定を読む。
   *
   * @returns teller.yml の `vault` の値（`owner/repo` 形式）。未指定なら undefined
   */
  vaultSlug(): string | undefined { return this.file.read().vault; }

  /**
   * `paths:` ブロックからレイアウトを組み立てる。未指定の項目は `.teller/` 配下の既定値で補う。
   *
   * @returns conventions / runs / raw / prompt / agentSettings の vault 相対パス
   * @throws {ZodError} `paths:` の値が文字列でないなどスキーマに適合しない場合
   */
  layout(): TellerLayout {
    const p = PathsSchema.parse(this.file.read().paths ?? {});
    return { root: this.root, conventions: p.conventions, runs: p.runs, raw: p.raw, prompt: p.prompt, agentSettings: p.agent_settings, codexHooks: p.codex_hooks };
  }
}

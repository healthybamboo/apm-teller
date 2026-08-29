import fs from "node:fs";
import path from "node:path";
import type { PromptSourcePort } from "../application/promptSourcePort";
import { NotFoundError } from "../domain/shared";

/**
 * vault 相対パスからプロンプトテンプレートを読む。
 */
export class FsPromptSource implements PromptSourcePort {
  constructor(private readonly root: string) {}

  /**
   * テンプレート本文を読む。
   *
   * @param relPath テンプレートファイルの vault ルートからの相対パス（例: .teller/prompts/extract-conventions.md）
   * @returns ファイルの全文（UTF-8、プレースホルダ未置換）
   * @throws {NotFoundError} ファイルが存在しない場合（`apm-teller init` の実行を促すメッセージ付き）
   */
  read(relPath: string): string {
    const p = path.join(this.root, relPath);
    if (!fs.existsSync(p)) throw new NotFoundError(`prompt ${relPath} (run \`apm-teller init\`)`);
    return fs.readFileSync(p, "utf8");
  }
}

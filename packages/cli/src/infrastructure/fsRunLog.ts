import fs from "node:fs";
import path from "node:path";
import type { RunLogPort } from "@apm-teller/core";

/**
 * `.teller/runs/<id>.log`（トランスクリプト）と `<id>.md`（サマリ）を書く {@link RunLogPort} 実装。
 */
export class FsRunLog implements RunLogPort {
  private readonly dir: string;

  constructor(root: string, runsDir: string) {
    this.dir = path.join(root, runsDir);
  }

  /**
   * runs ディレクトリを作成し、`<runId>.log` を追記モードで開く。
   *
   * @param runId 実行 ID（例: `20260830-010203`）。ファイル名 `<runId>.log` に使う
   * @returns `write` は 1 行を改行付きで同期書き込みする関数、`close` はファイル記述子を閉じる関数
   */
  open(runId: string) {
    fs.mkdirSync(this.dir, { recursive: true });
    const fd = fs.openSync(path.join(this.dir, `${runId}.log`), "a");
    return { write: (line: string) => fs.writeSync(fd, line + "\n"), close: () => fs.closeSync(fd) };
  }

  /**
   * `<runId>.md` に front matter（run / sources / exit）付きのサマリを書く。コミット可能な記録として残す。
   *
   * @param runId 実行 ID（例: `20260830-010203`）。ファイル名 `<runId>.md` に使う
   * @param s 実行結果。`sources` は対象 repo（`owner/repo` 形式）の配列、`exit` はエージェントの終了コード
   */
  summarize(runId: string, s: { sources: string[]; exit: number }) {
    fs.writeFileSync(
      path.join(this.dir, `${runId}.md`),
      `---\nrun: ${runId}\nsources: [${s.sources.join(", ")}]\nexit: ${s.exit}\n---\nSee \`${runId}.log\` for the transcript. Conventions written by this run carry \`run: ${runId}\` in their front matter.\n`,
    );
  }

  /**
   * サマリ（`.md`）が存在する run ID を列挙する。
   *
   * @returns run ID の配列（文字列ソートの降順 = 新しい順）。ディレクトリが無ければ空配列
   */
  listPast(): string[] {
    if (!fs.existsSync(this.dir)) return [];
    return fs.readdirSync(this.dir).filter((f) => f.endsWith(".md")).map((f) => f.slice(0, -3)).sort().reverse();
  }

  /**
   * `<runId>.log` を読み、行配列にして返す。
   *
   * @param runId 実行 ID（例: `20260830-010203`）。ファイル名 `<runId>.log` に使う
   * @returns トランスクリプトの各行。ファイルが無ければ undefined
   */
  read(runId: string): string[] | undefined {
    const f = path.join(this.dir, `${runId}.log`);
    return fs.existsSync(f) ? fs.readFileSync(f, "utf8").split("\n") : undefined;
  }
}

import { execFileSync } from "node:child_process";

/**
 * vault の owner/repo を解決する。明示設定 → git remote の順。
 */
export class GitSlugResolver {
  constructor(private readonly root: string, private readonly explicit?: string) {}

  /**
   * `owner/repo` を返す。明示指定があればそれを、なければ `git remote get-url origin` を GitHub URL として解析する。
   *
   * @returns `owner/repo` 形式の文字列（例: microsoft/apm）。git が無い・origin が無い・GitHub URL でない場合は undefined
   */
  resolve(): string | undefined {
    if (this.explicit) return this.explicit;
    try {
      const url = execFileSync("git", ["remote", "get-url", "origin"], { cwd: this.root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
      const m = url.match(/github\.com[:/]([^/]+)\/([^/.]+)(?:\.git)?$/);
      return m ? `${m[1]}/${m[2]}` : undefined;
    } catch { return undefined; }
  }
}

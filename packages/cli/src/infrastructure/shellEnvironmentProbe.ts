import fs from "node:fs";
import path from "node:path";
import type { EnvironmentProbePort, ProbeResultDto } from "@apm-teller/core";
import { runCommand } from "./shell";

/**
 * 実際にコマンドを叩いて環境を検査する {@link EnvironmentProbePort} 実装。
 */
export class ShellEnvironmentProbe implements EnvironmentProbePort {
  constructor(private readonly root: string) {}

  /**
   * コマンドを実行して存在確認し、出力の 1 行目（通常はバージョン文字列）を detail に返す。
   *
   * @param cmd 検査するコマンド名（例: `gh`、`claude`、`apm`）
   * @param args 実行時の引数（例: `["--version"]`）
   * @returns `ok` はコマンドが成功したか、`detail` は成功時は stdout の 1 行目、失敗時は `not found`
   */
  tool(cmd: string, args: string[]): ProbeResultDto {
    const r = runCommand(cmd, args);
    return { ok: r.ok, detail: r.ok ? r.out.split("\n")[0] : "not found" };
  }

  /**
   * `gh auth status` を実行し、GitHub CLI のログイン状態を返す。
   *
   * @returns `ok` はログイン済みか、`detail` は出力中の `Logged in` を含む行（無ければ 1 行目）
   * @param host GitHub のホスト名（例: ghe.example.com）。省略時は github.com
   */
  ghAuth(host?: string): ProbeResultDto {
    const r = runCommand("gh", ["auth", "status", ...(host ? ["--hostname", host] : [])]);
    const line = r.out.split("\n").find((l) => l.includes("Logged in")) ?? r.out.split("\n")[0];
    return { ok: r.ok, detail: line.trim() };
  }

  /**
   * `gh api repos/<repo>` を実行し、対象リポジトリへアクセスできるかを返す。
   *
   * @param repo GitHub リポジトリ。`owner/repo` 形式（例: `microsoft/apm`）
   * @returns `ok` はアクセスできたか、`detail` は成功時 `full_name (visibility)`（例: `microsoft/apm (public)`）、失敗時は stderr の 1 行目
   * @param host GitHub のホスト名（例: ghe.example.com）。省略時は github.com
   */
  repoAccess(repo: string, host?: string): ProbeResultDto {
    const r = runCommand("gh", ["api", ...(host ? ["--hostname", host] : []), `repos/${repo}`, "--jq", '.full_name + " (" + .visibility + ")"']);
    return { ok: r.ok, detail: r.out.split("\n")[0] };
  }

  /**
   * vault 内のファイルまたはディレクトリが存在するかを返す。
   *
   * @param relPath vault ルートからの相対パス（例: `.teller/claude/settings.json`）
   * @returns 存在すれば true
   */
  fileExists(relPath: string): boolean {
    return fs.existsSync(path.join(this.root, relPath));
  }
}

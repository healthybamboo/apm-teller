import { runCommand } from "./shell";

/**
 * GUI から実行を許可する apm サブコマンド（git 操作は含めない）。
 * キーが API 上のコマンド名、値が実際に `apm` へ渡す引数列。
 */
export const APM_COMMANDS = {
  pack: ["pack"],
  check: ["marketplace", "check"],
  outdated: ["marketplace", "outdated"],
} as const;

/**
 * 許可されたサブコマンド名（`pack` | `check` | `outdated`）。
 */
export type ApmCommand = keyof typeof APM_COMMANDS;

/**
 * apm CLI の呼び出し。pack / check / outdated だけを扱う。
 */
export class ApmCli {
  constructor(private readonly root: string) {}

  /**
   * vault ルートを cwd として apm サブコマンドを同期実行する（タイムアウト 120 秒）。
   *
   * @param cmd 実行するサブコマンド名。`pack` | `check` | `outdated` のいずれか（`APM_COMMANDS` のキー）
   * @returns `ok` は終了コード 0 かどうか、`out` は成功時 stdout・失敗時 stderr（いずれも trim 済み）
   */
  run(cmd: ApmCommand): { ok: boolean; out: string } {
    return runCommand("apm", [...APM_COMMANDS[cmd]], { cwd: this.root, timeout: 120_000 });
  }
}

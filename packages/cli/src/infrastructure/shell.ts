import { execFile, execFileSync } from "node:child_process";

/**
 * 外部コマンドを同期実行し、成否と出力を返す薄いラッパ。例外は投げず、失敗は `ok: false` で表す。
 *
 * @param cmd 実行するコマンド名または実行ファイルのパス（例: `gh`、`apm`）。PATH から解決される
 * @param args コマンドに渡す引数の配列（シェル経由ではないためクォート不要。例: `["api", "repos/o/r"]`）
 * @param opts 実行オプション。`cwd` は作業ディレクトリ（省略時はプロセスの cwd）、`timeout` はミリ秒（既定 15000）、
 *   `maxBuffer` は stdout / stderr の最大バイト数（既定 64MiB）
 * @returns `ok` は終了コード 0 かどうか。`out` は成功時は stdout、失敗時は stderr（無ければ stdout、それも無ければエラーメッセージ）を trim したもの
 */
export function runCommand(cmd: string, args: string[], opts: { cwd?: string; timeout?: number; maxBuffer?: number } = {}): { ok: boolean; out: string } {
  try {
    const out = execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: opts.timeout ?? 15_000, cwd: opts.cwd, maxBuffer: opts.maxBuffer ?? 64 * 1024 * 1024 });
    return { ok: true, out: out.trim() };
  } catch (e: any) {
    return { ok: false, out: String(e.stderr || e.stdout || e.message).trim() };
  }
}

/**
 * {@link runCommand} の非同期版。長い外部コマンド（gh の取得など）でイベントループを塞がないために使う。
 *
 * @param cmd 実行するコマンド名（PATH から解決。例: gh）
 * @param args コマンド引数の配列
 * @param opts cwd / timeout（ms、既定 15000）/ maxBuffer（バイト、既定 64MiB）
 * @returns ok は終了コード 0 か。out は成功時 stdout、失敗時は stderr（無ければ stdout かエラーメッセージ）を trim したもの
 */
export function runCommandAsync(cmd: string, args: string[], opts: { cwd?: string; timeout?: number; maxBuffer?: number } = {}): Promise<{ ok: boolean; out: string }> {
  return new Promise((resolve) => {
    execFile(cmd, args, { encoding: "utf8", timeout: opts.timeout ?? 15_000, cwd: opts.cwd, maxBuffer: opts.maxBuffer ?? 64 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) resolve({ ok: false, out: String(stderr || stdout || err.message).trim() });
      else resolve({ ok: true, out: String(stdout).trim() });
    });
  });
}

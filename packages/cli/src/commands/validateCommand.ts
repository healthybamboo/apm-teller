import type { ValidateConventionUseCase } from "@apm-teller/core";
import type { CliCommand } from "./command";

/**
 * Claude Code hook の stdin JSON。
 */
export interface HookPayload {
  /**
   * PostToolUse hook でツールに渡された入力。Write / Edit の場合は `file_path` に対象ファイルの絶対パスが入る。
   */
  tool_input?: { file_path?: string };
}

/**
 * `apm-teller validate` のオプション。
 */
export interface ValidateOptions {
  /**
   * 検証するファイルの vault ルートからの相対パス（例: `.teller/conventions/foo.md`）。`--all` / `--hook` 時は無視される。
   */
  files: string[];

  /**
   * true なら convention ディレクトリ配下を全件検証する。
   */
  all?: boolean;

  /**
   * true なら Claude Code hook として動作し、stdin の payload から対象ファイルを取る。
   */
  hook?: boolean;
}

/**
 * convention ファイルの検証。`--hook` では PostToolUse の payload から対象ファイルを取り、
 * 失敗時は exit 2（Claude Code が stderr をモデルへ差し戻す）。
 */
export class ValidateCommand implements CliCommand<ValidateOptions> {
  constructor(private readonly validate: ValidateConventionUseCase, private readonly readPayload: () => Promise<HookPayload>) {}

  /**
   * convention を検証し、エラーがあれば stderr に一覧を出して 2 を返す。
   * hook モードで payload に `file_path` が無ければ何もせず 0 を返す。
   *
   * @param o 検証オプション。`files` は vault 相対パスの配列、`all` は全件検証フラグ、`hook` は Claude Code hook モードフラグ
   * @returns エラーなしなら 0、検証エラーがあれば 2
   */
  async run(o: ValidateOptions): Promise<number> {
    let errors: string[] = [];
    if (o.all) errors = this.validate.all();
    else if (o.hook) {
      const fp = (await this.readPayload()).tool_input?.file_path;
      if (!fp) return 0;
      errors = this.validate.file(fp);
    } else {
      for (const f of o.files) errors.push(...this.validate.file(f));
    }
    if (errors.length === 0) {
      if (!o.hook) console.log(o.all ? "all conventions valid" : `${o.files.length} file(s) valid`);
      return 0;
    }
    console.error(["apm-teller: convention validation failed", ...errors.map((e) => `  - ${e}`)].join("\n"));
    return 2;
  }
}

/**
 * stdin 全体を JSON として読む。Claude Code hook の payload 取得に使う。
 *
 * @returns パースした hook payload。stdin が空なら空オブジェクト
 * @throws {SyntaxError} stdin の内容が JSON として不正な場合
 */
export async function readStdinJson(): Promise<HookPayload> {
  const chunks: Buffer[] = [];
  for await (const c of process.stdin) chunks.push(c as Buffer);
  const s = Buffer.concat(chunks).toString("utf8").trim();
  return s ? JSON.parse(s) : {};
}

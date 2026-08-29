import type { PromoteConventionUseCase, PromoteRequestDto } from "@apm-teller/core";
import type { CliCommand } from "./command";

/**
 * 承認済み convention をパッケージへ書き出す。
 */
export class PromoteCommand implements CliCommand<PromoteRequestDto> {
  constructor(private readonly promote: PromoteConventionUseCase) {}

  /**
   * convention を skill / instruction としてパッケージへ昇格させ、書き出し先パスを表示する。
   * パッケージが新規作成された場合は `apm pack` の実行を促すメッセージを添える。
   *
   * @param req 昇格リクエスト。`id` は convention の id（`.teller/conventions/<id>.md` のファイル名部分）、
   *   `package` は書き出し先ローカルパッケージ名（kebab-case、存在しなければ新規作成）、
   *   `kind` は `skill` | `instruction`（省略時は convention の kind）、`name` は skill ディレクトリ名 / instruction ファイル名（省略時は id）、
   *   `applyTo` は instruction の適用対象 glob（例: `**\/*.ts`）
   * @returns 常に 0（失敗は例外で通知される）
   * @throws {NotFoundError} `req.id` に該当する convention が存在しない場合
   * @throws {InvariantViolation} convention が accepted でない、対象パッケージがリモート、パッケージ名や成果物名が kebab-case でない、または同名の成果物が既に存在する場合
   */
  run(req: PromoteRequestDto) {
    const r = this.promote.execute(req);
    console.log(`→ ${r.target}${r.packageCreated ? " (package created — run `apm pack`)" : ""}`);
    return 0;
  }
}

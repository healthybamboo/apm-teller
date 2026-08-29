import type { MineConventionsUseCase } from "@apm-teller/core";
import type { CliCommand } from "./command";

/**
 * `apm-teller mine` のオプション。
 */
export interface MineCommandOptions {
  /**
   * 対象 repo の一覧。`owner/repo` 形式（例: `microsoft/apm`）で、teller.yml の mining.sources に登録済みのものに限る。
   * 空配列なら設定済み全件を対象にする。
   */
  repos: string[];

  /**
   * true なら gh による生データの再取得を省略し、`.teller/raw` に残っている前回の取得結果を再利用する。
   */
  skipFetch?: boolean;

  /**
   * true ならエージェント（`claude -p`）を起動せず、起動コマンドの内容を表示した時点で終了する。
   */
  dryRun?: boolean;

  /**
   * true なら実行前の前提条件チェック（doctor）を省略する。
   */
  skipDoctor?: boolean;

  /**
   * 使うエージェント（claude / codex）。省略時は teller.yml の設定。
   */
  agent?: "claude" | "codex";
}

/**
 * gh → claude -p のマイニングを前面で実行する。
 */
export class MineCommand implements CliCommand<MineCommandOptions> {
  constructor(private readonly mine: MineConventionsUseCase) {}

  /**
   * マイニングを実行し、進行ログを標準出力へ流す。完了後に run ID と終了コードを表示する。
   *
   * @param o commander がパースした `mine` のオプション。`repos` は `owner/repo` 形式の配列（空なら全件）、
   *   `skipFetch` / `dryRun` / `skipDoctor` は各フラグの有無
   * @returns エージェント（`claude -p`）の終了コード（0 が成功、起動失敗は 127）。dry-run 時は常に 0
   * @throws {DomainError} doctor の必須項目が失敗した場合（code: `not_ready`）、または mining source が 1 件も設定されていない場合（code: `not_configured`）
   * @throws {InvariantViolation} `repos` に teller.yml へ未登録の repo が含まれる場合
   */
  async run(o: MineCommandOptions) {
    const r = await this.mine.execute({ ...o, log: console.log });
    console.log(`run ${r.runId} finished (exit ${r.exit})`);
    return r.exit;
  }
}

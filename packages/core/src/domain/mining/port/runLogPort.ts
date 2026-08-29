import type { Logger } from "../../shared/logger";

/**
 * マイニング実行ログの永続化ポート。run ID ごとにトランスクリプトとサマリを保存する。
 */
export interface RunLogPort {
  /**
   * トランスクリプトファイルを開き、行書き込み用のコールバックとクローズ関数を返す。
   *
   * @param runId RunIdGenerator が発行した run ID（例: 2026-08-30T12-34-56）。
   * @returns write は 1 行追記するコールバック、close はファイルを閉じる関数。
   */
  open(runId: string): { write: Logger; close(): void };

  /**
   * 実行結果のサマリ（コミット可能な Markdown）を書く。
   *
   * @param runId 対象の run ID。
   * @param summary 対象 repo（owner/repo）の一覧と、抽出エージェントの終了コード。
   */
  summarize(runId: string, summary: { sources: string[]; exit: number }): void;

  /**
   * 過去に実行された run ID を新しい順で列挙する。
   *
   * @returns run ID の一覧（新しい順）。
   */
  listPast(): string[];

  /**
   * トランスクリプトを読み込む。
   *
   * @param runId 対象の run ID。
   * @returns トランスクリプトの行配列。ファイルが無ければ undefined。
   */
  read(runId: string): string[] | undefined;
}

import type { MiningSource } from "../schema/schema";
import type { Logger, ProgressReporter } from "../../shared/logger";

/**
 * レビュー履歴を取得して生データ（JSON）として保存する外部ポート（実装: gh CLI）。
 */
export interface ReviewSourcePort {
  /**
   * 対象 repo の直近 PR からレビュー・コメントを取得し、PR ごとに JSON ファイルへ書き出す。
   *
   * @param source 対象 repo（owner/repo）、取得する PR 数、含める種別（reviews / review_comments / issue_comments）。
   * @param rawDir JSON を書き出すディレクトリの絶対パス。
   * @param log 取得の進捗を 1 行ずつ受け取るコールバック。
   * @param progress PR ごとの進捗通知（省略可）
   * @returns 書き出した PR ファイル数（非同期。取得中もサーバーが応答できるよう同期実行してはならない）。
   */
  fetch(source: MiningSource, rawDir: string, log: Logger, progress?: ProgressReporter): Promise<number>;
}

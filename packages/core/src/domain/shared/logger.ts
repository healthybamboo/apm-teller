/**
 * 進捗・診断メッセージを 1 行ずつ受け取るコールバック。
 * ポート（gh 取得・エージェント実行・実行ログ）が呼び出し元へ進捗を返すために使う。
 */
export type Logger = (line: string) => void;

/**
 * 進捗の構造化通知。
 *
 * @param done 完了した件数
 * @param total 全体の件数（不明なら 0）
 * @param label 現在処理中の対象の短い説明（例: "PR #63"）
 */
export type ProgressReporter = (done: number, total: number, label?: string) => void;

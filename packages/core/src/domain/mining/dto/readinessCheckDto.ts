/**
 * doctor の検査 1 項目。`required` はマイニング実行の必須条件かどうか。
 */
export interface ReadinessCheckDto {
  /**
   * 項目の識別子（例: "gh-auth"、"repo:owner/name"、"sources"）。
   */
  id: string;

  /**
   * 一覧に表示する項目名（例: "gh authenticated"）。
   */
  label: string;

  /**
   * 検査に合格したか。
   */
  ok: boolean;

  /**
   * 結果の補足（バージョン文字列やエラー理由）。無ければ省略。
   */
  detail?: string;

  /**
   * true ならこの項目の失敗でマイニングを実行できない。
   */
  required: boolean;

  /**
   * 失敗時の対処法（実行すべきコマンドや参照 URL）。無ければ省略。
   */
  fix?: string;
}

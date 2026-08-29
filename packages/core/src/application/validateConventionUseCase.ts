import type { Dependencies } from "./dependencies";

/**
 * hook / CLI 用: Claude が書いた convention ファイルの検証。対象外のファイルは無視（空配列）。
 */
export class ValidateConventionUseCase {
  constructor(private readonly d: Pick<Dependencies, "conventions">) {}

  /**
   * 1 ファイルを検証してエラー一覧を返す。convention ディレクトリ外のファイルは検証しない。
   *
   * @param file 検証するファイルのパス。vault ルートからの相対パスまたは絶対パス（例: .teller/conventions/prefer-named-exports.md）
   * @returns エラーメッセージの一覧（問題なし・対象外なら空配列）
   */
  file(file: string): string[] {
    return this.d.conventions.owns(file) ? this.d.conventions.validateFile(file) : [];
  }

  /**
   * convention ディレクトリ内の全ファイルを検証してエラー一覧を返す。
   *
   * @returns 全ファイル分のエラーメッセージを平坦化した一覧（問題なしなら空配列）
   */
  all(): string[] {
    return this.d.conventions.list().invalid.flatMap((i) => i.errors);
  }
}

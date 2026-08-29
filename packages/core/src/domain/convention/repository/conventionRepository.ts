import type { Convention } from "../aggregate/convention";

/**
 * 読み込めなかった convention ファイルの報告（GUI で「壊れたファイル」として表示）。
 */
export interface InvalidConventionFileDto {
  /**
   * 壊れたファイルの vault 相対パス。
   */
  file: string;

  /**
   * 読み込みに失敗した理由（スキーマ違反・本文ポリシー違反など）。
   */
  errors: string[];
}

/**
 * Convention 集約の読み書きポート（1 ファイル = 1 集約）。
 */
export interface ConventionRepository {
  /**
   * convention ディレクトリを走査し、有効な convention と壊れたファイルを分けて返す。
   *
   * @returns 復元できた集約の一覧と、読み込めなかったファイルの報告。
   */
  list(): { conventions: Convention[]; invalid: InvalidConventionFileDto[] };

  /**
   * id に対応する convention を探す。
   *
   * @param id convention の識別子（kebab-case、`.teller/conventions/<id>.md` のファイル名部分）。
   * @returns 見つかった Convention。存在しない、または壊れている場合は undefined。
   */
  find(id: string): Convention | undefined;

  /**
   * convention を Markdown + front matter として保存する。
   *
   * @param convention 保存する Convention 集約。toProps() が front matter、body が本文として書かれる。
   * @returns 書き込んだファイルの vault 相対パス。
   */
  save(convention: Convention): string;

  /**
   * 任意ファイル（vault 相対）を convention として検証する。
   * hook 用にファイル名と front matter の id の一致も確認する。
   *
   * @param file 検証するファイルの vault ルートからの相対パス（例: .teller/conventions/foo.md）。
   * @returns 違反の説明文。問題がなければ空配列。
   */
  validateFile(file: string): string[];

  /**
   * convention ディレクトリ配下のファイルかを判定する。
   * hook が対象外の書き込みを無視するために使う。
   *
   * @param file 判定するファイルの vault ルートからの相対パス（例: .teller/conventions/foo.md）。
   * @returns convention ディレクトリ配下なら true。
   */
  owns(file: string): boolean;
}

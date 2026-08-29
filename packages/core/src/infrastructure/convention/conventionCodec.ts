import { Convention } from "../../domain/convention";
import { FrontMatterCodec } from "../shared/frontMatter";

/**
 * Convention 集約 ↔ Markdown（front matter）テキストの相互変換。
 */
export class ConventionCodec {
  constructor(private readonly fm = new FrontMatterCodec()) {}

  /**
   * ファイル内容から集約を復元する。
   *
   * @param text `<id>.md` の全文。YAML front matter（id / title / status / sources など）と Markdown 本文からなる
   * @returns 検証・既定値補完済みの Convention 集約
   * @throws {InvariantViolation} front matter がスキーマに適合しない、または本文が必須セクション・最小長のポリシーを満たさない場合
   */
  decode(text: string): Convention {
    const { data, body } = this.fm.parse(text);
    return Convention.create(data, body);
  }

  /**
   * 集約をファイル内容に変換する。
   *
   * @param c 書き出す Convention 集約
   * @returns front matter と本文を結合した `<id>.md` の全文
   */
  encode(c: Convention): string { return this.fm.stringify(c.body, c.toProps()); }
}

import fs from "node:fs";
import YAML from "yaml";

/**
 * YAML ファイルの読み書き。コメントを保持したい更新は {@link YamlFile.update} を使う。
 */
export class YamlFile {
  constructor(readonly path: string) {}

  /**
   * ファイルが存在するかを判定する。
   *
   * @returns 存在すれば true
   */
  exists() { return fs.existsSync(this.path); }

  /**
   * パースした内容を返す。存在しない、または内容が空なら空オブジェクト。
   *
   * @returns YAML をパースした値（既定は any。呼び出し側で型を指定できる）
   */
  read<T = any>(): T {
    if (!this.exists()) return {} as T;
    return (YAML.parse(fs.readFileSync(this.path, "utf8")) ?? {}) as T;
  }

  /**
   * ドキュメントとして開き、コメントを保ったまま編集して書き戻す。ファイルが無ければ空ドキュメントから始める。
   *
   * @param fn 編集コールバック。yaml ライブラリの Document を受け取り、`set` / `setIn` / `getIn` などでその場で変更する
   */
  update(fn: (doc: YAML.Document) => void) {
    const doc = this.exists() ? YAML.parseDocument(fs.readFileSync(this.path, "utf8")) : new YAML.Document({});
    fn(doc);
    fs.writeFileSync(this.path, doc.toString({ lineWidth: 0 }));
  }

  /**
   * 内容を丸ごと書き出す（コメントは保持しない）。
   *
   * @param data YAML 化して書き込む値（通常はプレーンなオブジェクト）
   */
  write(data: unknown) { fs.writeFileSync(this.path, YAML.stringify(data, { lineWidth: 0 })); }
}

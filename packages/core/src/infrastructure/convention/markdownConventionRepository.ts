import fs from "node:fs";
import path from "node:path";
import { Convention, type ConventionRepository, type InvalidConventionFileDto } from "../../domain/convention";
import { InvariantViolation } from "../../domain/shared";
import { ConventionCodec } from "./conventionCodec";

/**
 * `<layout.conventions>/<id>.md` を 1 ファイル 1 集約として扱う {@link ConventionRepository} 実装。
 */
export class MarkdownConventionRepository implements ConventionRepository {
  private readonly dir: string;

  constructor(private readonly root: string, conventionsDir: string, private readonly codec = new ConventionCodec()) {
    this.dir = path.join(root, conventionsDir);
  }

  /**
   * このリポジトリが管理する convention ディレクトリ配下の `.md` かを判定する（hook がどのファイル書き込みを検証すべきか決めるために使う）。
   *
   * @param file 判定するファイルのパス。vault ルートからの相対パスまたは絶対パス（例: .teller/conventions/foo.md）
   * @returns `<layout.conventions>/` 直下の `.md` なら true
   */
  owns(file: string): boolean {
    const abs = path.resolve(this.root, file);
    return abs.startsWith(this.dir + path.sep) && abs.endsWith(".md");
  }

  /**
   * ディレクトリ内の全 `.md` をファイル名順に読み、有効/無効に分けて返す。ディレクトリが無ければ両方空。
   *
   * @returns `conventions`（復元できた集約の配列）と `invalid`（vault 相対パスとエラーメッセージの組の配列）
   */
  list() {
    const conventions: Convention[] = [];
    const invalid: InvalidConventionFileDto[] = [];
    if (!fs.existsSync(this.dir)) return { conventions, invalid };
    for (const f of fs.readdirSync(this.dir).filter((f) => f.endsWith(".md")).sort()) {
      const rel = path.relative(this.root, path.join(this.dir, f));
      const errors = this.validateFile(rel);
      if (errors.length) invalid.push({ file: rel, errors });
      else conventions.push(this.decode(path.join(this.dir, f)));
    }
    return { conventions, invalid };
  }

  /**
   * id に対応するファイルを読む。無い・壊れている場合は undefined。
   *
   * @param id convention の kebab-case id。`<id>.md` というファイル名で探す（例: prefer-named-exports）
   * @returns 復元した Convention 集約。ファイルが存在しない、または検証に失敗した場合は undefined
   */
  find(id: string): Convention | undefined {
    const f = path.join(this.dir, `${id}.md`);
    if (!fs.existsSync(f)) return undefined;
    try { return this.decode(f); } catch { return undefined; }
  }

  /**
   * `<id>.md` に書き出し、vault 相対パスを返す。ディレクトリが無ければ作成する。
   *
   * @param c 保存する Convention 集約。id がファイル名になる
   * @returns 書き出したファイルの vault ルートからの相対パス（例: .teller/conventions/prefer-named-exports.md）
   */
  save(c: Convention): string {
    fs.mkdirSync(this.dir, { recursive: true });
    const f = path.join(this.dir, `${c.id}.md`);
    fs.writeFileSync(f, this.codec.encode(c));
    return path.relative(this.root, f);
  }

  /**
   * ファイルを検証し、エラー一覧を返す（hook 用）。存在・front matter / 本文の妥当性・ファイル名と id の一致を確認する。
   *
   * @param file 検証するファイルのパス。vault ルートからの相対パスまたは絶対パス（例: .teller/conventions/foo.md）
   * @returns `<相対パス>: <理由>` 形式のエラーメッセージの配列（問題なしなら空配列）
   */
  validateFile(file: string): string[] {
    const abs = path.resolve(this.root, file);
    const rel = path.relative(this.root, abs);
    if (!fs.existsSync(abs)) return [`${rel}: file not found`];
    let c: Convention;
    try { c = this.decode(abs); }
    catch (e) {
      if (e instanceof InvariantViolation) return e.issues.map((i) => `${rel}: ${i}`);
      return [`${rel}: ${(e as Error).message}`];
    }
    const expected = `${c.id}.md`;
    return path.basename(abs) === expected ? [] : [`${rel}: file name must be ${expected} (matches id)`];
  }

  private decode(abs: string): Convention { return this.codec.decode(fs.readFileSync(abs, "utf8")); }
}

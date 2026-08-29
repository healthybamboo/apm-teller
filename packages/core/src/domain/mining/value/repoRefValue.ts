import { InvariantViolation } from "../../shared";

/**
 * GitHub 系ホスト上のリポジトリ参照（値オブジェクト）。
 * `owner/repo` 短縮形・HTTPS URL・SSH URL のいずれからも生成でき、セルフホスト（GitHub Enterprise）も扱う。
 */
export class RepoRefValue {
  /**
   * 既定ホスト。teller.yml では host が省略されたときこの値とみなす。
   */
  static readonly DEFAULT_HOST = "github.com";

  private constructor(readonly host: string, readonly owner: string, readonly name: string) {}

  /**
   * ユーザー入力を解釈する。
   *
   * @param input `owner/repo`、`https://github.com/owner/repo`、`https://ghe.example.com/owner/repo.git`、`git@ghe.example.com:owner/repo.git` のいずれか。URL は `/pull/12` など後続パスがあっても可（前後の空白は無視）
   * @returns 解釈したリポジトリ参照
   * @throws {InvariantViolation} どの形式にも当てはまらない場合
   */
  static parse(input: string): RepoRefValue {
    const s = input.trim();
    let m = s.match(/^(?:https?:\/\/)([^/]+)\/([^/]+)\/([^/#?]+?)(?:\.git)?(?:[/#?].*)?$/);
    if (m) return new RepoRefValue(m[1]!.toLowerCase(), m[2]!, m[3]!);
    m = s.match(/^(?:ssh:\/\/)?git@([^:/]+)[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
    if (m) return new RepoRefValue(m[1]!.toLowerCase(), m[2]!, m[3]!);
    m = s.match(/^([\w.-]+)\/([\w.-]+)$/);
    if (m) return new RepoRefValue(RepoRefValue.DEFAULT_HOST, m[1]!, m[2]!);
    throw new InvariantViolation(`not a repository reference: "${input}" (expected owner/repo or a GitHub URL)`, [], { key: "mining.badRepoRef", params: { input } });
  }

  /**
   * `owner/repo` 形式。
   */
  get slug(): string { return `${this.owner}/${this.name}`; }

  /**
   * github.com 以外のホストか。
   */
  get isSelfHosted(): boolean { return this.host !== RepoRefValue.DEFAULT_HOST; }

  /**
   * ブラウザで開ける URL。
   */
  get url(): string { return `https://${this.host}/${this.slug}`; }
}

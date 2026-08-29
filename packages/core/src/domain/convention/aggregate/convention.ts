import { AggregateRoot, InvariantViolation } from "../../shared";
import { ConventionPropsSchema, type ConventionProps, type ConventionStatus, type ConventionKind } from "../schema/schema";
import { ConventionBodyPolicy } from "../service/bodyPolicy";
import { canTransition } from "../schema/transitions";

const DEFAULT_POLICY = new ConventionBodyPolicy();

/**
 * Convention 集約ルート（エンティティ、識別子 = id）。
 * レビュー履歴から抽出した「暗黙のチーム規約」。審査（承認/却下）と昇格の状態遷移をここで強制する。
 * 永続化表現（Markdown + front matter）は {@link ConventionRepository} 実装の責務。
 */
export class Convention extends AggregateRoot<string> {
  private constructor(private props: ConventionProps, private _body: string, private readonly policy: ConventionBodyPolicy) { super(); }

  /**
   * front matter と本文から集約を生成する。
   * スキーマ違反と本文ポリシー違反をまとめて検証し、hook はこの issues をそのまま Claude に返す。
   *
   * @param raw `.teller/conventions/<id>.md` の YAML front matter をパースした生オブジェクト（スキーマ未検証）。id・title・sources が必須。
   * @param body front matter を除いた規約本文（Markdown）。`## Rule` `## Rationale` の見出しを含むことを期待する。
   * @param policy 本文の必須セクション・最小文字数を定めるポリシー。省略時は既定（Rule / Rationale、20 文字以上）。
   * @returns 検証済みの Convention。
   * @throws {InvariantViolation} raw がスキーマに適合しない、または body がポリシーに違反する場合。issues に理由を列挙する。
   */
  static create(raw: unknown, body: string, policy: ConventionBodyPolicy = DEFAULT_POLICY): Convention {
    const res = ConventionPropsSchema.safeParse(raw);
    const issues: string[] = [];
    if (!res.success) issues.push(...res.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`));
    issues.push(...policy.validate(body));
    if (issues.length) throw new InvariantViolation("invalid convention", issues);
    return new Convention(res.data!, body, policy);
  }

  /**
   * 識別子。`.teller/conventions/<id>.md` のファイル名と一致する。
   */
  get id() { return this.props.id; }

  /**
   * ライフサイクル状態（proposed / accepted / rejected / promoted）。
   */
  get status(): ConventionStatus { return this.props.status; }

  /**
   * 昇格先の種別（skill または instruction）。
   */
  get kind(): ConventionKind { return this.props.kind; }

  /**
   * 人間向けのタイトル。
   */
  get title() { return this.props.title; }

  /**
   * 規約本文（Markdown、front matter を除く）。
   */
  get body() { return this._body; }

  /**
   * 永続化用の front matter スナップショットを返す。
   * 防御的コピーなので、戻り値を変更しても集約には影響しない。
   *
   * @returns front matter の深いコピー。
   */
  toProps(): ConventionProps { return structuredClone(this.props); }

  private transition(to: ConventionStatus) {
    if (!canTransition(this.props.status, to)) throw new InvariantViolation(`cannot move convention ${this.id} from ${this.props.status} to ${to}`, [], { key: "convention.invalidTransition", params: { id: this.id, from: this.props.status, to } });
    this.props = { ...this.props, status: to };
  }

  /**
   * 審査で採用し、状態を accepted にする。
   *
   * @throws {InvariantViolation} 現在の状態から accepted へ遷移できない場合（promoted など）。
   */
  accept() { this.transition("accepted"); }

  /**
   * 審査で却下し、状態を rejected にする。
   *
   * @throws {InvariantViolation} 現在の状態から rejected へ遷移できない場合（promoted など）。
   */
  reject() { this.transition("rejected"); }

  /**
   * 却下・採用を取り消して proposed に戻し、再検討の対象にする。
   *
   * @throws {InvariantViolation} 現在の状態から proposed へ遷移できない場合（proposed / promoted）。
   */
  reopen() { this.transition("proposed"); }

  /**
   * パッケージへ昇格済みとして記録し、昇格先の情報を front matter に残す。accepted からのみ可能。
   *
   * @param target 書き出した成果物ファイルの vault 相対パス（例: packages/foo/.apm/skills/bar/SKILL.md）。promoted_to に記録する。
   * @param packageName 成果物を追加したローカルパッケージ名（kebab-case）。
   * @param kind 実際に書き出した成果物の種別（"skill" | "instruction"）。
   * @throws {InvariantViolation} 状態が accepted でない場合。
   */
  markPromoted(target: string, packageName: string, kind: ConventionKind) {
    this.transition("promoted");
    this.props = { ...this.props, promoted_to: target, package: packageName, kind };
  }

  /**
   * タイトル・タグ・種別・本文を審査中に編集する。promoted 後は読み取り専用。
   * 指定した項目だけ差し替え、結果全体を再検証してから反映する。
   *
   * @param patch 変更する項目。title は 1 文字以上、tags は文字列配列、kind は "skill" | "instruction"、body は Markdown 本文。省略した項目は現在値を維持する。
   * @throws {InvariantViolation} 状態が promoted の場合、または変更後の front matter・本文が検証に通らない場合。
   */
  edit(patch: { title?: string; tags?: string[]; kind?: ConventionKind; body?: string }) {
    if (this.props.status === "promoted") throw new InvariantViolation(`convention ${this.id} is promoted and read-only`, [], { key: "convention.readOnly", params: { id: this.id } });
    const next = ConventionPropsSchema.safeParse({ ...this.props, ...(patch.title && { title: patch.title }), ...(patch.tags && { tags: patch.tags }), ...(patch.kind && { kind: patch.kind }) });
    const body = patch.body ?? this._body;
    const issues = [...this.policy.validate(body), ...(next.success ? [] : next.error.issues.map((i) => i.message))];
    if (issues.length) throw new InvariantViolation("invalid edit", issues, { key: "convention.invalidEdit" });
    this.props = next.data!;
    this._body = body;
  }
}

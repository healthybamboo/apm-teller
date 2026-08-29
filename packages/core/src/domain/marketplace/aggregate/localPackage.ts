import { AggregateRoot, InvariantViolation, isKebabCase } from "../../shared";
import type { ArtifactValue, PackageManifestValue } from "../value/artifactValue";

/**
 * LocalPackage 集約ルート（識別子 = パッケージ名）。
 * 成果物名の一意性を守り、未保存の成果物を保持する。ディレクトリ構造は {@link LocalPackageRepository} の責務。
 */
export class LocalPackage extends AggregateRoot<string> {
  private pending: ArtifactValue[] = [];

  constructor(
    readonly manifest: PackageManifestValue,
    private readonly existing: { skills: string[]; instructions: string[] },
  ) { super(); }

  /**
   * 識別子。パッケージ名（kebab-case）と同じ。
   */
  get id() { return this.manifest.name; }

  /**
   * マニフェストに書かれたパッケージ名（kebab-case）。
   */
  get name() { return this.manifest.name; }

  /**
   * addArtifact で追加され、まだリポジトリに書き出されていない成果物。
   */
  get pendingArtifacts(): readonly ArtifactValue[] { return this.pending; }

  /**
   * 成果物を未保存キューに追加する。同種別で同名の成果物（保存済み・未保存とも）があれば拒否する。
   *
   * @param a 追加する成果物。name は kebab-case で、種別内で一意でなければならない。
   * @throws {InvariantViolation} name が kebab-case でない場合、または同種別・同名の成果物が既に存在する場合。
   */
  addArtifact(a: ArtifactValue) {
    if (!isKebabCase(a.name)) throw new InvariantViolation(`artifact name must be kebab-case: ${a.name}`, [], { key: "package.badArtifactName", params: { name: a.name } });
    const taken = a.kind === "skill" ? this.existing.skills : this.existing.instructions;
    if (taken.includes(a.name) || this.pending.some((p) => p.kind === a.kind && p.name === a.name)) {
      throw new InvariantViolation(`${a.kind} "${a.name}" already exists in package ${this.name}`, [], { key: "package.artifactExists", params: { kind: a.kind, name: a.name, pkg: this.name } });
    }
    this.pending.push(a);
  }

  /**
   * 未保存の成果物を保存済みとして確定し、キューを空にする。リポジトリが書き出しに成功した後に呼ぶ。
   */
  flush() {
    for (const a of this.pending) (a.kind === "skill" ? this.existing.skills : this.existing.instructions).push(a.name);
    this.pending = [];
  }
}

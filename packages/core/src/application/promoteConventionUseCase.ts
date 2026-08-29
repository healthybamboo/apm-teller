import type { Dependencies } from "./dependencies";
import { NotFoundError, InvariantViolation } from "../domain/shared";
import type { ConventionKind } from "../domain/convention";
import type { ArtifactValue } from "../domain/marketplace";

/**
 * 昇格リクエスト。
 */
export interface PromoteRequestDto {
  /**
   * 昇格する convention の id。
   */
  id: string;

  /**
   * 書き出し先のローカルパッケージ名（存在しなければ新規作成）。
   */
  package: string;

  /**
   * 成果物の種別。省略時は convention の kind。
   */
  kind?: ConventionKind;

  /**
   * skill ディレクトリ名 / instruction ファイル名。省略時は convention の id。
   */
  name?: string;

  /**
   * instruction の applyTo（適用対象 glob）。
   */
  applyTo?: string;
}

/**
 * 昇格結果。
 */
export interface PromoteResultDto {
  /**
   * 書き出した成果物の vault 相対パス。
   */
  target: string;

  /**
   * パッケージを新規作成したか（true なら `apm pack` が必要）。
   */
  packageCreated: boolean;
}

/**
 * 承認済み convention をパッケージの Skill / Instruction として書き出す。
 * 3 つの集約（Convention, Vault, LocalPackage）をまたぐ調整役。
 */
export class PromoteConventionUseCase {
  constructor(
    private readonly d: Pick<Dependencies, "conventions" | "vaults" | "packages" | "provenance">,
    private readonly newPackage = { description: "Team conventions mined by apm-teller", targets: ["claude", "copilot", "vscode"], license: "MIT" },
  ) {}

  /**
   * 昇格を実行し、書き出した成果物のパスを返す。accepted 以外は例外。
   *
   * @param req 昇格リクエスト。`id`（convention の kebab-case id）、`package`（書き出し先のローカルパッケージ名、未存在なら新規作成）、任意の `kind` / `name` / `applyTo`
   * @returns 書き出した成果物の vault 相対パスと、パッケージを新規作成したかどうか
   * @throws {NotFoundError} id に対応する convention が存在しない（または読めない）場合
   * @throws {InvariantViolation} convention が accepted でない場合、対象がリモートパッケージの場合、パッケージ名や成果物名が kebab-case でない場合、同名の成果物がすでにパッケージにある場合
   */
  execute(req: PromoteRequestDto): PromoteResultDto {
    const conv = this.d.conventions.find(req.id);
    if (!conv) throw new NotFoundError(`convention ${req.id}`, { key: "convention.notFound", params: { id: req.id } });
    if (conv.status !== "accepted") throw new InvariantViolation(`convention ${req.id} must be accepted before promotion (status: ${conv.status})`, [], { key: "convention.notAccepted", params: { id: req.id, status: conv.status } });

    const vault = this.d.vaults.load();
    const existing = vault.find(req.package);
    if (existing && !existing.local) throw new InvariantViolation(`package ${req.package} is remote; promote only into local packages`, [], { key: "package.remote", params: { name: req.package } });

    let pkg = this.d.packages.find(req.package);
    let created = false;
    if (!pkg) {
      const reg = vault.registerLocalPackage(req.package, this.newPackage.description);
      this.d.vaults.register(reg);
      pkg = this.d.packages.create({ name: reg.name, version: reg.version, description: reg.description, targets: this.newPackage.targets, license: this.newPackage.license });
      created = true;
    }

    const kind = req.kind ?? conv.kind;
    const name = req.name ?? conv.id;
    const body = conv.body.trim() + this.d.provenance.format(conv.toProps());
    const artifact: ArtifactValue = kind === "skill"
      ? { kind, name, description: conv.title, body }
      : { kind, name, description: conv.title, body, applyTo: req.applyTo };
    pkg.addArtifact(artifact);
    const [written] = this.d.packages.save(pkg);

    conv.markPromoted(written.file, req.package, kind);
    this.d.conventions.save(conv);
    return { target: written.file, packageCreated: created };
  }
}

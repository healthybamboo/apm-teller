import fs from "node:fs";
import path from "node:path";
import { LocalPackage, DEFAULT_VAULT_CONVENTIONS, type LocalPackageRepository, type PackageManifestValue, type ArtifactValue, type VaultConventions } from "../../domain/marketplace";
import { YamlFile } from "../shared/yamlFile";
import { FrontMatterCodec } from "../shared/frontMatter";
import { ApmPackageScanner, APM_LAYOUT } from "./apmPackageScanner";

/**
 * packages/<name>/ 配下のマニフェストと成果物を扱う {@link LocalPackageRepository} 実装。
 */
export class FsLocalPackageRepository implements LocalPackageRepository {
  constructor(
    private readonly root: string,
    private readonly scanner = new ApmPackageScanner(root),
    private readonly fm = new FrontMatterCodec(),
    private readonly conventions: VaultConventions = DEFAULT_VAULT_CONVENTIONS,
  ) {}

  private dir(name: string) { return path.join(this.root, this.conventions.packagesDir, name); }

  /**
   * packages/<name>/apm.yml があれば集約として読み込む。
   *
   * @param name パッケージ名。`<packagesDir>/<name>` のディレクトリ名に対応する kebab-case 文字列（例: review-conventions）
   * @returns マニフェストと既存の skill / instruction 名を持つ LocalPackage 集約。apm.yml が無ければ undefined
   */
  find(name: string): LocalPackage | undefined {
    const yml = new YamlFile(path.join(this.dir(name), "apm.yml"));
    if (!yml.exists()) return undefined;
    const m = yml.read();
    const manifest: PackageManifestValue = { name: m.name ?? name, version: String(m.version ?? ""), description: m.description ?? "", author: m.author, targets: m.targets ?? [] };
    const scanned = this.scanner.scan(path.relative(this.root, this.dir(name)));
    return new LocalPackage(manifest, { skills: scanned.skills.map((s) => s.name), instructions: scanned.instructions.map((i) => i.name) });
  }

  /**
   * apm.yml と plugin.json を生成してパッケージを作る。
   *
   * @param manifest 生成するパッケージのマニフェスト。name（kebab-case）/ version / description / targets（claude, copilot など）、任意の author / license（省略時 MIT）
   * @returns 成果物を持たない空の LocalPackage 集約
   */
  create(manifest: PackageManifestValue): LocalPackage {
    const dir = this.dir(manifest.name);
    fs.mkdirSync(path.join(dir, APM_LAYOUT.dir), { recursive: true });
    new YamlFile(path.join(dir, "apm.yml")).write({
      name: manifest.name, version: manifest.version, description: manifest.description,
      ...(manifest.author && { author: manifest.author }),
      license: manifest.license ?? "MIT",
      targets: manifest.targets, dependencies: { apm: [], mcp: [] }, includes: "auto", devDependencies: { apm: [] }, scripts: {},
    });
    fs.writeFileSync(path.join(dir, "plugin.json"), JSON.stringify({ name: manifest.name, version: manifest.version, description: manifest.description, license: manifest.license ?? "MIT" }, null, 2) + "\n");
    return new LocalPackage(manifest, { skills: [], instructions: [] });
  }

  /**
   * 未保存の成果物をファイルに書き出し、集約の保留分をクリアする。skill は `.apm/skills/<name>/SKILL.md`、instruction は `.apm/instructions/<name>.instructions.md`。
   *
   * @param pkg 書き出す LocalPackage 集約（`pendingArtifacts` が対象）
   * @returns 書き出した成果物と、そのファイルの vault ルートからの相対パスの組の配列
   */
  save(pkg: LocalPackage): { artifact: ArtifactValue; file: string }[] {
    const out: { artifact: ArtifactValue; file: string }[] = [];
    for (const a of pkg.pendingArtifacts) {
      const file = this.artifactPath(pkg.name, a);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const fm: Record<string, unknown> = a.kind === "skill" ? { name: a.name, description: a.description } : { description: a.description, ...(a.applyTo && { applyTo: a.applyTo }) };
      fs.writeFileSync(file, this.fm.stringify(a.body, fm));
      out.push({ artifact: a, file: path.relative(this.root, file) });
    }
    pkg.flush();
    return out;
  }

  private artifactPath(pkgName: string, a: ArtifactValue) {
    const apm = path.join(this.dir(pkgName), APM_LAYOUT.dir);
    return a.kind === "skill"
      ? path.join(apm, APM_LAYOUT.skillsDir, a.name, APM_LAYOUT.skillFile)
      : path.join(apm, APM_LAYOUT.instructionsDir, `${a.name}${APM_LAYOUT.instructionSuffix}`);
  }
}

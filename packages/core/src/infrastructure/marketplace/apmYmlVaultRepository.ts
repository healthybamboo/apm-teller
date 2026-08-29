import fs from "node:fs";
import path from "node:path";
import { Vault, DEFAULT_VAULT_CONVENTIONS, type VaultRepository, type PackageRegistrationValue, type PackageView, type VaultView, type VaultConventions } from "../../domain/marketplace";
import { YamlFile } from "../shared/yamlFile";
import { ApmPackageScanner } from "./apmPackageScanner";
import type { GitSlugResolver } from "./gitSlugResolver";

/**
 * apm.yml の依存 1 件を表示用の文字列にする。文字列はそのまま、`{ git, path }` や `{ name }` などのオブジェクトは要素を "/" で繋ぐ。
 *
 * @param d 依存の生の値（例: "owner/repo", { git: "parent", path: "packages/common" }, { name: "server", url: "…" }）
 * @returns 表示ラベル（例: "parent/packages/common"）
 */
function depLabel(d: unknown): string {
  if (typeof d === "string") return d;
  if (d && typeof d === "object") {
    const o = d as Record<string, unknown>;
    const parts = [o.git ?? o.name ?? o.url, o.path ?? o.subdir, o.ref ?? o.version].filter((v) => v != null && v !== "").map(String);
    return parts.length ? parts.join("/") : JSON.stringify(d);
  }
  return String(d);
}

/**
 * apm pack が生成するマニフェストの置き場所。
 */
const MANIFESTS = { claude: ".claude-plugin/marketplace.json", codex: ".agents/plugins/marketplace.json" } as const;

/**
 * apm.yml（marketplace ブロック）+ packages/** を Vault 集約として読み込む実装。
 */
export class ApmYmlVaultRepository implements VaultRepository {
  private readonly apmYml: YamlFile;

  constructor(
    private readonly root: string,
    private readonly slugResolver: GitSlugResolver,
    private readonly scanner = new ApmPackageScanner(root),
    private readonly conventions: VaultConventions = DEFAULT_VAULT_CONVENTIONS,
  ) { this.apmYml = new YamlFile(path.join(root, "apm.yml")); }

  /**
   * vault の GitHub 上の `owner/repo` を解決する。
   *
   * @returns `owner/repo` 形式の文字列（例: microsoft/apm）。teller.yml にも git remote にも無ければ undefined
   */
  slug() { return this.slugResolver.resolve(); }

  /**
   * apm.yml とローカルパッケージを読み込んで Vault 集約を組み立てる。apm.yml やパッケージディレクトリが無い場合は例外にせず `warnings` に記録する。
   *
   * @returns 読み取りモデル（パッケージ一覧・マニフェストの有無・警告）を持つ Vault 集約
   */
  load(): Vault {
    const warnings: string[] = [];
    if (!this.apmYml.exists()) warnings.push("apm.yml not found — is this an APM marketplace repo?");
    const top = this.apmYml.read();
    const mp = top.marketplace ?? {};
    const view: VaultView = {
      root: this.root,
      name: top.name,
      version: top.version != null ? String(top.version) : undefined,
      description: top.description,
      owner: mp.owner,
      outputs: Object.keys(mp.outputs ?? {}),
      packages: (mp.packages ?? []).map((e: any) => this.readPackage(e, warnings)),
      manifests: { claude: fs.existsSync(path.join(this.root, MANIFESTS.claude)), codex: fs.existsSync(path.join(this.root, MANIFESTS.codex)) },
      warnings,
    };
    // 既存エントリが owner/repo + subdir 形式なら、新規登録も同じ流儀に合わせる
    const subdirStyle = view.packages.some((p) => p.subdir);
    return new Vault(view, { ...this.conventions, sourceStyle: subdirStyle ? "subdir" : this.conventions.sourceStyle, vaultSlug: this.slug() });
  }

  private readPackage(entry: any, warnings: string[]): PackageView {
    const source = String(entry.source ?? "");
    const local = /^\.{1,2}\//.test(source) || source.startsWith("/");
    const info: PackageView = {
      name: entry.name, version: entry.version != null ? String(entry.version) : undefined, description: entry.description,
      source, local, category: entry.category, tags: entry.tags ?? [], targets: [], dependencies: { apm: [], mcp: [] },
      skills: [], instructions: [], hasPluginJson: false,
    };
    // source が owner/repo でも subdir がこのリポジトリ内に実在すれば、実体はローカル（apm-vault 以外でよくある形式）
    const subdir = entry.subdir ? path.normalize(String(entry.subdir)) : undefined;
    if (!local && subdir && fs.existsSync(path.join(this.root, subdir))) {
      info.local = true;
      info.subdir = subdir;
      info.versionRange = info.version;
      info.version = undefined;
    }
    if (!info.local) return info;
    const dir = subdir ?? path.normalize(source);
    info.dir = dir;
    if (!fs.existsSync(path.join(this.root, dir))) warnings.push(`package ${entry.name}: ${dir} does not exist`);
    const pkgYml = new YamlFile(path.join(this.root, dir, "apm.yml")).read();
    info.version ??= pkgYml.version != null ? String(pkgYml.version) : undefined;
    info.description ??= pkgYml.description;
    info.author = pkgYml.author;
    info.targets = pkgYml.targets ?? [];
    info.dependencies = { apm: (pkgYml.dependencies?.apm ?? []).map(depLabel), mcp: (pkgYml.dependencies?.mcp ?? []).map(depLabel) };
    info.hasPluginJson = fs.existsSync(path.join(this.root, dir, "plugin.json"));
    return { ...info, ...this.scanner.scan(dir) };
  }

  /**
   * apm.yml の marketplace.packages に登録内容を追記する（コメントは保持）。
   *
   * @param reg 追記する登録内容。name / version / description / source（`./packages/<name>` 形式）/ tags。tags が空なら省略して書く
   */
  register(reg: PackageRegistrationValue): void {
    this.apmYml.update((doc) => {
      const entry: Record<string, unknown> = { ...reg };
      if (!reg.tags.length) delete entry.tags;
      if (!reg.subdir) delete entry.subdir;
      const list = doc.getIn(["marketplace", "packages"]) as { add?: (n: unknown) => void } | undefined;
      if (list?.add) list.add(doc.createNode(entry));
      else doc.setIn(["marketplace", "packages"], [entry]);
    });
  }
}

import fs from "node:fs";
import path from "node:path";
import type { SkillView, InstructionView } from "../../domain/marketplace";
import { FrontMatterCodec } from "../shared/frontMatter";

/**
 * APM パッケージ内の `.apm/` レイアウト。
 */
export const APM_LAYOUT = {
  dir: ".apm", skillsDir: "skills", skillFile: "SKILL.md", instructionsDir: "instructions", instructionSuffix: ".instructions.md",
} as const;

/**
 * `<pkgDir>/.apm` 配下の skills / instructions を列挙する。
 */
export class ApmPackageScanner {
  constructor(private readonly root: string, private readonly fm = new FrontMatterCodec()) {}

  /**
   * パッケージディレクトリを走査し、`.apm/skills/<name>/SKILL.md` と `.apm/instructions/*.md` の front matter を読み取る。`.apm` が無ければ両方空。
   *
   * @param pkgDir パッケージディレクトリの vault ルートからの相対パス（例: packages/review-conventions）
   * @returns skill（name / description / file）と instruction（name / description / applyTo / file）の読み取りモデル。`file` は vault 相対パス
   */
  scan(pkgDir: string): { skills: SkillView[]; instructions: InstructionView[] } {
    const apm = path.join(this.root, pkgDir, APM_LAYOUT.dir);
    const skills: SkillView[] = [];
    const instructions: InstructionView[] = [];
    for (const d of this.entries(path.join(apm, APM_LAYOUT.skillsDir))) {
      if (!d.isDirectory()) continue;
      const f = path.join(apm, APM_LAYOUT.skillsDir, d.name, APM_LAYOUT.skillFile);
      if (!fs.existsSync(f)) continue;
      const { data } = this.fm.parse(fs.readFileSync(f, "utf8"));
      skills.push({ name: String(data.name ?? d.name), description: data.description as string | undefined, file: path.relative(this.root, f) });
    }
    for (const d of this.entries(path.join(apm, APM_LAYOUT.instructionsDir))) {
      if (!d.isFile() || !d.name.endsWith(".md")) continue;
      const f = path.join(apm, APM_LAYOUT.instructionsDir, d.name);
      const { data } = this.fm.parse(fs.readFileSync(f, "utf8"));
      instructions.push({
        name: d.name.endsWith(APM_LAYOUT.instructionSuffix) ? d.name.slice(0, -APM_LAYOUT.instructionSuffix.length) : d.name.slice(0, -3),
        description: data.description as string | undefined, applyTo: data.applyTo as string | undefined, file: path.relative(this.root, f),
      });
    }
    return { skills, instructions };
  }

  private entries(p: string) { return fs.existsSync(p) ? fs.readdirSync(p, { withFileTypes: true }) : []; }
}

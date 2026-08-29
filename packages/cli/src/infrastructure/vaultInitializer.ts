import fs from "node:fs";
import path from "node:path";
import type { TellerLayout } from "@apm-teller/core";
import { TEMPLATES_DIR } from "../paths";

/**
 * `apm-teller init`: テンプレートを vault にコピーし、.gitignore を整える。
 */
export class VaultInitializer {
  constructor(private readonly root: string, private readonly layout: TellerLayout, private readonly templates = TEMPLATES_DIR) {}

  /**
   * teller.yml・抽出プロンプト・Claude settings のテンプレートを配置し、conventions ディレクトリを作り、
   * 生データとトランスクリプトを .gitignore に追加する。既存ファイルは上書きしない。
   *
   * @param log 進捗メッセージ（`create <path>` / `skip <path> (exists)` / `update .gitignore (...)`）を受け取るコールバック。既定は `console.log`
   */
  run(log: (s: string) => void = console.log) {
    const p = this.layout;
    this.copy("teller.yml", "teller.yml", log);
    this.copy("extract-conventions.md", p.prompt, log);
    this.copy("claude-settings.json", p.agentSettings, log);
    this.copy("codex-hooks.json", p.codexHooks, log);
    this.touch(path.join(p.conventions, ".gitkeep"), log, p.conventions + "/");
    this.gitignore([p.raw + "/", path.join(p.runs, "*.log")], log);
  }

  /**
   * テンプレートファイルを vault へコピーする。コピー先が既にあればスキップする。
   *
   * @param template テンプレートディレクトリ内のファイル名（例: `teller.yml`、`extract-conventions.md`）
   * @param dest コピー先の vault ルートからの相対パス（例: `.teller/prompts/extract-conventions.md`）
   * @param log 進捗メッセージを受け取るコールバック
   */
  private copy(template: string, dest: string, log: (s: string) => void) {
    const dst = path.join(this.root, dest);
    if (fs.existsSync(dst)) {
      log(`skip   ${dest} (exists)`);
      return;
    }
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(path.join(this.templates, template), dst);
    log(`create ${dest}`);
  }

  /**
   * 空ファイルを作成する（親ディレクトリも作る）。既にあれば何もしない。
   *
   * @param rel 作成するファイルの vault ルートからの相対パス（例: `.teller/conventions/.gitkeep`）
   * @param log 進捗メッセージを受け取るコールバック
   * @param label ログに表示する名前。既定は `rel`（ディレクトリ作成として見せたい場合に `dir/` などを渡す）
   */
  private touch(rel: string, log: (s: string) => void, label = rel) {
    const p = path.join(this.root, rel);
    if (fs.existsSync(p)) return;
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, "");
    log(`create ${label}`);
  }

  /**
   * 生データは大きく機密を含み得るので既定で無視（コミットするかは vault 側の判断）。
   * 未登録のパターンだけをコメント付きで .gitignore 末尾に追記する。
   *
   * @param patterns 追加する gitignore パターンの配列（例: `[".teller/raw/", ".teller/runs/*.log"]`）
   * @param log 進捗メッセージを受け取るコールバック
   */
  private gitignore(patterns: string[], log: (s: string) => void) {
    const gi = path.join(this.root, ".gitignore");
    const cur = fs.existsSync(gi) ? fs.readFileSync(gi, "utf8") : "";
    const missing = patterns.filter((p) => !cur.split("\n").includes(p));
    if (!missing.length) return;
    fs.writeFileSync(gi, cur + (cur === "" || cur.endsWith("\n") ? "" : "\n") + "# apm-teller: fetched review data & transcripts (remove to commit)\n" + missing.join("\n") + "\n");
    log(`update .gitignore (+ ${missing.join(", ")})`);
  }
}

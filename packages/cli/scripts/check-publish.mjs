// publish 前に、同梱すべき成果物（Web UI・テンプレート）が揃っているか確認する。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const required = ["dist/index.js", "public/index.html", "templates/teller.yml", "templates/extract-conventions.md", "templates/claude-settings.json", "templates/codex-hooks.json"];
const missing = required.filter((f) => !fs.existsSync(path.join(root, f)));
if (missing.length) { console.error("publish blocked, missing: " + missing.join(", ")); process.exit(1); }
console.log("publish check ok");

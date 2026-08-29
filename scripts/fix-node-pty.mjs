// pnpm がコピーする node-pty の prebuilt spawn-helper に実行ビットが付かないことがある（posix_spawnp failed の原因）。
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
try {
  const require = createRequire(path.join(process.cwd(), "packages/cli/package.json"));
  const root = path.dirname(require.resolve("node-pty/package.json"));
  for (const dir of fs.readdirSync(path.join(root, "prebuilds"))) {
    const helper = path.join(root, "prebuilds", dir, "spawn-helper");
    if (fs.existsSync(helper)) fs.chmodSync(helper, 0o755);
  }
} catch { /* node-pty not installed yet */ }

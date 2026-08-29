// Copies the built web app into cli/public so `apm-teller serve` can ship it.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, "../../web/dist");
const dst = path.resolve(here, "../public");
fs.rmSync(dst, { recursive: true, force: true });
if (fs.existsSync(src)) {
  fs.cpSync(src, dst, { recursive: true });
  console.log("copied web build → cli/public");
} else {
  console.warn("web/dist not found — build @apm-teller/web first (serve will run API-only)");
}

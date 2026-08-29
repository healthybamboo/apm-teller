import { defineConfig } from "tsup";
export default defineConfig({
  entry: ["src/index.ts"], format: ["esm"], sourcemap: true, clean: true, target: "node20",
  banner: { js: "#!/usr/bin/env node" },
  external: ["@apm-teller/core", "hono", "@hono/node-server", "commander", "yaml", "gray-matter"],
});

import { defineConfig } from "tsup";

// @apm-teller/core は npm に公開しないため、cli の dist に同梱する（noExternal）。
export default defineConfig({
  entry: ["src/index.ts"], format: ["esm"], sourcemap: true, clean: true, target: "node20",
  banner: { js: "#!/usr/bin/env node" },
  noExternal: ["@apm-teller/core"],
  external: ["hono", "@hono/node-server", "@hono/node-ws", "commander", "yaml", "gray-matter", "node-pty", "zod"],
});

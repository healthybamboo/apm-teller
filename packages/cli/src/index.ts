import { Command } from "commander";
import { createRequire } from "node:module";
import { DomainError } from "@apm-teller/core";
import { findVaultRoot, PUBLIC_DIR } from "./paths";
import { createContainer } from "./container";
import { createApp } from "./http/app";
import { ServeCommand } from "./commands/serveCommand";
import { ValidateCommand, readStdinJson } from "./commands/validateCommand";
import { DoctorCommand } from "./commands/doctorCommand";
import { StatusCommand } from "./commands/statusCommand";
import { MineCommand } from "./commands/mineCommand";
import { PromoteCommand } from "./commands/promoteCommand";
import { ReviewCommand } from "./commands/reviewCommand";
const pkg = createRequire(import.meta.url)("../package.json") as { version: string };
const program = new Command()
  .name("apm-teller")
  .description("GUI + implicit-rule miner for APM marketplace repos (all state lives in the repo)")
  .version(pkg.version)
  .option("-C, --root <dir>", "vault root (default: nearest apm.yml / teller.yml)");
/**
 * コマンドごとに Container を組み、必要なユースケースだけを注入する。
 * `-C/--root` が指定されていればそれを、無ければ cwd から探索した vault ルートを使う。
 *
 * @returns 配線済みの Container
 */
const container = () => createContainer(program.opts().root ? String(program.opts().root) : findVaultRoot());
/**
 * 終了コード（または終了コードを解決する Promise）を待ってプロセスを終了する。
 *
 * @param code 終了コード（0 が成功）、またはそれを解決する Promise
 * @returns プロセス終了までの Promise（実際には `process.exit` により戻らない）
 */
const exit = (code: number | Promise<number>) => Promise.resolve(code).then((c) => process.exit(c));
program.command("init").description("create teller.yml, .teller/prompts, .teller/claude in this vault")
  .action(() => container().initializer.run());
program.command("serve").description("start the local GUI")
  .option("-p, --port <n>", "port", "4747")
  .option("--no-open", "do not open the browser")
  .action((o) => { const ct = container(); new ServeCommand(createApp(ct, PUBLIC_DIR), ct.root).run({ port: Number(o.port), open: o.open }); });
program.command("validate [files...]").description("validate convention files (used as a Claude Code hook)")
  .option("--all", "validate every convention")
  .option("--hook", "read Claude Code hook payload from stdin; exit 2 on failure")
  .action((files: string[], o) => exit(new ValidateCommand(container().usecases.validate, readStdinJson).run({ files, ...o })));
program.command("doctor").description("check gh / claude / apm / repo access needed for mining")
  .action(() => exit(new DoctorCommand(container().usecases.readiness).run()));
program.command("mine [repos...]").description("fetch PR reviews with gh and let `claude -p` write convention drafts")
  .option("--skip-fetch", "reuse fetched raw data")
  .option("--dry-run", "show the claude invocation only")
  .option("--skip-doctor", "do not run readiness checks first")
  .option("--agent <kind>", "claude | codex (default: teller.yml mining.agent.kind)")
  .action((repos: string[], o) => exit(new MineCommand(container().usecases.mine).run({ repos, ...o })));
program.command("review <id> <action>").description("accept | reject | reopen a convention")
  .action((id: string, action: string) => exit(new ReviewCommand(container().usecases.review).run({ id, action: action as "accept" | "reject" | "reopen" })));
program.command("promote <id>").description("write an accepted convention into a package as a skill / instruction")
  .requiredOption("--package <name>", "local package name (created if missing)")
  .option("--kind <kind>", "skill | instruction")
  .option("--name <name>", "skill dir / instruction file name")
  .option("--apply-to <glob>", "applyTo front matter for instructions")
  .action((id: string, o) => exit(new PromoteCommand(container().usecases.promote).run({ id, package: o.package, kind: o.kind, name: o.name, applyTo: o.applyTo })));
program.command("status").description("print a text summary of the vault")
  .action(() => { const u = container().usecases; new StatusCommand(u.inspect, u.review).run(); });
program.parseAsync().catch((e) => {
  console.error(e instanceof DomainError ? e.message : e);
  process.exit(1);
});

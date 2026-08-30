# apm-teller

A local GUI and convention miner for [Microsoft APM](https://github.com/microsoft/apm) marketplace repositories ("vaults").

apm-teller runs inside a vault repo and gives you three things:

- **Catalog** — see every package, skill and instruction in the vault; pick packages (or author-defined presets) and get the `apm install … --target …` commands for the assistants you use. Authors curate featured packages, headlines and presets from the GUI instead of maintaining a README.
- **Mining** — fetch PR reviews and comments from your repositories with `gh`, then let an interactive Claude Code or Codex session distill the *implicit team conventions* reviewers keep asking for into `.teller/conventions/*.md`. The session runs in a real terminal in your browser; every file the agent writes is validated by a hook and rejected if it doesn't match the contract.
- **Review & promote** — accept, reject or edit mined conventions, then promote accepted ones into a package as a `SKILL.md` or `*.instructions.md` (creating and registering the package in `apm.yml` if needed).

**All state is plain text inside the vault repo** — `teller.yml` and `.teller/`. No database, no external service, and the GUI never runs git: you review the diff and commit.

## Requirements

- Node.js 20+
- [APM CLI](https://github.com/microsoft/apm) 0.24+
- [GitHub CLI](https://cli.github.com) (`gh auth login`) — for fetching reviews; GitHub Enterprise is supported (`gh auth login --hostname …`)
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) and/or [Codex CLI](https://github.com/openai/codex) — whichever agent you want to mine with

`apm-teller` must be on your `PATH`: the agents' hooks call `apm-teller validate` to check each written file.

## Quick start

```sh
npm i -g apm-teller
cd path/to/your-vault      # a repo with apm.yml
apm-teller init            # writes teller.yml, .teller/…, .codex/hooks.json
apm-teller doctor          # checks gh / claude / codex / apm / repo access
apm-teller serve           # opens http://localhost:4747
```

Then, in the GUI: **Mining** → add a repository (`owner/repo` or a URL) → **Run**. When the agent finishes, open **Review**, accept what you agree with, and promote it into a package. Finally run `apm pack` and commit.

### CLI equivalents

```sh
apm-teller mine [owner/repo …] [--agent claude|codex] [--dry-run] [--skip-fetch]
apm-teller validate --all
apm-teller review <id> accept|reject|reopen
apm-teller promote <id> --package <name> [--kind skill|instruction] [--apply-to '**/*.ts']
apm-teller status
```

## What lives in the vault

```
teller.yml                          # tool configuration (paths / catalog / mining)
.teller/
  conventions/<id>.md               # one file per convention (front matter + ## Rule / ## Rationale)
  prompts/extract-conventions.md    # the extraction prompt — edit freely
  claude/settings.json              # Claude Code hooks (PostToolUse / Stop → apm-teller validate)
  runs/<run-id>.md                  # run summaries (*.log is gitignored by default)
  raw/                              # fetched review data (gitignored by default)
.codex/hooks.json                   # Codex hooks (same contract)
```

### `teller.yml`

```yaml
paths:            # where the tool keeps its files (all vault-relative)
catalog:          # featured packages, per-package headline/targets/audience, presets, install templates
mining:
  language: ja    # language the agent writes conventions in (overridden by the GUI language)
  sources:        # repositories to mine: repo (owner/repo), host (for GitHub Enterprise), prs, include
  agent:
    kind: claude  # claude | codex — switchable per run from the GUI
    claude: { permission_mode, allowed_tools, setting_sources, extra_args }
    codex:  { approval, sandbox, model, extra_args }
```

### Convention file contract

Front matter: `id` (kebab-case, equals the file name), `title`, `status` (`proposed | accepted | rejected | promoted`), `kind` (`skill | instruction`), `confidence` (0–1), `tags`, `sources[]` (`repo`, `pr`, `url`, `quote`), `run`, `created`. Body must contain `## Rule` and `## Rationale`. `apm-teller validate` enforces this; hooks return exit code 2 so the agent fixes the file instead of finishing with broken output.

### Supported vault layouts

Both package layouts APM supports are recognised: local paths (`source: ./packages/foo`) and self-referencing repos (`source: owner/repo` + `subdir: packages/foo`, resolved by tags). New packages created by *promote* follow whichever convention the vault already uses.

## Architecture

pnpm workspace with three packages. `core` has no dependency on external processes; `cli` is the composition root.

```
packages/core/src
  domain/            marketplace / catalog / convention / mining contexts
                     (each split into aggregate, value, schema, repository, port, service, view, dto)
  application/       use cases (*UseCase) and the Dependencies bundle
  infrastructure/    file-based repositories (apm.yml, teller.yml, Markdown conventions)
packages/cli/src
  infrastructure/    gh, PTY agent session, apm, shell adapters
  http/              Hono controllers (REST + WebSocket terminal)
  commands/          CLI commands
  container.ts       composition root
packages/web         React + Vite UI (talks to the API only), ja / en
apm-package/         an APM package (skill) you can vendor into a vault
```

Conventions: aggregate roots have no suffix (`Vault`, `Convention`); everything else carries a role suffix (`*Repository`, `*Port`, `*Service`, `*UseCase`, `*Value`, `*Dto`, `*View`, `*Schema`). File names are lowerCamelCase, relative imports have no extension, and every public declaration has a multi-line TSDoc with `@param` / `@returns` / `@throws` — enforced by `pnpm lint`.

## Development

```sh
pnpm install
pnpm build        # core → web → cli (the web build is bundled into cli/public)
pnpm typecheck
pnpm lint
```

To run the local build as `apm-teller`, put a shim on your `PATH` that executes `packages/cli/dist/index.js`, or `npm link` from `packages/cli`.

## License

MIT

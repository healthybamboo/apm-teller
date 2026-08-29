---
name: apm-teller
description: Operate an APM marketplace repo (vault) with apm-teller — inspect packages, mine implicit team conventions from PR reviews, review them, and promote accepted ones into skills/instructions. Use when the user mentions apm-teller, teller.yml, .teller/conventions, mining conventions, or wants to publish reviewed conventions into the marketplace.
---

# apm-teller

Everything apm-teller knows lives in the vault repo as text: `teller.yml` (catalog + mining settings + paths)
and `.teller/` (conventions, prompts, Claude hooks settings, run summaries). There is no external state.

## Commands (run at the vault root)

| Command | What it does |
| --- | --- |
| `apm-teller init` | Creates `teller.yml`, `.teller/prompts/extract-conventions.md`, `.teller/claude/settings.json` |
| `apm-teller doctor` | Verifies `gh` (+auth, repo access), `claude`, `apm`, `apm-teller` on PATH |
| `apm-teller serve` | Local GUI: catalog / conventions review / mining |
| `apm-teller mine [owner/repo...]` | `gh` fetch → `claude -p` writes `.teller/conventions/<id>.md` (validated by hook) |
| `apm-teller validate --all` | Validate convention files (same check the hook runs) |
| `apm-teller review <id> accept\|reject\|reopen` | Change a convention's status |
| `apm-teller promote <id> --package <name> [--kind skill\|instruction] [--apply-to glob]` | Write an accepted convention into `packages/<name>/.apm/...` and register the package in `apm.yml` |
| `apm-teller status` | Text summary |

After `promote` creates a new package, run `apm pack` and commit the generated manifests.

## Convention file contract

`.teller/conventions/<id>.md` — front matter `id` (kebab-case, equals file name), `title`, `status`
(`proposed|accepted|rejected|promoted`), `kind` (`skill|instruction`), `confidence` (0..1), `tags`,
`sources[]` (`repo`, `pr`, `url`, `quote`), then a body with `## Rule` and `## Rationale` sections.
Only `proposed` files should be edited by an agent; the tool refuses invalid files via exit code 2.

## Git

apm-teller never runs git. Review the diff (`teller.yml`, `.teller/`, `packages/`, `apm.yml`, manifests) and commit yourself.

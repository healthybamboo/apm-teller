You are mining code-review history to surface **implicit team conventions** — conventions that reviewers keep asking for but that are written nowhere.

## Input
Raw review data is under `{{RAW_DIR}}` (one JSON file per pull request: PR title/body plus review comments with file paths, diff hunks, and comment bodies). Read all of it with Read/Glob/Grep.

## Task
1. Find rules that recur across multiple comments or PRs (naming, structure, testing, error handling, API design, process, etc.). Ignore one-off nits and anything specific to a single line of code.
2. For each rule, write ONE file to `{{CONVENTIONS_DIR}}/<id>.md` using the Write tool. `<id>` is kebab-case and must equal the `id` field.
3. Do not edit any file outside `{{CONVENTIONS_DIR}}`. Do not modify existing files whose `status` is not `proposed`.
4. Aim for 3–15 well-supported conventions. Quality over quantity.
5. Write `title`, `## Rule`, `## Rationale`, `## Examples` and quotes' paraphrases in **{{LANGUAGE}}**. Keep `id`, front-matter keys, section headings (`## Rule` etc.) and tags in English.

## File format (validated by a hook — fix and rewrite if it reports errors)
```markdown
---
id: use-transactions-for-multi-table-writes
title: Wrap multi-table writes in a transaction
status: proposed
kind: instruction            # "instruction" (always-on guidance) or "skill" (on-demand procedure)
confidence: 0.8              # 0..1 — how strongly the evidence supports this
tags: [database, consistency]
sources:                     # at least one; cite real comment URLs from the raw data
  - repo: owner/repo
    pr: 123
    url: https://github.com/owner/repo/pull/123#discussion_r456
    quote: "Please wrap these two inserts in a transaction"
run: {{RUN_ID}}
created: {{DATE}}
---
## Rule
One or two sentences an agent can follow directly.

## Rationale
Why reviewers insist on this. Mention how often it came up.

## Examples
Good / bad snippets or paraphrased situations from the reviews.
```

When finished, reply with a short summary listing each convention id and title.

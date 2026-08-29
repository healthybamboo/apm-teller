import type { Dict } from "./ja";

/**
 * English UI strings. Must mirror the shape of `ja`.
 */
export const en: Dict = {
  app: { loading: "Loading…", lang: "Language" },
  tabs: { catalog: "Catalog", mining: "Mining", conventions: "Review",
    catalogHint: "Packages and install commands", miningHint: "Mine implicit conventions from reviews", conventionsHint: "Accept / reject / promote mined conventions" },
  common: { copy: "Copy", close: "Close", save: "Save", delete: "Remove", add: "Add", none: "none", all: "Show all", running: "Running…", done: "Done", failed: "Failed", optional: "(optional)", count: "{n}" },
  status: { proposed: "proposed", accepted: "accepted", rejected: "rejected", promoted: "promoted" },
  kind: { skill: "skill (on-demand)", instruction: "instruction (always-on)" },
  catalog: {
    intro: "Pick packages and the apm install command appears below (adjust --target with the chips).",
    packages: "Packages", authorMode: "Author mode (edit featured / headline / presets)", empty: "No packages in apm.yml.",
    manifestClaude: "Claude manifest present", manifestClaudeMissing: "Claude manifest not built", manifestCodex: "Codex manifest present", manifestCodexMissing: "No Codex manifest",
    check: "Check", checkHint: "apm marketplace check: reachability & version resolution", outdated: "Outdated", outdatedHint: "apm marketplace outdated: packages with updates", pack: "Rebuild manifests", packHint: "apm pack: regenerate marketplace.json",
    featured: "featured", remote: "remote", hidden: "hidden", noArtifacts: "(no skills / instructions)", selectHint: "Add to install set",
    headline: "Headline (what this package does, one line)", audience: "Audience (comma separated: backend, frontend)", hide: "Hide from list", saveEntry: "Save (teller.yml)", feature: "Feature", unfeature: "Unfeature",
    presets: "Presets", presetsEmpty: "None yet. Select packages, then create one below.", presetName: "Preset name (e.g. backend-starter)", presetDesc: "Description", createPreset: "Create preset from {n} selected",
    targets: "--target:", noTargets: "Tick at least one assistant.", installHint: "Tick packages to see install commands here.", install: "Install", clear: "Clear",
  },
  mining: {
    intro: "Fetch PR reviews/comments with gh and let an interactive Claude Code or Codex session write recurring implicit conventions into {dir}/. Writes are validated by hooks.",
    agent: "Agent", step1: "Prerequisites", step2: "Source repositories", step3: "Run",
    ready: "✓ Everything is in place. You can run mining.", notReady: "✗ {n} required item(s) missing: {items}", checkingDetail: "Checking prerequisites… (gh auth and repo access take a few seconds)", recheck: "Re-check", checking: "Checking…", fix: "Fix",
    groupTools: "Required commands", groupGithub: "GitHub", groupRepo: "This repository",
    check: { codex: "codex CLI (OpenAI Codex)", "codex-hooks": "Codex hooks settings", apm: "apm CLI", claude: "claude CLI (Claude Code)", gh: "gh CLI", self: "apm-teller on PATH (called by Claude hooks)", "gh-auth": "gh logged in", prompt: "Extraction prompt", "agent-settings": "Claude hooks settings", sources: "Source repositories configured", repo: "Can read {repo}" },
    fixes: { codex: "npm i -g @openai/codex, then run codex once to log in", self: "npm i -g apm-teller (or a PATH shim to dist during development)", "gh-auth": "Run gh auth login", sources: "Add one under “2. Source repositories”", prompt: "Run apm-teller init", "agent-settings": "Run apm-teller init", claude: "npm i -g @anthropic-ai/claude-code, then run claude once to log in", repo: "Check the repo name and the gh token's read access" },
    repoInput: "owner/repo or URL (GitHub Enterprise supported)", sourcesEmpty: "None yet. Add repositories as owner/repo (e.g. microsoft/apm).", lastPrs: "last {n} PRs", prsLabel: "PRs", recent: "last",
    blocked: "Cannot run yet: {items}", run: "▶ Mine {n} repositor(y/ies)", skipFetch: "Skip fetch (reuse previous data)", skipFetchHint: "Skip gh fetching and reuse the raw data from the last run",
    running: "Running…", starting: "Starting…", elapsed: "{s}s elapsed", phaseFetch: "Fetching reviews {done}/{total} {label}",  extraPrompt: "Extra instructions for Claude (optional, applied to the next run)", extraPromptHint: "e.g. Only extract conventions about tests and error handling.", terminalHint: "The terminal below is a normal claude session. Answer questions and permission prompts here (Ctrl+C to abort).", logTitle: "Text log (saved under .teller/runs)", phaseExtract: "Claude is extracting conventions (interact in the terminal below)", takesTime: "After fetching, an interactive claude session starts. When done, open the Review tab.", logPlaceholder: "Logs appear here.", past: "Past runs:",
  },
  errors: {
    "install.noTargets": "Select at least one target",
    "convention.invalidTransition": "Cannot move {id} from {from} to {to}",
    "convention.readOnly": "{id} is promoted and read-only",
    "convention.invalidEdit": "Invalid edit",
    "convention.notFound": "Convention {id} not found (the file may be invalid)",
    "convention.notAccepted": "Accept {id} before promoting it (status: {status})",
    "package.remote": "{name} is a remote package; promote only into local packages",
    "package.unknown": "Unknown package(s): {names}",
    "package.exists": "Package {name} already exists",
    "package.badName": "Package name must be kebab-case: {name}",
    "package.artifactExists": "{kind} \"{name}\" already exists in {pkg}",
    "package.badArtifactName": "File name must be kebab-case: {name}",
    "mining.sourceExists": "{repo} is already added",
    "mining.badRepoRef": "Not a repository reference: {input} (owner/repo or a GitHub URL)",
  },
  conventions: {
    intro: "Implicit conventions mined from review history. Only accepted ones get written into packages.",
    empty: "Nothing here. Run mining first.", pick: "Pick one from the list.", confidence: "confidence", sources: "sources", run: "run",
    kindHint: "Kind (saved to the file; becomes the promote form default)", sourcesTitle: "Sources (review comments)", bodyTitle: "Body (## Rule and ## Rationale required)", saveChanges: "Save changes", accept: "✓ Accept", reject: "✕ Reject", reopen: "↩ Reopen", promotedTo: "Written to",
    promoteTitle: "Promote to package", promoteIntro: "Write the accepted convention into a package as a skill (SKILL.md) or instruction (*.instructions.md).", orNew: "or new:", newPackage: "new-package-name (kebab-case)",
    fileName: "file name (kebab-case)", applyTo: "applyTo glob (e.g. **/*.ts)", promote: "Promote →", wrote: "✓ Wrote", packageCreated: "(new package created — run “Rebuild manifests” in Catalog)",
  },
};

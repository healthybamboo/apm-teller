import { z } from "zod";

/**
 * マイニング対象リポジトリ。repo は `owner/repo` 形式、prs は読む直近 PR 数、include は取得するコメント種別。
 */
export const MiningSourceSchema = z.object({
  repo: z.string().regex(/^[\w.-]+\/[\w.-]+$/, "owner/repo"),
  host: z.string().min(1).optional(), // 省略時は github.com。GitHub Enterprise 等のセルフホストで指定
  prs: z.number().int().positive().default(30),
  include: z.array(z.enum(["reviews", "review_comments", "issue_comments"])).default(["reviews", "review_comments", "issue_comments"]),
});

/**
 * 使う抽出エージェントの種別。
 */
export const AGENT_KINDS = ["claude", "codex"] as const;

/**
 * エージェント種別の型。
 */
export type AgentKind = (typeof AGENT_KINDS)[number];

/**
 * Claude Code の起動オプション。
 */
export const ClaudeOptionsSchema = z.object({
  permission_mode: z.string().default("acceptEdits"),
  allowed_tools: z.array(z.string()).default(["Read", "Glob", "Grep", "Write", "Edit"]),
  // claude が読む設定ソース。通常のターミナルと同じ挙動にするため既定は全部。user を外すと ~/.claude/settings.json を読まない
  setting_sources: z.array(z.enum(["user", "project", "local"])).default(["user", "project", "local"]),
  extra_args: z.array(z.string()).default([]),
});

/**
 * Codex CLI の起動オプション。hooks は <vault>/.codex/hooks.json から読まれる。
 */
export const CodexOptionsSchema = z.object({
  approval: z.enum(["untrusted", "on-request", "never"]).default("on-request"),
  sandbox: z.enum(["read-only", "workspace-write", "danger-full-access"]).default("workspace-write"),
  model: z.string().optional(),
  extra_args: z.array(z.string()).default([]),
});

/**
 * 抽出エージェントの設定。kind で切り替え、各エージェントのオプションを併記する。
 */
export const AgentOptionsSchema = z.object({
  kind: z.enum(AGENT_KINDS).default("claude"),
  claude: ClaudeOptionsSchema.default({}),
  codex: CodexOptionsSchema.default({}),
});

/**
 * 外部コマンドの要件。doctor がこの定義に従って `command args` を実行し、存在を検査する。
 */
export const ToolRequirementSchema = z.object({
  id: z.string(),
  label: z.string(),
  command: z.string(),
  args: z.array(z.string()).default(["--version"]),
  required: z.boolean().default(true),
  // 指定すると、その種別のエージェントが選ばれているときだけ必須になる
  agent: z.enum(AGENT_KINDS).optional(),
  fix: z.string().optional(),
});

/**
 * teller.yml の `mining:` ブロック。対象 repo・エージェント設定・ツール要件を束ねる。
 */
export const MiningConfigSchema = z.object({
  sources: z.array(MiningSourceSchema).default([]),
  // 規約本文（title / Rule / Rationale）を書かせる言語。GUI からの実行時は画面の言語で上書きされる
  language: z.string().default("en"),
  agent: AgentOptionsSchema.default({}),
  requirements: z.array(ToolRequirementSchema).optional(), // 未指定なら既定
});

/**
 * `mining:` ブロックを検証・既定値補完した後の型。MiningConfig 集約の内部状態。
 */
export type MiningConfigData = z.infer<typeof MiningConfigSchema>;

/**
 * 検証済みのマイニング対象リポジトリの型。
 */
export type MiningSource = z.infer<typeof MiningSourceSchema>;

/**
 * 検証済みのツール要件の型。
 */
export type ToolRequirement = z.infer<typeof ToolRequirementSchema>;

/**
 * 検証済みのエージェント起動オプションの型。
 */
export type AgentOptions = z.infer<typeof AgentOptionsSchema>;

/**
 * 検証済みの Claude 起動オプションの型。
 */
export type ClaudeOptions = z.infer<typeof ClaudeOptionsSchema>;

/**
 * 検証済みの Codex 起動オプションの型。
 */
export type CodexOptions = z.infer<typeof CodexOptionsSchema>;

/**
 * `requirements` 省略時の既定ツール要件。apm（任意）、claude・gh・apm-teller（必須）。
 */
export const DEFAULT_TOOL_REQUIREMENTS: ToolRequirement[] = [
  { id: "apm", label: "apm CLI", command: "apm", args: ["--version"], required: false, fix: "https://github.com/microsoft/apm" },
  { id: "claude", label: "claude CLI (Claude Code)", command: "claude", args: ["--version"], required: true, agent: "claude", fix: "npm i -g @anthropic-ai/claude-code → `claude` で一度ログイン" },
  { id: "codex", label: "codex CLI (OpenAI Codex)", command: "codex", args: ["--version"], required: true, agent: "codex", fix: "npm i -g @openai/codex → `codex` で一度ログイン" },
  { id: "gh", label: "gh CLI", command: "gh", args: ["--version"], required: true, fix: "https://cli.github.com" },
  { id: "self", label: "apm-teller on PATH (Claude hooks から呼ばれる)", command: "apm-teller", args: ["--version"], required: true, fix: "npm i -g apm-teller（開発中は pnpm link --global）" },
];

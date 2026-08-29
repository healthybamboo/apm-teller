/**
 * `apm install --target` が理解するアシスタント種別の一覧。
 */
export const TARGETS = [
  "claude", "copilot", "vscode", "codex", "cursor", "gemini",
  "opencode", "windsurf", "kiro", "antigravity", "intellij", "agents", "agent-skills",
] as const;

/**
 * アシスタント種別のユニオン型（{@link TARGETS} の要素）。
 */
export type Target = (typeof TARGETS)[number];

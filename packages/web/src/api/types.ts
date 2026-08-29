/**
 * サーバー API の応答型。core の View/DTO と同形（web は core に依存しない）。
 */
export interface SkillView { name: string; description?: string; file: string }

export interface InstructionView { name: string; description?: string; applyTo?: string; file: string }

export interface PackageView {
  name: string; version?: string; description?: string; author?: string; source: string; local: boolean; dir?: string; subdir?: string; versionRange?: string;
  category?: string; tags: string[]; targets: string[]; dependencies: { apm: string[]; mcp: string[] };
  skills: SkillView[]; instructions: InstructionView[]; hasPluginJson: boolean;
}

export interface VaultView {
  root: string; name?: string; version?: string; description?: string; owner?: { name?: string; url?: string };
  outputs: string[]; packages: PackageView[]; manifests: { claude: boolean; codex: boolean }; warnings: string[];
}

export interface CatalogEntry { headline?: string; recommended_targets: string[]; audience: string[]; hidden: boolean }

export interface Preset { name: string; description: string; packages: string[] }

export interface CatalogData { featured: string[]; packages: Record<string, CatalogEntry>; presets: Preset[] }

export interface MiningSource { repo: string; host?: string; prs: number; include: string[] }

export type AgentKind = "claude" | "codex";

export interface MiningConfigData { sources: MiningSource[]; language: string; agent: { kind: AgentKind } }

export interface TellerLayout { root: string; conventions: string; runs: string; raw: string; prompt: string; agentSettings: string }

export interface Overview { vault: VaultView; catalog: CatalogData; mining: MiningConfigData; layout: TellerLayout; slug?: string }

export interface InstallRecipe { title: string; steps: string[]; note?: string }

export type ConventionStatus = "proposed" | "accepted" | "rejected" | "promoted";

export type ConventionKind = "skill" | "instruction";

export interface ConventionProps {
  id: string; title: string; status: ConventionStatus; kind: ConventionKind; confidence: number; tags: string[];
  sources: { repo: string; pr?: number; url?: string; quote?: string }[]; run?: string; created?: string; promoted_to?: string; package?: string;
}

export interface Convention { file: string; meta: ConventionProps; body: string }

export interface ConventionList { conventions: Convention[]; invalid: { file: string; errors: string[] }[] }

export interface ReadinessCheck { id: string; label: string; ok: boolean; detail?: string; required: boolean; fix?: string }

export interface Run { key: string; runId?: string; status: "running" | "done" | "failed"; lines: string[]; started?: string; progress?: { phase: "fetch" | "extract"; done: number; total: number; label?: string }; interactive?: boolean }

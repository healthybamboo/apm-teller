import type { Overview, CatalogData, MiningConfigData, InstallRecipe, ConventionList, ReadinessCheck, Run, CatalogEntry, Preset, MiningSource, ConventionKind } from "./types";

/**
 * API 呼び出しの唯一の入口。エラーは `error` + `issues` を連結して throw する。
 *
 * @param path
 * @param init
 */
/**
 * サーバーのエラー応答。key があれば画面の言語で翻訳して表示する。
 */
export class ApiError extends Error {
  constructor(message: string, readonly key?: string, readonly params?: Record<string, string | number>, readonly issues: string[] = []) { super(message); }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, { headers: { "content-type": "application/json" }, ...init });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(body.error || res.statusText, body.key, body.params, body.issues ?? []);
  return body as T;
}

const json = (method: string, data?: unknown): RequestInit => ({ method, body: data === undefined ? undefined : JSON.stringify(data) });

export const api = {
  // marketplace
  overview: () => call<Overview>("/vault"),
  install: (pkgs: string[], targets: string[]) => call<InstallRecipe[]>(`/install?packages=${encodeURIComponent(pkgs.join(","))}&targets=${encodeURIComponent(targets.join(","))}`),
  apm: (cmd: "pack" | "check" | "outdated") => call<{ ok: boolean; out: string }>(`/apm/${cmd}`, json("POST")),
  file: async (path: string) => { const r = await fetch(`/api/file?path=${encodeURIComponent(path)}`); return r.ok ? r.text() : ""; },
  // catalog
  catalog: () => call<CatalogData>("/catalog"),
  setCatalogEntry: (pkg: string, e: CatalogEntry) => call<CatalogData>(`/catalog/entries/${pkg}`, json("PUT", e)),
  setFeatured: (packages: string[]) => call<CatalogData>("/catalog/featured", json("PUT", { packages })),
  upsertPreset: (p: Preset) => call<CatalogData>("/catalog/presets", json("PUT", p)),
  removePreset: (name: string) => call<CatalogData>(`/catalog/presets/${name}`, json("DELETE")),
  // conventions
  conventions: () => call<ConventionList>("/conventions"),
  review: (id: string, action: "accept" | "reject" | "reopen") => call(`/conventions/${id}/${action}`, json("POST")),
  editConvention: (id: string, patch: { title?: string; tags?: string[]; kind?: ConventionKind; body?: string }) => call(`/conventions/${id}`, json("PATCH", patch)),
  promote: (id: string, o: { package: string; kind?: ConventionKind; name?: string; applyTo?: string }) => call<{ target: string; packageCreated: boolean }>(`/conventions/${id}/promote`, json("POST", o)),
  // mining
  mining: () => call<MiningConfigData>("/mining"),
  addSource: (s: Partial<MiningSource>) => call<MiningConfigData>("/mining/sources", json("POST", s)),
  removeSource: (repo: string) => call<MiningConfigData>(`/mining/sources/${repo}`, json("DELETE")),
  doctor: () => call<ReadinessCheck[]>("/doctor"),
  mine: (o: { repos?: string[]; skipFetch?: boolean; extraPrompt?: string; language?: string; agent?: "claude" | "codex" }) => call<{ key: string }>("/mine", json("POST", o)),
  runs: () => call<{ live: Run[]; past: string[] }>("/runs"),
  run: (key: string) => call<Run>(`/runs/${encodeURIComponent(key)}`),
};

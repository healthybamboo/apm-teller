import { useState } from "react";
import { api } from "../../api/client";
import { useAsync } from "../../ui/useAsync";
import { useI18n } from "../../i18n";
import { Button, Chip, Copy, ErrorBox } from "../../ui/primitives";

/**
 * 出力先として選べるアシスタント。初期状態で Claude Code / Codex / Copilot にチェック。
 */
const ASSISTANTS: { target: string; label: string }[] = [
  { target: "claude", label: "Claude Code" }, { target: "codex", label: "Codex" }, { target: "copilot", label: "Copilot" },
  { target: "cursor", label: "Cursor" }, { target: "gemini", label: "Gemini" }, { target: "antigravity", label: "Antigravity" },
  { target: "intellij", label: "IntelliJ" }, { target: "kiro", label: "Kiro" }, { target: "opencode", label: "OpenCode" }, { target: "windsurf", label: "Windsurf" },
];
const DEFAULT_TARGETS = ["claude", "codex", "copilot"];
const KEY = "apm-teller.installTargets";

function loadTargets(): string[] {
  try { const v = JSON.parse(localStorage.getItem(KEY) ?? "null"); if (Array.isArray(v)) return v; } catch { /* ignore */ }
  return DEFAULT_TARGETS;
}

/**
 * 選択中パッケージのインストール手順。出力先アシスタントをチェックで絞り込める。
 */
export function InstallPanel({ selected, onClear }: { selected: string[]; onClear: () => void }) {
  const { t } = useI18n();
  const [targets, setTargetsState] = useState<string[]>(loadTargets);
  const setTargets = (v: string[]) => { setTargetsState(v); try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* ignore */ } };
  const toggle = (x: string) => setTargets(targets.includes(x) ? targets.filter((y) => y !== x) : [...targets, x]);
  const r = useAsync(() => (selected.length && targets.length ? api.install(selected, targets) : Promise.resolve([])), [selected.join(","), targets.join(",")]);
  if (selected.length === 0) return <p className="muted small" style={{ marginTop: 12 }}>{t("catalog.installHint")}</p>;
  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div className="row"><b>{t("catalog.install")}: {selected.join(", ")}</b><Button tone="ghost" onClick={onClear}>{t("catalog.clear")}</Button></div>
      <div className="row small" style={{ margin: "8px 0 4px" }}>
        <span className="muted">{t("catalog.targets")}</span>
        {ASSISTANTS.map((a) => <Chip key={a.target} on={targets.includes(a.target)} onToggle={() => toggle(a.target)}>{a.label}</Chip>)}
      </div>
      <ErrorBox error={r.error} />
      {targets.length === 0 && <p className="muted small">{t("catalog.noTargets")}</p>}
      {r.data?.map((rec) => (
        <div key={rec.title} style={{ marginTop: 8 }}>
          <div className="row small"><b>{rec.title}</b>{rec.note && <span className="muted">{rec.note}</span>}<span style={{ marginLeft: "auto" }}><Copy text={rec.steps.join("\n")} /></span></div>
          <pre>{rec.steps.join("\n")}</pre>
        </div>
      ))}
    </div>
  );
}

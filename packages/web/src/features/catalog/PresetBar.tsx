import { useState } from "react";
import type { Overview } from "../../api/types";
import { api } from "../../api/client";
import { useI18n } from "../../i18n";
import { Button, Badge } from "../../ui/primitives";

/**
 * プリセット（パッケージの束）。利用者はクリックで選択、作者は現在の選択から作成。
 */
export function PresetBar({ overview, selected, onSelect, edit, reload }: {
  overview: Overview; selected: string[]; onSelect: (p: string[]) => void; edit: boolean; reload: () => void;
}) {
  const { t, err: fmtErr } = useI18n();
  const presets = overview.catalog.presets;
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [err, setErr] = useState<string>();
  const create = async () => {
    try { await api.upsertPreset({ name, description: desc, packages: selected }); setName(""); setDesc(""); setErr(undefined); reload(); }
    catch (e) { setErr(fmtErr(e)); }
  };
  if (presets.length === 0 && !edit) return null;
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="row">
        <b className="small">{t("catalog.presets")}</b>
        {presets.map((p) => (
          <span key={p.name} className="row">
            <Button onClick={() => onSelect(p.packages)} title={p.description}>{p.name} <Badge>{p.packages.length}</Badge></Button>
            {edit && <Button tone="ghost" onClick={async () => { await api.removePreset(p.name); reload(); }}>✕</Button>}
          </span>
        ))}
        {presets.length === 0 && <span className="muted small">{t("catalog.presetsEmpty")}</span>}
      </div>
      {edit && (
        <div className="row small" style={{ marginTop: 8 }}>
          <input placeholder={t("catalog.presetName")} value={name} onChange={(e) => setName(e.target.value)} />
          <input style={{ flex: 1 }} placeholder={t("catalog.presetDesc")} value={desc} onChange={(e) => setDesc(e.target.value)} />
          <Button tone="primary" disabled={!name || selected.length === 0} onClick={create}>{t("catalog.createPreset", { n: selected.length })}</Button>
          {err && <span style={{ color: "var(--bad)" }}>{err}</span>}
        </div>
      )}
    </div>
  );
}

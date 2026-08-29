import { useState } from "react";
import type { PackageView, CatalogEntry } from "../../api/types";
import { api } from "../../api/client";
import { useI18n } from "../../i18n";
import { Badge, Button, Card, Chip } from "../../ui/primitives";
import { FilePreview } from "./FilePreview";

const TARGETS = ["claude", "copilot", "vscode", "codex", "cursor", "gemini"];

/**
 * 1 パッケージ: 中身（skills / instructions）のツリーと、作者モードでの表示設定。
 */
export function PackageCard({ pkg, entry, featured, selected, onToggle, edit, reload }: {
  pkg: PackageView; entry?: CatalogEntry; featured: boolean; selected: boolean; onToggle: () => void; edit: boolean; reload: () => void;
}) {
  const { t } = useI18n();
  const [preview, setPreview] = useState<string>();
  const [draft, setDraft] = useState<CatalogEntry>(entry ?? { recommended_targets: [], audience: [], hidden: false });
  const save = async () => { await api.setCatalogEntry(pkg.name, draft); reload(); };
  const toggleFeatured = async () => {
    const f = (await api.catalog()).featured;
    await api.setFeatured(featured ? f.filter((x) => x !== pkg.name) : [...f, pkg.name]);
    reload();
  };
  return (
    <Card className={`pkg ${selected ? "selected" : ""}`}>
      {/* カード全体（ヘッダー〜説明）がクリック領域。リンクや編集フォームはクリックを伝播させない */}
      <div className="pkg-hit" role="checkbox" aria-checked={selected} tabIndex={0} onClick={onToggle} onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onToggle(); } }} title={t("catalog.selectHint")}>
      <div className="row">
        <span className={`tick ${selected ? "on" : ""}`} aria-hidden="true">{selected ? "✓" : ""}</span>
        <b>{pkg.name}</b> <span className="muted small">v{pkg.version ?? "?"}{pkg.versionRange && <span title="apm.yml のバージョン指定"> · {pkg.versionRange}</span>}</span>
        {featured && <Badge tone="info">{t("catalog.featured")}</Badge>}
        {!pkg.local && <Badge>{t("catalog.remote")}</Badge>}
        {entry?.hidden && <Badge tone="warn">{t("catalog.hidden")}</Badge>}
      </div>
      <div className="small">{entry?.headline ?? pkg.description}</div>
      <div className="row small muted" style={{ marginTop: 4 }}>
        {(entry?.recommended_targets?.length ? entry.recommended_targets : pkg.targets).map((x) => <Badge key={x}>{x}</Badge>)}
        {pkg.tags.map((x) => <span key={x}>#{x}</span>)}
        {entry?.audience.map((a) => <span key={a}>@{a}</span>)}
      </div>
      </div>
      {pkg.local && (
        <ul className="tree small">
          {pkg.skills.map((s) => <li key={s.file}><span className="kind">skill</span> <a href="#" onClick={(e) => { e.preventDefault(); setPreview(s.file); }}>{s.name}</a> <span className="muted">{s.description}</span></li>)}
          {pkg.instructions.map((i) => <li key={i.file}><span className="kind">instr</span> <a href="#" onClick={(e) => { e.preventDefault(); setPreview(i.file); }}>{i.name}</a> <span className="muted">{i.applyTo && `(${i.applyTo}) `}{i.description}</span></li>)}
          {pkg.dependencies.apm.map((d) => <li key={d} className="muted">↳ apm: {d}</li>)}
          {pkg.dependencies.mcp.map((d) => <li key={d} className="muted">↳ mcp: {d}</li>)}
          {pkg.skills.length + pkg.instructions.length === 0 && <li className="muted">{t("catalog.noArtifacts")}</li>}
        </ul>
      )}
      {preview && <FilePreview path={preview} onClose={() => setPreview(undefined)} />}
      {edit && (
        <div style={{ marginTop: 8, borderTop: "1px solid var(--line)", paddingTop: 8 }} className="small">
          <div className="row"><input style={{ flex: 1 }} placeholder={t("catalog.headline")} value={draft.headline ?? ""} onChange={(e) => setDraft({ ...draft, headline: e.target.value })} /></div>
          <div className="row" style={{ marginTop: 4 }}>
            {TARGETS.map((x) => <Chip key={x} on={draft.recommended_targets.includes(x)} onToggle={() => setDraft({ ...draft, recommended_targets: draft.recommended_targets.includes(x) ? draft.recommended_targets.filter((y) => y !== x) : [...draft.recommended_targets, x] })}>{x}</Chip>)}
          </div>
          <div className="row" style={{ marginTop: 4 }}>
            <input style={{ flex: 1 }} placeholder={t("catalog.audience")} value={draft.audience.join(", ")} onChange={(e) => setDraft({ ...draft, audience: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
            <label><input type="checkbox" checked={draft.hidden} onChange={(e) => setDraft({ ...draft, hidden: e.target.checked })} /> {t("catalog.hide")}</label>
          </div>
          <div className="row" style={{ marginTop: 6 }}>
            <Button tone="primary" onClick={save}>{t("catalog.saveEntry")}</Button>
            <Button onClick={toggleFeatured}>{t(featured ? "catalog.unfeature" : "catalog.feature")}</Button>
          </div>
        </div>
      )}
    </Card>
  );
}

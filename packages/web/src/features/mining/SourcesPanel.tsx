import { useState } from "react";
import type { MiningSource } from "../../api/types";
import { api } from "../../api/client";
import { useI18n } from "../../i18n";
import { Button, Card, ErrorBox } from "../../ui/primitives";

/**
 * 対象リポジトリの追加・削除（teller.yml の mining.sources に保存）。
 */
export function SourcesPanel({ sources, reload }: { sources: MiningSource[]; reload: () => void }) {
  const { t, err: fmtErr } = useI18n();
  const [repo, setRepo] = useState("");
  const [prs, setPrs] = useState(30);
  const [err, setErr] = useState<string>();
  const add = async () => { try { await api.addSource({ repo: repo.trim(), prs }); setRepo(""); setErr(undefined); reload(); } catch (e) { setErr(fmtErr(e)); } };
  return (
    <Card>
      {sources.length === 0 && <p className="muted small">{t("mining.sourcesEmpty")}</p>}
      {sources.map((s) => (
        <div key={s.repo} className="row small" style={{ padding: "4px 0" }}>
          <code>{s.host ? `${s.host}/` : ""}{s.repo}</code><span className="muted">{t("mining.lastPrs", { n: s.prs })} · {s.include.join(" / ")}</span>
          <Button tone="ghost" onClick={async () => { await api.removeSource(s.repo); reload(); }}>{t("common.delete")}</Button>
        </div>
      ))}
      <div className="row small" style={{ marginTop: 6 }}>
        <input style={{ flex: 1, minWidth: 260 }} placeholder={t("mining.repoInput")} value={repo} onChange={(e) => setRepo(e.target.value)} onKeyDown={(e) => e.key === "Enter" && repo && add()} />
        <label>{t("mining.recent")} <input type="number" min={1} style={{ width: 64 }} value={prs} onChange={(e) => setPrs(Number(e.target.value))} /> {t("mining.prsLabel")}</label>
        <Button tone="primary" disabled={!repo} onClick={add}>{t("common.add")}</Button>
      </div>
      <ErrorBox error={err} />
    </Card>
  );
}

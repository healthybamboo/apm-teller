import { useEffect, useState } from "react";
import type { Convention } from "../../api/types";
import { api } from "../../api/client";
import { useI18n } from "../../i18n";
import { Button, ErrorBox } from "../../ui/primitives";

/**
 * 前回書き出したパッケージ名を覚えておく localStorage キー。
 */
const LAST_PKG = "apm-teller.lastPromotePackage";

/**
 * accepted な convention をパッケージの skill / instruction として書き出す。
 */
export function PromoteForm({ convention, packages, onDone }: { convention: Convention; packages: string[]; onDone: () => void }) {
  const { t, err: fmtErr } = useI18n();
  const lastPkg = (() => { try { return localStorage.getItem(LAST_PKG) ?? ""; } catch { return ""; } })();
  const [pkg, setPkg] = useState(packages.includes(lastPkg) ? lastPkg : (packages[0] ?? ""));
  const [newPkg, setNewPkg] = useState("");
  const [kind, setKind] = useState(convention.meta.kind);
  const [name, setName] = useState(convention.meta.id);
  const [applyTo, setApplyTo] = useState("");
  const [err, setErr] = useState<string>();
  const [result, setResult] = useState<string>();
  // 別の規約を選んだり、詳細側で種別を編集したりしたら、初期値を追従させる
  useEffect(() => { setKind(convention.meta.kind); setName(convention.meta.id); setApplyTo(""); setErr(undefined); setResult(undefined); }, [convention.meta.id, convention.meta.kind]);
  useEffect(() => { if (!packages.includes(pkg)) setPkg(packages.includes(lastPkg) ? lastPkg : (packages[0] ?? "")); }, [packages.join(","), lastPkg]);
  const target = newPkg || pkg;
  const go = async () => {
    try {
      const r = await api.promote(convention.meta.id, { package: target, kind, name, applyTo: applyTo || undefined });
      try { localStorage.setItem(LAST_PKG, target); } catch { /* ignore */ }
      setResult(`${r.target}${r.packageCreated ? " " + t("conventions.packageCreated") : ""}`); setErr(undefined); onDone();
    } catch (e) { setErr(fmtErr(e)); }
  };
  return (
    <div style={{ marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
      <h3>{t("conventions.promoteTitle")}</h3>
      <p className="muted small">{t("conventions.promoteIntro")}</p>
      <div className="row small">
        <select value={pkg} onChange={(e) => setPkg(e.target.value)} disabled={!!newPkg}>{packages.map((p) => <option key={p}>{p}</option>)}{packages.length === 0 && <option value="">-</option>}</select>
        <span className="muted">{t("conventions.orNew")}</span><input placeholder={t("conventions.newPackage")} value={newPkg} onChange={(e) => setNewPkg(e.target.value)} />
        <select value={kind} onChange={(e) => setKind(e.target.value as any)}><option value="instruction">{t("kind.instruction")}</option><option value="skill">{t("kind.skill")}</option></select>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("conventions.fileName")} />
        {kind === "instruction" && <input value={applyTo} onChange={(e) => setApplyTo(e.target.value)} placeholder={t("conventions.applyTo")} />}
        <Button tone="primary" disabled={!target} onClick={go}>{t("conventions.promote")}</Button>
      </div>
      <ErrorBox error={err} />
      {result && <p className="small">{t("conventions.wrote")}: <code>{result}</code></p>}
    </div>
  );
}

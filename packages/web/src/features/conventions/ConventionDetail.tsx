import { useEffect, useState } from "react";
import type { Convention } from "../../api/types";
import { api } from "../../api/client";
import { useI18n } from "../../i18n";
import { Badge, Button, Card, ErrorBox } from "../../ui/primitives";
import { PromoteForm } from "./PromoteForm";
import { TONE } from "./ConventionsPage";

/**
 * 1 件の convention: 出典・本文の閲覧と編集、状態遷移、昇格。
 */
export function ConventionDetail({ convention, packages, onChange }: { convention: Convention; packages: string[]; onChange: () => void }) {
  const { t, err: fmtErr } = useI18n();
  const m = convention.meta;
  const [body, setBody] = useState(convention.body);
  const [title, setTitle] = useState(m.title);
  const [err, setErr] = useState<string>();
  useEffect(() => { setBody(convention.body); setTitle(m.title); setErr(undefined); }, [convention]);
  const act = async (fn: () => Promise<unknown>) => { try { await fn(); setErr(undefined); onChange(); } catch (e) { setErr(fmtErr(e)); } };
  const dirty = body !== convention.body || title !== m.title;
  const readOnly = m.status === "promoted";
  return (
    <Card>
      <div className="row">
        <input style={{ flex: 1, fontWeight: 600 }} value={title} onChange={(e) => setTitle(e.target.value)} disabled={readOnly} />
        {readOnly ? <Badge>{t(`kind.${m.kind}`)}</Badge> : (
          <select value={m.kind} title={t("conventions.kindHint")} onChange={(e) => act(() => api.editConvention(m.id, { kind: e.target.value as "skill" | "instruction" }))}>
            <option value="instruction">{t("kind.instruction")}</option><option value="skill">{t("kind.skill")}</option>
          </select>
        )}
        <Badge tone={TONE[m.status]}>{t(`status.${m.status}`)}</Badge>
      </div>
      <div className="row small muted" style={{ marginTop: 4 }}>
        <code>{convention.file}</code>{m.run && <span>{t("conventions.run")} {m.run}</span>}<span>{t("conventions.confidence")} {Math.round(m.confidence * 100)}%</span>{m.tags.map((x) => <span key={x}>#{x}</span>)}
      </div>
      <h3>{t("conventions.sourcesTitle")}</h3>
      <ul className="small" style={{ paddingLeft: 18 }}>
        {m.sources.map((s, i) => <li key={i}>{s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.repo}{s.pr ? ` #${s.pr}` : ""}</a> : s.repo}{s.quote && <span className="muted"> — “{s.quote}”</span>}</li>)}
      </ul>
      <h3>{t("conventions.bodyTitle")}</h3>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} disabled={readOnly} />
      <ErrorBox error={err} />
      <div className="row" style={{ marginTop: 8 }}>
        {dirty && !readOnly && <Button tone="primary" onClick={() => act(() => api.editConvention(m.id, { title, body }))}>{t("conventions.saveChanges")}</Button>}
        {m.status === "proposed" && <><Button tone="primary" onClick={() => act(() => api.review(m.id, "accept"))}>{t("conventions.accept")}</Button><Button tone="danger" onClick={() => act(() => api.review(m.id, "reject"))}>{t("conventions.reject")}</Button></>}
        {m.status === "accepted" && <Button tone="danger" onClick={() => act(() => api.review(m.id, "reject"))}>{t("conventions.reject")}</Button>}
        {(m.status === "rejected" || m.status === "accepted") && <Button onClick={() => act(() => api.review(m.id, "reopen"))}>{t("conventions.reopen")}</Button>}
        {m.status === "promoted" && <span className="small muted">{t("conventions.promotedTo")}: <code>{m.promoted_to}</code></span>}
      </div>
      {m.status === "accepted" && <PromoteForm convention={convention} packages={packages} onDone={onChange} />}
    </Card>
  );
}

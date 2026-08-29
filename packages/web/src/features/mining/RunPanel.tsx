import { useEffect, useRef, useState } from "react";
import { api } from "../../api/client";
import { useAsync } from "../../ui/useAsync";
import { useI18n } from "../../i18n";
import { Button, Card, ErrorBox, Badge } from "../../ui/primitives";
import { Terminal } from "./Terminal";

const LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)]+)/g;

/**
 * ログ 1 行の `[text](url)` と裸の URL をリンクにし、`[stderr]` 行は警告色にする。
 */
function LogLine({ text }: { text: string }) {
  const nodes: (string | JSX.Element)[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK_RE)) {
    nodes.push(text.slice(last, m.index));
    const href = m[2] ?? m[3]!;
    nodes.push(<a key={m.index} href={href} target="_blank" rel="noreferrer">{m[1] ?? href}</a>);
    last = m.index! + m[0].length;
  }
  nodes.push(text.slice(last));
  const warn = text.startsWith("[stderr]");
  return <div className={warn ? "log-warn" : undefined}>{warn ? "⚠ " : ""}{nodes}</div>;
}

const TONE = { done: "ok", failed: "bad", running: "info" } as const;

/**
 * 抽出の実行とログ。`claude -p` は裏で走り、hook が convention を検証する。
 */
export function RunPanel({ sources, ready, blockers, defaultAgent }: { sources: string[]; ready: boolean; blockers: string[]; defaultAgent: "claude" | "codex" }) {
  const { t, err: fmtErr, lang } = useI18n();
  const runs = useAsync(api.runs);
  const [key, setKeyState] = useState<string | undefined>(() => { try { return sessionStorage.getItem("apm-teller.run") ?? undefined; } catch { return undefined; } });
  const setKey = (k?: string) => { setKeyState(k); try { if (k) sessionStorage.setItem("apm-teller.run", k); } catch { /* ignore */ } };
  const [skipFetch, setSkipFetch] = useState(false);
  const [extraPrompt, setExtraPrompt] = useState("");
  const [agent, setAgent] = useState<"claude" | "codex">(defaultAgent);
  const [err, setErr] = useState<string>();
  const [starting, setStarting] = useState(false);
  const [startedAt, setStartedAt] = useState<number>();
  const [now, setNow] = useState(Date.now());
  const logRef = useRef<HTMLPreElement>(null);
  const current = useAsync(() => (key ? api.run(key) : Promise.resolve(undefined)), [key]);
  useEffect(() => {
    if (current.data?.status !== "running") return;
    const i = setInterval(current.reload, 1500);
    return () => clearInterval(i);
  }, [current.data?.status, current.reload]);
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  // タブを離れて戻ったときは、サーバー側で動いている実行に再接続する（実行自体はサーバーで継続している）
  useEffect(() => {
    const running = runs.data?.live.find((r) => r.status === "running");
    if (running && !key) { setKey(running.key); setStartedAt(Date.parse(running.started ?? "") || Date.now()); }
    else if (running && key === running.key && !startedAt) setStartedAt(Date.parse(running.started ?? "") || Date.now());
  }, [runs.data]);
  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight }); }, [current.data?.lines.length]);
  const start = async () => {
    setStarting(true); setErr(undefined); setStartedAt(Date.now());
    try { const r = await api.mine({ skipFetch, extraPrompt, language: lang, agent }); setKey(r.key); runs.reload(); } catch (e) { setErr(fmtErr(e)); setStartedAt(undefined); }
    finally { setStarting(false); }
  };
  const st = current.data?.status;
  const busy = starting || st === "running";
  const elapsed = startedAt && busy ? Math.floor((now - startedAt) / 1000) : undefined;
  const lastLine = current.data?.lines.filter(Boolean).at(-1);
  const prog = busy ? current.data?.progress : undefined;
  const pct = prog && prog.total > 0 ? Math.round((prog.done / prog.total) * 100) : undefined;
  return (
    <Card>
      {!ready && <p className="small" style={{ color: "var(--bad)" }}>{t("mining.blocked", { items: blockers.join(", ") })}</p>}
      <div className="row">
        <select value={agent} onChange={(e) => setAgent(e.target.value as "claude" | "codex")} disabled={busy} title={t("mining.agent")}><option value="claude">Claude Code</option><option value="codex">Codex</option></select>
        <Button tone="primary" disabled={!ready || busy} onClick={start}>{busy ? <><span className="spinner" /> {t("mining.running")}</> : t("mining.run", { n: sources.length })}</Button>
        <label className="small muted" title={t("mining.skipFetchHint")}><input type="checkbox" checked={skipFetch} onChange={(e) => setSkipFetch(e.target.checked)} /> {t("mining.skipFetch")}</label>
        {st && <Badge tone={TONE[st]}>{t(st === "running" ? "common.running" : st === "done" ? "common.done" : "common.failed")}</Badge>}
        {elapsed !== undefined && <span className="small muted">{t("mining.elapsed", { s: elapsed })}</span>}
      </div>
      {prog && (
        <div className="bar-wrap">
          <div className="bar-label small">{prog.phase === "fetch" ? t("mining.phaseFetch", { done: prog.done, total: prog.total, label: prog.label ?? "" }) : t("mining.phaseExtract")}</div>
          <div className={`bar ${pct === undefined ? "indeterminate" : ""}`}><div className="bar-fill" style={pct === undefined ? undefined : { width: `${pct}%` }} /></div>
        </div>
      )}
      {busy && lastLine && <p className="small progress">▸ <LogLine text={lastLine} /></p>}
      <details className="small" style={{ margin: "6px 0" }}>
        <summary className="muted">{t("mining.extraPrompt")}</summary>
        <textarea style={{ minHeight: 70 }} placeholder={t("mining.extraPromptHint")} value={extraPrompt} onChange={(e) => setExtraPrompt(e.target.value)} disabled={busy} />
      </details>
      <p className="muted small">{t("mining.takesTime")}</p>
      <ErrorBox error={err} />
      {key && current.data?.interactive && (
        <>
          <p className="small muted">{t("mining.terminalHint")}</p>
          <Terminal runKey={key} />
        </>
      )}
      <details className="small" open={!current.data?.interactive}>
        <summary className="muted">{t("mining.logTitle")}</summary>
      <pre className="log" ref={logRef}>{current.data?.lines.length ? current.data.lines.map((l, i) => <LogLine key={i} text={l} />) : (starting ? t("mining.starting") : t("mining.logPlaceholder"))}</pre>
      </details>
      <div className="row small muted" style={{ marginTop: 6 }}>
        {t("mining.past")}
        {runs.data?.past.slice(0, 10).map((r) => <a key={r} href="#" onClick={(e) => { e.preventDefault(); setKey(r); }}>{r}</a>)}
        {runs.data?.past.length === 0 && <span>{t("common.none")}</span>}
      </div>
    </Card>
  );
}

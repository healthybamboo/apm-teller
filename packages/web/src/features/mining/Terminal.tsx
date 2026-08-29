import { useEffect, useRef } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

/**
 * 実行中のエージェントセッションに WebSocket で接続するブラウザ端末（通常のターミナルと同じ操作感）。
 */
export function Terminal({ runKey, onExit }: { runKey: string; onExit?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const term = new XTerm({ cursorBlink: true, fontSize: 13, lineHeight: 1.2, fontFamily: "ui-monospace, Menlo, Monaco, monospace", convertEol: false, scrollback: 5000, allowProposedApi: true, theme: { background: "#141413" } });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(el);
    const refit = () => { try { fit.fit(); } catch { /* not visible yet */ } };
    refit();
    document.fonts?.ready.then(refit);
    const t1 = setTimeout(refit, 100);
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${location.host}/api/runs/${encodeURIComponent(runKey)}/terminal`);
    ws.onopen = () => ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data) as { type: string; data?: string; message?: string };
      if (msg.type === "output" && msg.data) term.write(msg.data);
      if (msg.type === "exit") { term.write("\r\n[session closed]\r\n"); onExit?.(); }
      if (msg.type === "error") term.write(`\r\n[${msg.message}]\r\n`);
    };
    term.onData((d) => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "input", data: d })); });
    const onResize = () => { refit(); if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows })); };
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(el);
    term.focus();
    return () => { clearTimeout(t1); ro.disconnect(); window.removeEventListener("resize", onResize); ws.close(); term.dispose(); };
  }, [runKey, onExit]);
  return <div className="terminal" ref={ref} />;
}

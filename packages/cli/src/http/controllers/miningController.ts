import { Hono } from "hono";
import { NotFoundError, type CheckReadinessUseCase, type MineConventionsUseCase, type ConfigureMiningUseCase, type RunLogPort, type AgentSession } from "@apm-teller/core";
import type { UpgradeWebSocket } from "hono/ws";
import { Controller } from "./controller";

/**
 * 進行中（または直近に終了した）マイニング実行のメモリ上の状態。
 */
interface LiveRun {
  /**
   * 実行を識別するキー。開始時刻の ISO 8601 文字列（例: `2026-08-30T01:02:03.000Z`）。
   */
  key: string;

  /**
   * ユースケースが採番した run ID（`.teller/runs/<runId>.log` に対応）。完了するまでは未設定。
   */
  runId?: string;

  /**
   * 実行状態。`running` は進行中、`done` は exit 0 で終了、`failed` は非 0 終了または例外。
   */
  status: "running" | "done" | "failed";

  /**
   * これまでに出力されたログ行。
   */
  lines: string[];

  /**
   * 進捗。phase は fetch（gh 取得、done/total あり）か extract（claude 実行中、不確定）。
   */
  progress?: { phase: "fetch" | "extract"; done: number; total: number; label?: string };

  /**
   * 起動中のエージェントセッション（ブラウザのターミナルが接続する）。終了後は undefined。
   */
  session?: AgentSession;

  /**
   * 端末出力の直近バッファ。接続し直したブラウザに再生する。
   */
  scrollback: string;

  /**
   * 接続中のブラウザターミナルへの出力購読者。
   */
  listeners: Set<(data: string) => void>;

  /**
   * 開始時刻の ISO 8601 文字列（`key` と同じ値）。
   */
  started: string;
}

/**
 * マイニング設定・doctor・実行（非同期）。進行中ログはメモリ、完了後は RunLogPort から読む。
 */
export class MiningController extends Controller {
  private readonly live = new Map<string, LiveRun>();

  constructor(
    private readonly upgradeWebSocket: UpgradeWebSocket,
    private readonly config: ConfigureMiningUseCase,
    private readonly readiness: CheckReadinessUseCase,
    private readonly mine: MineConventionsUseCase,
    private readonly runs: RunLogPort,
    private readonly clock: () => Date,
  ) { super(); }

  /**
   * マイニング関連のルートを登録する。
   * `GET /mining`、`POST /mining/sources`、`DELETE /mining/sources/:owner/:repo`、`GET /doctor`、
   * `POST /mine`（非同期開始、`{ key }` を返す）、`GET /runs`（進行中と過去の一覧）、`GET /runs/:key`（ログ取得）。
   *
   * @returns これらのルートを載せた Hono サブアプリ
   */
  routes() {
    const r = new Hono();
    r.get("/mining", this.handle(() => this.config.get()));
    r.post("/mining/sources", this.handle(async (c) => this.config.addSource(await c.req.json())));
    r.delete("/mining/sources/:owner/:repo", this.handle((c) => this.config.removeSource(`${this.param(c, "owner")}/${this.param(c, "repo")}`)));
    r.get("/doctor", this.handle(() => this.readiness.execute()));
    r.post("/mine", this.handle(async (c) => this.start((await c.req.json().catch(() => ({}))) as { repos?: string[]; skipFetch?: boolean; extraPrompt?: string; language?: string; agent?: "claude" | "codex" })));
    r.get("/runs", this.handle(() => ({ live: [...this.live.values()].map((l) => ({ key: l.key, runId: l.runId, status: l.status, started: l.started })), past: this.runs.listPast() })));
    r.get("/runs/:key/terminal", this.upgradeWebSocket((c) => {
      const run = this.live.get(this.param(c, "key"));
      let detach = () => {};
      return {
        onOpen: (_evt, ws) => {
          if (!run) { ws.send(JSON.stringify({ type: "error", message: "run not found" })); ws.close(); return; }
          ws.send(JSON.stringify({ type: "output", data: run.scrollback }));
          if (!run.session) { ws.send(JSON.stringify({ type: "exit" })); return; }
          const listener = (d: string) => ws.send(JSON.stringify({ type: "output", data: d }));
          run.listeners.add(listener);
          detach = () => run.listeners.delete(listener);
        },
        onMessage: (evt) => {
          if (!run?.session) return;
          const msg = JSON.parse(String(evt.data)) as { type: string; data?: string; cols?: number; rows?: number };
          if (msg.type === "input" && msg.data !== undefined) run.session.write(msg.data);
          if (msg.type === "resize" && msg.cols && msg.rows) run.session.resize(msg.cols, msg.rows);
          if (msg.type === "kill") run.session.kill();
        },
        onClose: () => detach(),
      };
    }));
    r.get("/runs/:key", this.handle((c) => {
      const key = this.param(c, "key");
      const l = this.live.get(key);
      if (l) return { key: l.key, runId: l.runId, status: l.status, lines: l.lines, started: l.started, progress: l.progress, interactive: !!l.session };
      const lines = this.runs.read(key);
      if (!lines) throw new NotFoundError(`run ${key}`);
      return { key, status: "done", lines };
    }));
    return r;
  }

  /**
   * マイニングをバックグラウンドで開始し、進行状況を `live` に記録する。
   *
   * @param o 開始オプション。`repos` は `owner/repo` 形式の配列（省略で全件）、`skipFetch` は生データ再取得の省略フラグ
   * @returns 進行状況を参照するためのキー（開始時刻の ISO 8601 文字列）
   */
  private start(o: { repos?: string[]; skipFetch?: boolean; extraPrompt?: string; language?: string; agent?: "claude" | "codex" }) {
    const key = this.clock().toISOString();
    const run: LiveRun = { key, status: "running", lines: [], started: key, scrollback: "", listeners: new Set() };
    this.live.set(key, run);
    this.mine.execute({
      ...o,
      log: (s) => { run.lines.push(s); },
      onProgress: (done, total, label) => { run.progress = { phase: "fetch", done, total, label }; },
      onSession: (session) => {
        run.session = session;
        run.progress = { phase: "extract", done: 0, total: 0 };
        session.onData((d) => {
          run.scrollback = (run.scrollback + d).slice(-200_000);
          for (const l of run.listeners) l(d);
        });
        session.onExit(() => { run.session = undefined; for (const l of run.listeners) l("\r\n[session closed]\r\n"); });
      },
    })
      .then((res) => { run.runId = res.runId; run.status = res.exit === 0 ? "done" : "failed"; })
      .catch((e) => { run.lines.push(`error: ${e.message}`); run.status = "failed"; });
    return { key };
  }
}

import { execFile } from "node:child_process";
import { serve } from "@hono/node-server";
import type { createApp } from "../http/app";
import type { CliCommand } from "./command";

/**
 * ローカル GUI サーバーを起動する。
 */
export class ServeCommand implements CliCommand<{ port: number; open: boolean }> {
  constructor(private readonly bundle: ReturnType<typeof createApp>, private readonly root: string) {}

  /**
   * HTTP サーバーを起動して待ち受けを開始し、URL を表示する。`open` が true なら既定ブラウザで開く。
   * サーバーはバックグラウンドで動き続けるため、この呼び出し自体はすぐに戻る。
   *
   * @param o 起動オプション。`port` は待ち受けポート番号（1..65535、既定 4747）、
   *   `open` はブラウザを自動で開くか（`--no-open` で false）
   * @returns 常に 0（サーバー起動の成否はコールバック側で扱う）
   */
  run(o: { port: number; open: boolean }) {
    const server = serve({ fetch: this.bundle.app.fetch, port: o.port }, (info) => {
      const url = `http://localhost:${info.port}`;
      console.log(`apm-teller: ${this.root}\n  → ${url}`);
      if (o.open) execFile(process.platform === "darwin" ? "open" : "xdg-open", [url], () => {});
    });
    this.bundle.injectWebSocket(server);
    server.on("error", (e: NodeJS.ErrnoException) => {
      console.error(e.code === "EADDRINUSE" ? `port ${o.port} is already in use — stop the other apm-teller (lsof -ti :${o.port} | xargs kill) or pass --port` : e.message);
      process.exit(1);
    });
    return 0;
  }
}

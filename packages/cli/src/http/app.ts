import fs from "node:fs";
import path from "node:path";
import { Hono } from "hono";
import { createNodeWebSocket } from "@hono/node-ws";
import type { UpgradeWebSocket } from "hono/ws";
import { serveStatic } from "@hono/node-server/serve-static";
import type { Container } from "../container";
import type { Controller } from "./controllers/controller";
import { VaultController } from "./controllers/vaultController";
import { CatalogController } from "./controllers/catalogController";
import { ConventionController } from "./controllers/conventionController";
import { MiningController } from "./controllers/miningController";

/**
 * Container から Controller 群を組み立てる。
 *
 * @param ct `createContainer` が返した配線済み Container（ユースケース・RunLogPort・clock を取り出す）
 * @param upgradeWebSocket Hono の WebSocket アップグレード関数（ブラウザ端末の接続に使う）
 * @returns vault / catalog / convention / mining の各 Controller を並べた配列
 */
export function createControllers(ct: Container, upgradeWebSocket: UpgradeWebSocket): Controller[] {
  const u = ct.usecases;
  return [
    new VaultController(u.inspect, u.install, ct.apm),
    new CatalogController(u.catalog),
    new ConventionController(u.review, u.promote),
    new MiningController(upgradeWebSocket, u.mining, u.readiness, u.mine, ct.deps.runs, ct.deps.clock),
  ];
}

/**
 * API ルートを束ね、ビルド済み Web UI を配信する Hono アプリを組み立てる。
 * `/api/file` で vault 内ファイルの読み取り（ルート外は 404）、`publicDir` があれば静的配信と SPA フォールバックを提供する。
 *
 * @param ct 配線済み Container。`root` を vault 内ファイル読み取りの基点として使う
 * @param publicDir ビルド済み Web UI（index.html を含む）ディレクトリの絶対パス。存在しなければ API のみ提供する
 * @returns ルート登録済みの Hono アプリ
 */
export function createApp(ct: Container, publicDir: string) {
  const app = new Hono();
  const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });
  const controllers = createControllers(ct, upgradeWebSocket);
  for (const c of controllers) app.route("/api", c.routes());

  // vault 内ファイルの読み取り（SKILL.md 等のプレビュー用）。ルート外は拒否。
  app.get("/api/file", (c) => {
    const abs = path.resolve(ct.root, c.req.query("path") ?? "");
    if (!abs.startsWith(ct.root + path.sep) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) return c.text("not found", 404);
    return c.text(fs.readFileSync(abs, "utf8"));
  });

  if (fs.existsSync(publicDir)) {
    app.use("/*", serveStatic({ root: path.relative(process.cwd(), publicDir) || "." }));
    app.get("*", (c) => c.html(fs.readFileSync(path.join(publicDir, "index.html"), "utf8")));
  } else {
    app.get("/", (c) => c.text("apm-teller API (web UI not built). Try /api/vault"));
  }
  return { app, injectWebSocket };
}

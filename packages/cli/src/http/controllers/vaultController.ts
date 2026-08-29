import { Hono } from "hono";
import type { InspectVaultUseCase, GetInstallRecipesUseCase } from "@apm-teller/core";
import { Controller } from "./controller";
import { ApmCli, APM_COMMANDS, type ApmCommand } from "../../infrastructure/apmCli";

/**
 * vault の読み取り・インストール手順・apm 実行。
 */
export class VaultController extends Controller {
  constructor(private readonly inspect: InspectVaultUseCase, private readonly install: GetInstallRecipesUseCase, private readonly apm: ApmCli) { super(); }

  /**
   * vault 関連のルートを登録する。
   * `GET /vault`（概要）、`GET /install?packages=a,b`（インストール手順）、
   * `POST /apm/:cmd`（pack | check | outdated の実行。未知のコマンドは 400）。
   *
   * @returns これらのルートを載せた Hono サブアプリ
   */
  routes() {
    const r = new Hono();
    r.get("/vault", this.handle(() => this.inspect.execute()));
    r.get("/install", this.handle((c) => this.install.execute((c.req.query("packages") ?? "").split(",").filter(Boolean), (c.req.query("targets") ?? "").split(",").filter(Boolean))));
    r.post("/apm/:cmd", this.handle((c) => {
      const cmd = this.param(c, "cmd");
      if (!(cmd in APM_COMMANDS)) return c.json({ error: "unknown command" }, 400);
      return this.apm.run(cmd as ApmCommand);
    }));
    return r;
  }
}

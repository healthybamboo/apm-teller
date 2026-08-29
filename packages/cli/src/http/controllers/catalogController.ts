import { Hono } from "hono";
import type { CurateCatalogUseCase } from "@apm-teller/core";
import { Controller } from "./controller";

/**
 * カタログ（見せ方）の編集。集約メソッド単位のエンドポイント。
 */
export class CatalogController extends Controller {
  constructor(private readonly catalog: CurateCatalogUseCase) { super(); }

  /**
   * カタログ関連のルートを登録する。
   * `GET /catalog`、`PUT /catalog/entries/:pkg`、`PUT /catalog/featured`、`PUT /catalog/presets`、`DELETE /catalog/presets/:name`。
   *
   * @returns これらのルートを載せた Hono サブアプリ
   */
  routes() {
    const r = new Hono();
    r.get("/catalog", this.handle(() => this.catalog.get()));
    r.put("/catalog/entries/:pkg", this.handle(async (c) => this.catalog.setEntry(this.param(c, "pkg"), await c.req.json())));
    r.put("/catalog/featured", this.handle(async (c) => this.catalog.setFeatured((await c.req.json()).packages ?? [])));
    r.put("/catalog/presets", this.handle(async (c) => this.catalog.upsertPreset(await c.req.json())));
    r.delete("/catalog/presets/:name", this.handle((c) => this.catalog.removePreset(this.param(c, "name"))));
    return r;
  }
}

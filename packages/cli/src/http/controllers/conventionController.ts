import { Hono } from "hono";
import type { ReviewConventionUseCase, PromoteConventionUseCase, ReviewAction } from "@apm-teller/core";
import { Controller } from "./controller";

/**
 * convention の審査（承認/却下/再開/編集）と昇格。
 */
export class ConventionController extends Controller {
  constructor(private readonly review: ReviewConventionUseCase, private readonly promote: PromoteConventionUseCase) { super(); }

  /**
   * convention 関連のルートを登録する。
   * `GET /conventions`（一覧と invalid ファイル）、`POST /conventions/:id/:action`（accept | reject | reopen）、
   * `PATCH /conventions/:id`（メタ・本文の編集）、`POST /conventions/:id/promote`（パッケージへ昇格）。
   *
   * @returns これらのルートを載せた Hono サブアプリ
   */
  routes() {
    const r = new Hono();
    r.get("/conventions", this.handle(() => {
      const { conventions, invalid } = this.review.list();
      return { conventions: conventions.map((c) => ({ file: `${c.id}.md`, meta: c.toProps(), body: c.body })), invalid };
    }));
    r.post("/conventions/:id/:action{accept|reject|reopen}", this.handle((c) => ({ file: this.review.act(this.param(c, "id"), this.param(c, "action") as ReviewAction) })));
    r.patch("/conventions/:id", this.handle(async (c) => ({ file: this.review.edit(this.param(c, "id"), await c.req.json()) })));
    r.post("/conventions/:id/promote", this.handle(async (c) => this.promote.execute({ ...(await c.req.json()), id: this.param(c, "id") })));
    return r;
  }
}

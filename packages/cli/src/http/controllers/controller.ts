import type { Context } from "hono";
import { Hono } from "hono";
import { DomainError, InvariantViolation } from "@apm-teller/core";

/**
 * ドメインエラーコード → HTTP ステータス。
 */
const STATUS: Record<string, 400 | 404 | 409 | 412> = { not_found: 404, invariant_violation: 409, not_configured: 412, not_ready: 412 };

/**
 * Controller の基底。ルート登録とエラー変換だけを担う。
 */
export abstract class Controller {
  /**
   * このコントローラのルートを載せた Hono サブアプリを返す。`/api` 配下にマウントされる。
   *
   * @returns ルート登録済みの Hono サブアプリ
   */
  abstract routes(): Hono;

  /**
   * パスパラメータを取り出す（ルート定義上必ず存在する前提）。
   *
   * @param c 現在のリクエストの Hono Context
   * @param name ルートパターンで `:name` として宣言したパラメータ名（例: `id`、`pkg`）
   * @returns パラメータの値（URL デコード済み文字列）
   */
  protected param(c: Context, name: string): string {
    return c.req.param(name) as string;
  }

  /**
   * ハンドラを包み、例外を JSON エラー応答に変換する。
   * DomainError は `{ error, code, issues }` としてコードに応じたステータス（404 / 409 / 412、未知なら 400）、
   * それ以外は `{ error }` として 500 を返す。
   *
   * @param fn 実際の処理。Response を返せばそのまま応答し、それ以外の値は JSON 化する（undefined は `{ ok: true }`）
   * @returns Hono に登録できるハンドラ関数
   */
  protected handle(fn: (c: Context) => unknown | Promise<unknown>) {
    return async (c: Context) => {
      try {
        const r = await fn(c);
        return r instanceof Response ? r : c.json(r ?? { ok: true });
      } catch (e) {
        if (e instanceof DomainError) {
          return c.json({ error: e.message, code: e.code, key: e.key, params: e.params, issues: e instanceof InvariantViolation ? e.issues : [] }, STATUS[e.code] ?? 400);
        }
        return c.json({ error: (e as Error).message ?? String(e) }, 500);
      }
    };
  }
}

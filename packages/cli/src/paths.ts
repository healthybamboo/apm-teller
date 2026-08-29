import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * この npm パッケージのルート（templates / public を探すため）。
 */
export const PKG_ROOT = path.resolve(here, "..");

/**
 * init が配る雛形（teller.yml / プロンプト / hooks 設定）の置き場。
 */
export const TEMPLATES_DIR = path.join(PKG_ROOT, "templates");

/**
 * ビルド済み Web UI の置き場（serve が配信）。
 */
export const PUBLIC_DIR = path.join(PKG_ROOT, "public");

/**
 * 指定ディレクトリから親へ辿り、マーカーファイルのあるディレクトリを vault ルートとして返す。
 * ファイルシステムのルートまで見つからなければ `start` 自身を返す。
 *
 * @param start 探索を始めるディレクトリのパス（相対可、絶対に解決される）。既定は `process.cwd()`
 * @param markers vault ルートの目印となるファイル名の配列。既定は `["apm.yml", "teller.yml"]`
 * @returns vault ルートの絶対パス
 */
export function findVaultRoot(start = process.cwd(), markers = ["apm.yml", "teller.yml"]): string {
  let dir = path.resolve(start);
  for (;;) {
    if (markers.some((m) => fs.existsSync(path.join(dir, m)))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return path.resolve(start);
    dir = parent;
  }
}

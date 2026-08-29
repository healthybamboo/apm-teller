import fs from "node:fs";
import path from "node:path";
import type { ReviewSourcePort, MiningSource, Logger, ProgressReporter } from "@apm-teller/core";
import { runCommandAsync } from "./shell";

/**
 * 生データの 1 コメント。
 */
export interface RawComment {
  /**
   * コメント種別。`review` はレビュー本文、`review_comment` は diff 行へのコメント、`issue_comment` は会話欄のコメント。
   */
  type: "review" | "review_comment" | "issue_comment";

  /**
   * 投稿者の GitHub ログイン名。
   */
  author: string;

  /**
   * コメント本文（Markdown）。
   */
  body: string;

  /**
   * コメントの HTML URL（GitHub 上のパーマリンク）。
   */
  url: string;

  /**
   * コメント対象ファイルのリポジトリ相対パス（review_comment のみ）。
   */
  path?: string;

  /**
   * コメント対象の diff 断片（review_comment のみ）。
   */
  diff_hunk?: string;

  /**
   * レビュー状態（review のみ）。`APPROVED` | `CHANGES_REQUESTED` | `COMMENTED` など。
   */
  state?: string;

  /**
   * 投稿日時（ISO 8601、例: `2026-08-30T01:02:03Z`）。
   */
  created_at: string;
}

/**
 * 生データの 1 PR（`<raw>/<owner>__<repo>/<number>.json`）。
 */
export interface RawPullRequest {
  /**
   * リポジトリ。`owner/repo` 形式（例: `microsoft/apm`）。
   */
  repo: string;

  /**
   * PR 番号。
   */
  number: number;

  /**
   * PR タイトル。
   */
  title: string;

  /**
   * PR 本文（Markdown、無ければ空文字）。
   */
  body: string;

  /**
   * PR の HTML URL。
   */
  url: string;

  /**
   * 作成者の GitHub ログイン名。
   */
  author: string;

  /**
   * マージ日時（ISO 8601）。未マージなら null。
   */
  merged_at: string | null;

  /**
   * レビュー・コメントの一覧（投稿順は保証しない）。
   */
  comments: RawComment[];
}

/**
 * gh CLI で PR のレビュー・コメントを取得する {@link ReviewSourcePort} 実装。
 */
export class GhReviewSource implements ReviewSourcePort {
  constructor(private readonly root: string) {}

  /**
   * `gh api` を実行し、JSON 配列としてパースして返す。
   *
   * @param endpoint REST API のパス（例: `repos/owner/repo/pulls/12/reviews`）
   * @param paginate true なら `--paginate` を付けて全ページを取得する
   * @returns パースした要素の配列。出力が空なら空配列
   * @throws {Error} `gh api` が非 0 で終了した場合（メッセージに endpoint と stderr を含む）
   * @throws {SyntaxError} 出力が JSON としてパースできない場合
   * @param host GitHub のホスト名（例: ghe.example.com）。省略時は github.com
   */
  private async api(endpoint: string, paginate = false, host?: string): Promise<any[]> {
    // --slurp: ページごとの配列を 1 つの JSON 配列にまとめて返す（自前で "][" を分割すると本文中の記号で壊れる）
    const r = await runCommandAsync("gh", ["api", ...(host ? ["--hostname", host] : []), ...(paginate ? ["--paginate", "--slurp"] : []), endpoint], { timeout: 300_000 });
    if (!r.ok) throw new Error(`gh api ${endpoint}: ${r.out}`);
    if (!r.out) return [];
    const parsed = JSON.parse(r.out);
    return paginate ? (parsed as any[][]).flat() : parsed;
  }

  /**
   * closed な PR を更新日時の降順で取得し、レビュー・コメントを集めて PR ごとに `<rawDir>/<owner>__<repo>/<number>.json` へ書き出す。
   * コメントが 1 件も無い PR はスキップする。
   *
   * @param source マイニング対象。`repo` は `owner/repo` 形式、`prs` は取得する PR 数の上限、
   *   `include` は取り込むコメント種別（`reviews` | `review_comments` | `issue_comments`）の配列
   * @param rawDir 生データ出力先の vault ルートからの相対パス（例: `.teller/raw`）
   * @param log 進捗メッセージを受け取るコールバック
   * @returns 書き出した PR ファイルの数
   * @throws {Error} `gh api` の呼び出しが失敗した場合（未認証、repo へのアクセス権なし、ネットワークエラーなど）
   * @param progress PR ごとの進捗通知（done/total と "PR #n"）。省略可
   */
  async fetch(source: MiningSource, rawDir: string, log: Logger, progress?: ProgressReporter): Promise<number> {
    const [owner, repo] = source.repo.split("/");
    const outDir = path.join(this.root, rawDir, `${source.host ? source.host + "__" : ""}${owner}__${repo}`);
    fs.mkdirSync(outDir, { recursive: true });
    const prs = await this.api(`repos/${owner}/${repo}/pulls?state=closed&sort=updated&direction=desc&per_page=${source.prs}`, false, source.host);
    log(`[${source.repo}](https://${source.host ?? "github.com"}/${source.repo}/pulls?q=is%3Apr+is%3Aclosed): ${prs.length} PRs`);
    let i = 0;
    progress?.(0, prs.length);
    const include = new Set(source.include);
    let written = 0;
    for (const pr of prs) {
      log(`${source.repo}: (${++i}/${prs.length}) [PR #${pr.number} ${String(pr.title).slice(0, 70)}](${pr.html_url})`);
      progress?.(i - 1, prs.length, `PR #${pr.number}`);
      const comments = await this.collect(owner, repo, pr.number, include, source.host);
      if (comments.length === 0) continue;
      const raw: RawPullRequest = {
        repo: source.repo, number: pr.number, title: pr.title, body: pr.body ?? "", url: pr.html_url,
        author: pr.user?.login, merged_at: pr.merged_at, comments,
      };
      fs.writeFileSync(path.join(outDir, `${pr.number}.json`), JSON.stringify(raw, null, 2));
      written++;
    }
    progress?.(prs.length, prs.length);
    log(`${source.repo}: wrote ${written} PR files → ${path.relative(this.root, outDir)}`);
    return written;
  }

  /**
   * 1 つの PR について、`include` で指定された種別のコメントを集める。
   * 本文の無い review と Bot による issue_comment は除外する。
   *
   * @param owner リポジトリのオーナー名（例: `microsoft`）
   * @param repo リポジトリ名（例: `apm`）
   * @param n PR 番号
   * @param include 取り込む種別の集合（`reviews` | `review_comments` | `issue_comments`）
   * @returns 正規化したコメントの配列
   * @throws {Error} `gh api` の呼び出しが失敗した場合
   * @param host GitHub のホスト名（例: ghe.example.com）。省略時は github.com
   */
  private async collect(owner: string, repo: string, n: number, include: Set<string>, host?: string): Promise<RawComment[]> {
    const out: RawComment[] = [];
    if (include.has("reviews")) {
      for (const r of await this.api(`repos/${owner}/${repo}/pulls/${n}/reviews`, true, host)) {
        if (r.body) out.push({ type: "review", author: r.user?.login, body: r.body, url: r.html_url, state: r.state, created_at: r.submitted_at });
      }
    }
    if (include.has("review_comments")) {
      for (const c of await this.api(`repos/${owner}/${repo}/pulls/${n}/comments`, true, host)) {
        out.push({ type: "review_comment", author: c.user?.login, body: c.body, url: c.html_url, path: c.path, diff_hunk: c.diff_hunk, created_at: c.created_at });
      }
    }
    if (include.has("issue_comments")) {
      for (const c of await this.api(`repos/${owner}/${repo}/issues/${n}/comments`, true, host)) {
        if (c.user?.type !== "Bot") out.push({ type: "issue_comment", author: c.user?.login, body: c.body, url: c.html_url, created_at: c.created_at });
      }
    }
    return out;
  }
}

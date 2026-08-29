import type { ReadinessCheck } from "../../api/types";
import { useI18n } from "../../i18n";
import { Button, Card, ErrorBox } from "../../ui/primitives";

type T = (path: string, vars?: Record<string, string | number>) => string;
const GROUPS: { key: string; match: (c: ReadinessCheck) => boolean }[] = [
  { key: "groupTools", match: (c) => ["apm", "claude", "codex", "gh", "self"].includes(c.id) },
  { key: "groupGithub", match: (c) => c.id === "gh-auth" || c.id.startsWith("repo:") },
  { key: "groupRepo", match: (c) => ["prompt", "agent-settings", "codex-hooks", "sources"].includes(c.id) },
];

/**
 * チェック項目の表示名（辞書に無ければサーバーのラベル）。
 */
export function checkLabel(t: T, c: ReadinessCheck): string {
  if (c.id.startsWith("repo:")) return t("mining.check.repo", { repo: c.id.slice(5) });
  const s = t(`mining.check.${c.id}`);
  return s === `mining.check.${c.id}` ? c.label : s;
}

function fixLabel(t: T, c: ReadinessCheck): string | undefined {
  const key = c.id.startsWith("repo:") ? "repo" : c.id;
  const s = t(`mining.fixes.${key}`);
  return s === `mining.fixes.${key}` ? c.fix : s;
}

/**
 * 前提チェック: 要約バナー + グループ別の一覧。✓ 緑 / ✗ 赤 / △ 黄。
 */
export function DoctorPanel({ checks, loading, error, reload }: { checks: ReadinessCheck[]; loading: boolean; error?: string; reload: () => void }) {
  const { t } = useI18n();
  const blocking = checks.filter((c) => c.required && !c.ok);
  return (
    <Card>
      {loading && (
        <div className="banner banner-info"><span className="spinner" /> {t("mining.checkingDetail")}</div>
      )}
      {!loading && checks.length > 0 && (
        <div className={`banner ${blocking.length ? "banner-bad" : "banner-ok"}`}>
          {blocking.length === 0 ? t("mining.ready") : t("mining.notReady", { n: blocking.length, items: blocking.map((c) => checkLabel(t, c)).join(", ") })}
          <Button tone="ghost" onClick={reload}>{loading ? t("mining.checking") : t("mining.recheck")}</Button>
        </div>
      )}
      <ErrorBox error={error} />
      {loading && checks.length === 0 && (
        <div className="check-group">
          {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="check small"><span className="muted">…</span><div className="skeleton" /></div>)}
        </div>
      )}
      {GROUPS.map((g) => {
        const items = checks.filter(g.match);
        if (!items.length) return null;
        return (
          <div key={g.key} className="check-group">
            <h4>{t(`mining.${g.key}`)}</h4>
            {items.map((c) => (
              <div key={c.id} className="check small">
                <span className={loading ? "muted" : c.ok ? "ok" : c.required ? "bad" : "warn"}>{loading ? "…" : c.ok ? "✓" : c.required ? "✗" : "△"}</span>
                <div>
                  <div>{checkLabel(t, c)} {c.detail && <span className="muted">— {c.detail}</span>}{!c.required && !c.ok && <span className="muted">{t("common.optional")}</span>}</div>
                  {!c.ok && fixLabel(t, c) && <div className="fix">{t("mining.fix")}: {fixLabel(t, c)}</div>}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </Card>
  );
}

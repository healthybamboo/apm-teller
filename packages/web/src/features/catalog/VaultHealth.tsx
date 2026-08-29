import { useState } from "react";
import type { Overview } from "../../api/types";
import { api } from "../../api/client";
import { useI18n } from "../../i18n";
import { Badge, Button } from "../../ui/primitives";

/**
 * apm.yml / 生成マニフェストの状態と apm コマンドの実行。
 */
export function VaultHealth({ overview, reload }: { overview: Overview; reload: () => void }) {
  const { t } = useI18n();
  const { vault } = overview;
  const [out, setOut] = useState<string>();
  const run = async (cmd: "pack" | "check" | "outdated") => { setOut(t("common.running")); const r = await api.apm(cmd); setOut(r.out || (r.ok ? t("common.done") : t("common.failed"))); reload(); };
  return (
    <div className="card">
      <div className="row">
        <b>{vault.name ?? "(vault)"}</b> <span className="muted small">v{vault.version ?? "?"}</span>
        <Badge tone={vault.manifests.claude ? "ok" : "warn"}>{t(vault.manifests.claude ? "catalog.manifestClaude" : "catalog.manifestClaudeMissing")}</Badge>
        <Badge tone={vault.manifests.codex ? "ok" : "neutral"}>{t(vault.manifests.codex ? "catalog.manifestCodex" : "catalog.manifestCodexMissing")}</Badge>
        <span style={{ marginLeft: "auto" }} className="row">
          <Button title={t("catalog.checkHint")} onClick={() => run("check")}>{t("catalog.check")}</Button>
          <Button title={t("catalog.outdatedHint")} onClick={() => run("outdated")}>{t("catalog.outdated")}</Button>
          <Button tone="primary" title={t("catalog.packHint")} onClick={() => run("pack")}>{t("catalog.pack")}</Button>
        </span>
      </div>
      {vault.warnings.map((w) => <div key={w} className="small" style={{ color: "var(--warn)" }}>⚠ {w}</div>)}
      {out && <pre>{out}</pre>}
    </div>
  );
}

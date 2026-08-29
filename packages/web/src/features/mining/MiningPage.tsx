import type { Overview } from "../../api/types";
import { api } from "../../api/client";
import { useAsync } from "../../ui/useAsync";
import { useI18n } from "../../i18n";
import { Step } from "../../ui/primitives";
import { DoctorPanel, checkLabel } from "./DoctorPanel";
import { SourcesPanel } from "./SourcesPanel";
import { RunPanel } from "./RunPanel";

/**
 * 抽出: 1) 前提チェック → 2) 対象 repo → 3) 実行、の順に並べる。
 */
export function MiningPage({ overview, reloadOverview }: { overview: Overview; reloadOverview: () => void }) {
  const { t } = useI18n();
  const doctor = useAsync(api.doctor, [overview.mining.sources.length]);
  const checks = doctor.data ?? [];
  const blocking = checks.filter((c) => c.required && !c.ok);
  const toolsBlocked = blocking.some((c) => c.id !== "sources");
  const sources = overview.mining.sources;
  const ready = checks.length > 0 && blocking.length === 0;
  return (
    <>
      <div className="page-head"><h1>{t("tabs.mining")}</h1></div>
      <p className="lede">{t("mining.intro", { dir: overview.layout.conventions })}</p>
      <Step n={1} title={t("mining.step1")} status={doctor.loading ? undefined : toolsBlocked ? "blocked" : "done"} />
      <DoctorPanel checks={checks} loading={doctor.loading} error={doctor.error} reload={doctor.reload} />
      <Step n={2} title={t("mining.step2")} status={sources.length ? "done" : "todo"} />
      <SourcesPanel sources={sources} reload={() => { reloadOverview(); doctor.reload(); }} />
      <Step n={3} title={t("mining.step3")} status={ready ? undefined : "blocked"} />
      <RunPanel sources={sources.map((s) => s.repo)} ready={ready} blockers={blocking.map((c) => checkLabel(t, c))} defaultAgent={overview.mining.agent.kind} />
    </>
  );
}

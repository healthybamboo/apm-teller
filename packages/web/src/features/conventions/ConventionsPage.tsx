import { useEffect, useState } from "react";
import type { Overview, ConventionStatus } from "../../api/types";
import { api } from "../../api/client";
import { useAsync } from "../../ui/useAsync";
import { useI18n } from "../../i18n";
import { Badge, Empty, ErrorBox } from "../../ui/primitives";
import { ConventionDetail } from "./ConventionDetail";

const STATUSES: ConventionStatus[] = ["proposed", "accepted", "rejected", "promoted"];

export const TONE: Record<ConventionStatus, "info" | "ok" | "bad" | "neutral"> = { proposed: "info", accepted: "ok", rejected: "bad", promoted: "neutral" };

/**
 * 暗黙のチーム規約（convention）の審査画面: 一覧（状態フィルタ）+ 詳細。
 */
export function ConventionsPage({ overview, reloadOverview }: { overview: Overview; reloadOverview: () => void }) {
  const { t } = useI18n();
  const list = useAsync(api.conventions);
  const [filter, setFilter] = useState<ConventionStatus | "all">("proposed");
  const [current, setCurrent] = useState<string>();
  // 初期フィルタ（未審査）が空なら、件数のある最初の状態を選ぶ
  const [autoPicked, setAutoPicked] = useState(false);
  useEffect(() => {
    if (autoPicked || !list.data) return;
    setAutoPicked(true);
    if (!list.data.conventions.some((c) => c.meta.status === "proposed")) {
      const first = STATUSES.find((s) => list.data!.conventions.some((c) => c.meta.status === s));
      if (first) setFilter(first);
    }
  }, [list.data, autoPicked]);
  const items = (list.data?.conventions ?? []).filter((i) => filter === "all" || i.meta.status === filter);
  const count = (s: ConventionStatus) => list.data?.conventions.filter((i) => i.meta.status === s).length ?? 0;
  const selected = list.data?.conventions.find((i) => i.meta.id === current);
  return (
    <>
      <div className="page-head"><h1>{t("tabs.conventions")}</h1></div>
      <p className="lede">{t("conventions.intro")}</p>
      <div className="seg">
        {STATUSES.map((s) => <button key={s} className={filter === s ? "active" : ""} onClick={() => setFilter(s)}>{t(`status.${s}`)}<span className="n">{count(s)}</span></button>)}
        <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>{t("common.all")}</button>
      </div>
      <ErrorBox error={list.error} />
      {list.data?.invalid.map((inv) => <pre key={inv.file} className="error">{inv.file}\n{inv.errors.join("\n")}</pre>)}
      <div className="split">
        <div className="card list">
          {items.length === 0 && <Empty>{t("conventions.empty")}</Empty>}
          {items.map((i) => (
            <div key={i.meta.id} className={`list-item ${current === i.meta.id ? "active" : ""}`} onClick={() => setCurrent(i.meta.id)}>
              <div><b>{i.meta.title}</b></div>
              <div className="row small muted"><Badge tone={TONE[i.meta.status]}>{t(`status.${i.meta.status}`)}</Badge><Badge>{i.meta.kind}</Badge><span>{t("conventions.confidence")} {Math.round(i.meta.confidence * 100)}%</span><span>{t("conventions.sources")} {i.meta.sources.length}</span></div>
            </div>
          ))}
        </div>
        <div>
          {selected ? <ConventionDetail convention={selected} packages={overview.vault.packages.filter((p) => p.local).map((p) => p.name)} onChange={() => { list.reload(); reloadOverview(); }} /> : <Empty>{t("conventions.pick")}</Empty>}
        </div>
      </div>
    </>
  );
}

import { useMemo, useState } from "react";
import type { Overview } from "../../api/types";
import { useI18n } from "../../i18n";
import { PackageCard } from "./PackageCard";
import { InstallPanel } from "./InstallPanel";
import { PresetBar } from "./PresetBar";
import { VaultHealth } from "./VaultHealth";
import { Empty } from "../../ui/primitives";

/**
 * カタログ: 利用者はパッケージ/プリセットを選んでインストール手順を得る。作者は見せ方を編集する。
 */
export function CatalogPage({ overview, reload }: { overview: Overview; reload: () => void }) {
  const { t } = useI18n();
  const { vault, catalog } = overview;
  const [selected, setSelected] = useState<string[]>([]);
  const [edit, setEdit] = useState(false);
  const toggle = (n: string) => setSelected((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n]));
  const ordered = useMemo(() => {
    const featured = new Set(catalog.featured);
    return [...vault.packages]
      .filter((p) => edit || !catalog.packages[p.name]?.hidden)
      .sort((a, b) => Number(featured.has(b.name)) - Number(featured.has(a.name)) || a.name.localeCompare(b.name));
  }, [vault, catalog, edit]);
  return (
    <>
      <div className="page-head"><h1>{t("tabs.catalog")}</h1></div>
      <p className="lede">{t("catalog.intro")}</p>
      <VaultHealth overview={overview} reload={reload} />
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2>{t("catalog.packages")} <span className="muted small">({vault.packages.length})</span></h2>
        <label className="small muted"><input type="checkbox" checked={edit} onChange={(e) => setEdit(e.target.checked)} /> {t("catalog.authorMode")}</label>
      </div>
      <PresetBar overview={overview} selected={selected} onSelect={setSelected} edit={edit} reload={reload} />
      {ordered.length === 0 && <Empty>{t("catalog.empty")}</Empty>}
      <div className="grid">
        {ordered.map((p) => (
          <PackageCard key={p.name} pkg={p} entry={catalog.packages[p.name]} featured={catalog.featured.includes(p.name)}
            selected={selected.includes(p.name)} onToggle={() => toggle(p.name)} edit={edit} reload={reload} />
        ))}
      </div>
      <InstallPanel selected={selected} onClear={() => setSelected([])} />
    </>
  );
}

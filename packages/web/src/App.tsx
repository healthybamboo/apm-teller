import { useState } from "react";
import { api } from "./api/client";
import { useAsync } from "./ui/useAsync";
import { ErrorBox } from "./ui/primitives";
import { useI18n, type Lang } from "./i18n";
import { CatalogPage } from "./features/catalog/CatalogPage";
import { ConventionsPage } from "./features/conventions/ConventionsPage";
import { MiningPage } from "./features/mining/MiningPage";

const TABS = ["catalog", "mining", "conventions"] as const;
type Tab = (typeof TABS)[number];
const DOT = { proposed: "var(--signal)", accepted: "var(--moss)", rejected: "var(--stamp)", promoted: "var(--ink-3)" } as const;

/**
 * ルート: 台帳風サイドバー（ナビ + 規約の勘定）と作業領域。
 */
export function App() {
  const { t, lang, setLang } = useI18n();
  const [tab, setTabState] = useState<Tab>(() => (TABS as readonly string[]).includes(location.hash.slice(1)) ? (location.hash.slice(1) as Tab) : "catalog");
  const setTab = (t: Tab) => { setTabState(t); history.replaceState(null, "", `#${t}`); };
  const ov = useAsync(api.overview);
  const conv = useAsync(api.conventions);
  const count = (s: keyof typeof DOT) => conv.data?.conventions.filter((c) => c.meta.status === s).length ?? 0;
  const reloadAll = () => { ov.reload(); conv.reload(); };
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">apm-teller <small>v0.1</small></div>
        <nav className="nav">
          {TABS.map((id, i) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)} title={t(`tabs.${id}Hint`)}><span className="k">{i + 1}</span>{t(`tabs.${id}`)}</button>)}
        </nav>
        <div className="ledger">
          {(Object.keys(DOT) as (keyof typeof DOT)[]).map((s) => (
            <div key={s} className="row-l"><span><span className="dot" style={{ background: DOT[s] }} />{t(`status.${s}`)}</span><b>{count(s)}</b></div>
          ))}
        </div>
        <div className="foot">
          {ov.data ? <>{ov.data.slug ?? ov.data.vault.name}<br />{ov.data.vault.root.replace(/^\/Users\/[^/]+/, "~")}</> : t("app.loading")}
          <br />
          <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} title={t("app.lang")}><option value="ja">日本語</option><option value="en">English</option></select>
        </div>
      </aside>
      <main>
        <ErrorBox error={ov.error} />
        {ov.data && tab === "catalog" && <CatalogPage overview={ov.data} reload={reloadAll} />}
        {ov.data && tab === "conventions" && <ConventionsPage overview={ov.data} reloadOverview={reloadAll} />}
        {ov.data && tab === "mining" && <MiningPage overview={ov.data} reloadOverview={reloadAll} />}
      </main>
    </div>
  );
}

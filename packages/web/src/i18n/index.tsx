import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { ja, type Dict } from "./ja";
import { en } from "./en";

export type Lang = "ja" | "en";
const DICTS: Record<Lang, Dict> = { ja, en };
const KEY = "apm-teller.lang";

/**
 * ブラウザ言語 → localStorage の順で初期言語を決める。
 */
function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "ja" || saved === "en") return saved;
  } catch { /* storage unavailable */ }
  return navigator.language.startsWith("ja") ? "ja" : "en";
}

/**
 * `{n}` のようなプレースホルダを埋める。
 */
function fill(s: string, vars?: Record<string, string | number>) {
  return vars ? Object.entries(vars).reduce((a, [k, v]) => a.replaceAll(`{${k}}`, String(v)), s) : s;
}

interface I18n { lang: Lang; setLang: (l: Lang) => void; dict: Dict; t: (path: string, vars?: Record<string, string | number>) => string; err: (e: unknown) => string }
const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const value = useMemo<I18n>(() => {
    const dict = DICTS[lang];
    const t = (path: string, vars?: Record<string, string | number>) => {
      const v = path.split(".").reduce<any>((o, k) => o?.[k], dict);
      return typeof v === "string" ? fill(v, vars) : path;
    };
    const setLang = (l: Lang) => { setLangState(l); try { localStorage.setItem(KEY, l); } catch { /* ignore */ } };
    /**
     * API エラーを画面の言語に翻訳する。翻訳キーが無ければサーバーのメッセージ + issues。
     */
    const err = (e: unknown) => {
      const a = e as { message?: string; key?: string; params?: Record<string, string | number>; issues?: string[] };
      // 状態名（proposed 等）は辞書にあれば翻訳して埋める
      const params = Object.fromEntries(Object.entries(a.params ?? {}).map(([k, v]) => [k, ["status", "from", "to"].includes(k) && t(`status.${v}`) !== `status.${v}` ? t(`status.${v}`) : v]));
      const head = a.key && t(`errors.${a.key}`) !== `errors.${a.key}` ? t(`errors.${a.key}`, params) : (a.message ?? String(e));
      return [head, ...(a.issues ?? [])].join("\n");
    };
    return { lang, setLang, dict, t, err };
  }, [lang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/**
 * 文言辞書と `t()` を返す。
 */
export function useI18n(): I18n {
  const c = useContext(Ctx);
  if (!c) throw new Error("I18nProvider missing");
  return c;
}

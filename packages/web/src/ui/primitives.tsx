import type { ReactNode } from "react";
import { useI18n } from "../i18n";

/**
 * 最小限の UI 部品。デザインシステムは持たず、CSS クラスに寄せる。
 */
export const Badge = ({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "ok" | "warn" | "bad" | "info" }) => (
  <span className={`badge badge-${tone}`}>{children}</span>
);

export const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => <div className={`card ${className}`}>{children}</div>;

export const Button = ({ children, onClick, tone = "default", disabled, title }: { children: ReactNode; onClick?: () => void; tone?: "default" | "primary" | "danger" | "ghost"; disabled?: boolean; title?: string }) => (
  <button className={`btn btn-${tone}`} onClick={onClick} disabled={disabled} title={title}>{children}</button>
);

export const Copy = ({ text }: { text: string }) => {
  const { t } = useI18n();
  return <Button tone="ghost" onClick={() => navigator.clipboard.writeText(text)}>{t("common.copy")}</Button>;
};

export const Empty = ({ children }: { children: ReactNode }) => <p className="empty">{children}</p>;

export const ErrorBox = ({ error }: { error?: string }) => (error ? <pre className="error">{error}</pre> : null);

/**
 * 押して切り替えるチップ（チェックボックスの代わり）。ラベル全体がクリック領域。
 */
export const Chip = ({ on, onToggle, children, disabled }: { on: boolean; onToggle: () => void; children: ReactNode; disabled?: boolean }) => (
  <button type="button" role="checkbox" aria-checked={on} className={`chip ${on ? "on" : ""}`} onClick={onToggle} disabled={disabled}>
    <span className="chip-tick" aria-hidden="true">{on ? "✓" : ""}</span>{children}
  </button>
);

/**
 * 手順番号つきの見出し。
 */
export const Step = ({ n, title, status }: { n: number; title: string; status?: "done" | "todo" | "blocked" }) => (
  <h2 className="step"><span className={`step-n ${status ?? ""}`}>{status === "done" ? "✓" : n}</span>{title}</h2>
);

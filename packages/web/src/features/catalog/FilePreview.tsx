import { api } from "../../api/client";
import { useAsync } from "../../ui/useAsync";
import { useI18n } from "../../i18n";
import { Button } from "../../ui/primitives";

/**
 * vault 内ファイルの生テキストプレビュー。
 */
export function FilePreview({ path, onClose }: { path: string; onClose: () => void }) {
  const { t } = useI18n();
  const f = useAsync(() => api.file(path), [path]);
  return (
    <div style={{ marginTop: 8 }}>
      <div className="row small"><code>{path}</code><Button tone="ghost" onClick={onClose}>{t("common.close")}</Button></div>
      <pre>{f.data ?? "…"}</pre>
    </div>
  );
}

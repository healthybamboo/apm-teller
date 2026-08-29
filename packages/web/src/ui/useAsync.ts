import { useCallback, useEffect, useState } from "react";

/**
 * 読み込み → 再読み込みの単純な非同期フック。
 *
 * @param fn
 * @param deps
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const reload = useCallback(() => {
    setLoading(true);
    fn().then((d) => { setData(d); setError(undefined); }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, deps);
  useEffect(reload, [reload]);
  return { data, error, loading, reload, setData };
}

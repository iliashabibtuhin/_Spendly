import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

/**
 * Fetches `path` (with `query`) and re-fetches when either changes.
 * Returns { data, error, loading, reload }. Keeps showing previous data while
 * a refetch is in flight so filters don't flash an empty screen.
 */
export function useApi(path, query) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [nonce, setNonce] = useState(0);
  const key = JSON.stringify(query ?? {});

  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    // eslint-disable-next-line react/set-state-in-effect -- marks the in-flight request
    setState((s) => ({ ...s, loading: true, error: null }));
    api
      .get(path, { query: JSON.parse(key), signal: controller.signal })
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => {
        if (error.name === "AbortError") return;
        setState((s) => ({ ...s, error, loading: false }));
      });
    return () => controller.abort();
  }, [path, key, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, reload };
}

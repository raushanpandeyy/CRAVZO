import { useCallback, useRef } from "react";

const prefetchCache = new Map();

export default function usePrefetch(fetchFn) {
  const timerRef = useRef(null);

  const prefetch = useCallback(() => {
    if (timerRef.current) return;

    timerRef.current = setTimeout(async () => {
      const key = fetchFn.toString();
      if (prefetchCache.has(key)) {
        const cached = prefetchCache.get(key);
        if (Date.now() - cached.ts < 30000) return;
      }
      try {
        const promise = fetchFn();
        prefetchCache.set(key, { promise, ts: Date.now() });
        await promise;
      } catch {
        // prefetch errors are silent
      }
      timerRef.current = null;
    }, 200);
  }, [fetchFn]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return { prefetch, cancel };
}

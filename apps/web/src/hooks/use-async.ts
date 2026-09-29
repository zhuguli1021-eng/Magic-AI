"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** 简单的数据加载 hook：deps 变化时重新加载，返回 data / loading / error / reload */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const fnRef = useRef(fn);
  const key = JSON.stringify(deps);

  useEffect(() => {
    fnRef.current = fn;
  });

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    return fnRef
      .current()
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e : new Error(String(e))))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let active = true;
    fnRef
      .current()
      .then((d) => active && setData(d))
      .catch((e: unknown) => active && setError(e instanceof Error ? e : new Error(String(e))))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [key]);

  return { data, loading, error, reload };
}

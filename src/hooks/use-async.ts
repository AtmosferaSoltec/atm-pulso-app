import { useCallback, useEffect, useRef, useState } from "react";

import type { ApiError } from "@/types";

export interface AsyncState<T> {
  data: T | undefined;
  loading: boolean;
  error: ApiError | undefined;
  refetch: () => void;
}

interface Result<T> {
  key: string;
  data?: T;
  error?: ApiError;
}

/**
 * Minimal query hook. Swap for TanStack Query later without touching screens (same return shape).
 * `deps` must be primitives. While a new key loads, the previous `data` is kept (stale-while-revalidate).
 */
export function useAsync<T>(
  fn: () => Promise<T>,
  deps: unknown[],
): AsyncState<T> {
  const [tick, setTick] = useState(0);
  const [result, setResult] = useState<Result<T>>({ key: "" });
  const key = JSON.stringify([...deps, tick]);
  const fnRef = useRef(fn);

  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => {
    let cancelled = false;
    fnRef.current().then(
      (data) => !cancelled && setResult({ key, data }),
      (error: ApiError) =>
        !cancelled && setResult((prev) => ({ key, data: prev.data, error })),
    );
    return () => {
      cancelled = true;
    };
  }, [key]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);
  const current = result.key === key;
  return {
    data: current ? result.data : undefined,
    loading: !current,
    error: current ? result.error : undefined,
    refetch,
  };
}

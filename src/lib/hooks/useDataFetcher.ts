"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "./useToast";

interface UseDataFetcherOptions<T> {
  deps?: unknown[];
  errorMessage?: string;
  initialData?: T | null;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export interface UseDataFetcherReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

/**
 * Standardized data fetching hook with:
 * - Automatic loading/error/toast handling
 * - AbortController cleanup (prevents stale state updates)
 * - Dependency-based re-fetching
 * - Exposed refetch for Supabase Realtime integration
 *
 * Callers must memoize object/array deps with useMemo.
 */
export function useDataFetcher<T>(
  fetchFn: (signal: AbortSignal) => Promise<T>,
  options: UseDataFetcherOptions<T> = {}
): UseDataFetcherReturn<T> {
  const {
    deps = [],
    errorMessage = "Failed to load data",
    initialData = null,
    enabled = true,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [isLoading, setIsLoading] = useState(enabled && initialData === null);
  const [error, setError] = useState<Error | null>(null);

  const { showToast } = useToast();

  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const abortControllerRef = useRef<AbortController | null>(null);

  const refetch = useCallback(async () => {
    if (!enabled) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFn(abortController.signal);
      if (!abortController.signal.aborted) {
        setData(result);
        setError(null);
        onSuccessRef.current?.(result);
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (!abortController.signal.aborted) {
        const normalizedError =
          err instanceof Error ? err : new Error(String(err));
        setError(normalizedError);
        showToast({
          title: `${errorMessage}: ${normalizedError.message || "An unexpected error occurred."}`,
          type: "error",
        });
        onErrorRef.current?.(normalizedError);
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, errorMessage, showToast, ...deps]);

  useEffect(() => {
    if (enabled) {
      refetch();
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetch]);

  return { data, isLoading, error, refetch, setData };
}

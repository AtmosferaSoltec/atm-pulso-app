import { useCallback, useEffect, useRef, useState } from "react";

import { services } from "@/services";
import { useSession } from "@/state/session";
import type {
  ApiError,
  MemberCounts,
  MemberListQuery,
  MemberView,
} from "@/types";
import { useAsync } from "./use-async";

const PAGE_SIZE = 25;

export interface MemberPages {
  items: MemberView[];
  counts: MemberCounts | undefined;
  total: number;
  /** First page of a new query is loading. */
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: ApiError | undefined;
  loadMore: () => void;
  refetch: () => void;
}

/** Paginated member list (page size 25). Debounces the search text; keeps counts while reloading. */
export function useMembers(query: MemberListQuery): MemberPages {
  const { user, lab, dataVersion } = useSession();
  const gym = user?.gym.id ?? "";
  const status = query.status ?? "all";
  const rawSearch = query.search?.trim() ?? "";
  const [search, setSearch] = useState(rawSearch);
  useEffect(() => {
    const t = setTimeout(() => setSearch(rawSearch), 300);
    return () => clearTimeout(t);
  }, [rawSearch]);

  const [tick, setTick] = useState(0);
  const key = JSON.stringify([gym, status, search, tick, dataVersion, lab?.previewState]);
  const [state, setState] = useState<{
    key: string;
    items: MemberView[];
    page: number;
    total: number;
    counts?: MemberCounts;
    error?: ApiError;
    loadingMore: boolean;
  }>({ key: "", items: [], page: 0, total: 0, loadingMore: false });
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  useEffect(() => {
    let cancelled = false;
    services.members
      .list({ status, search, page: 1, page_size: PAGE_SIZE })
      .then(
        (r) =>
          !cancelled &&
          setState({
            key,
            items: r.data,
            page: 1,
            total: r.meta.total,
            counts: r.counts,
            loadingMore: false,
          }),
        (error: ApiError) =>
          !cancelled &&
          setState((prev) => ({
            ...prev,
            key,
            items: [],
            error,
            loadingMore: false,
          })),
      );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const loadMore = useCallback(() => {
    const s = stateRef.current;
    if (s.key !== key || s.loadingMore || s.error || s.items.length >= s.total)
      return;
    setState({ ...s, loadingMore: true });
    services.members
      .list({ status, search, page: s.page + 1, page_size: PAGE_SIZE })
      .then(
        (r) =>
          setState((prev) =>
            prev.key === key
              ? {
                  ...prev,
                  items: [...prev.items, ...r.data],
                  page: s.page + 1,
                  total: r.meta.total,
                  counts: r.counts,
                  loadingMore: false,
                }
              : prev,
          ),
        (error: ApiError) =>
          setState((prev) =>
            prev.key === key ? { ...prev, error, loadingMore: false } : prev,
          ),
      );
  }, [key, status, search]);

  const current = state.key === key;
  return {
    items: current ? state.items : [],
    counts: state.counts,
    total: current ? state.total : 0,
    loading: !current,
    loadingMore: current && state.loadingMore,
    hasMore: current && state.items.length < state.total,
    error: current ? state.error : undefined,
    loadMore,
    refetch: useCallback(() => setTick((t) => t + 1), []),
  };
}

export function useMember(id: string) {
  const { user, dataVersion } = useSession();
  const gym = user?.gym.id ?? "";
  return useAsync(() => services.members.get(id), [gym, id, dataVersion]);
}

/** Active products of the gym (module `sales`). Only call from screens that exist when the module is on. */
export function useProducts() {
  const { user } = useSession();
  const gym = user?.gym.id ?? "";
  return useAsync(() => services.sales.products(), [gym]);
}

/** What a member owes (module `sales`). Reloads after any sale or collection. */
export function usePendingSales(memberId: string) {
  const { user, dataVersion } = useSession();
  const gym = user?.gym.id ?? "";
  return useAsync(
    () => services.sales.pending(memberId),
    [gym, memberId, dataVersion],
  );
}

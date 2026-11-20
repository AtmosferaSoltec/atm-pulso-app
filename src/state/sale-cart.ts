import { useSyncExternalStore } from "react";

import type { PickedMember } from "@/components/MemberPicker";

/**
 * The sale in progress, shared by the catalog (/sale) and the checkout (/sale/checkout).
 * In memory only: closing the app starts a clean sale.
 */
export interface SaleCart {
  /** Product id → quantity (only quantities above zero). */
  items: Record<string, number>;
  member: PickedMember | null;
  /** Confirmation of the last sale, shown once back in the catalog. */
  done?: string;
}

let state: SaleCart = { items: {}, member: null };
const listeners = new Set<() => void>();

function set(next: SaleCart) {
  state = next;
  listeners.forEach((l) => l());
}

export function useSaleCart(): SaleCart {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
  );
}

export const saleCart = {
  /** Adds `delta` units (negative removes), kept between 0 and 99. */
  change(productId: string, delta: number) {
    const next = Math.min(99, Math.max(0, (state.items[productId] ?? 0) + delta));
    const { [productId]: _removed, ...rest } = state.items;
    set({
      ...state,
      done: undefined,
      items: next === 0 ? rest : { ...rest, [productId]: next },
    });
  },
  setMember(member: PickedMember | null) {
    set({ ...state, member });
  },
  /** After a successful sale: empty cart, no member, and the confirmation to show. */
  finish(done: string) {
    set({ items: {}, member: null, done });
  },
  clearDone() {
    if (state.done) set({ ...state, done: undefined });
  },
};

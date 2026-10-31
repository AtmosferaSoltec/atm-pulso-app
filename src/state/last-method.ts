import type { PaymentMethod } from "@/types";

/** The payment method used last (sales and collections). In memory only; cash until one is used. */
let last: PaymentMethod = "cash";

export const getLastMethod = () => last;
export const rememberMethod = (method: PaymentMethod) => {
  last = method;
};

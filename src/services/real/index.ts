import type {
  BodyMeasurement,
  Collection,
  MemberList,
  MemberPending,
  Product,
  ProductSale,
  MemberDetail,
  MembershipPlan,
  Sale,
  User,
} from "@/types";

import type { GymOption, Services } from "../types";
import { api } from "./http";
import * as tokens from "./tokens";

const money = (value: string) => Number(value).toFixed(2);

export const realServices: Services = {
  mode: "real",
  capabilities: { updatePeriod: true },
  auth: {
    restore: tokens.hasStoredSession,
    signIn: tokens.signIn,
    changePassword: tokens.changePassword,
    signOut: tokens.signOut,
    onExpired: tokens.onSessionExpired,
  },
  session: {
    async load() {
      const [me, plans] = await Promise.all([
        api<{ data: User }>("/me"),
        api<{ data: MembershipPlan[] }>("/membership-plans"),
      ]);
      const user = me.data;
      let gyms: GymOption[];
      try {
        gyms = (await tokens.listTenants()).map((t) => ({
          id: t.tenant_id,
          name: t.name,
          current: t.current,
        }));
      } catch {
        // Switching is optional: a failure here must not block the app.
        gyms = [];
      }
      if (gyms.length === 0)
        gyms = [{ id: user.gym.id, name: user.gym.name, current: true }];
      return {
        user,
        gyms,
        plans: plans.data
          .filter((p) => p.is_active)
          .sort((a, b) => a.position - b.position),
      };
    },
    switchGym: tokens.switchTenant,
  },
  members: {
    async list(query) {
      const response = await api<{
        data: MemberList["data"];
        meta: MemberList["meta"] & { counts: MemberList["counts"] };
      }>("/members", {
        query: {
          q: query.search?.trim(),
          status:
            query.status && query.status !== "all" ? query.status : undefined,
          page: query.page,
          page_size: query.page_size,
        },
      });
      const { counts, ...meta } = response.meta;
      return { data: response.data, meta, counts };
    },
    async get(id) {
      return (await api<{ data: MemberDetail }>(`/members/${id}`)).data;
    },
    async enroll(input) {
      return (
        await api<{ data: Sale }>("/members", {
          method: "POST",
          body: { ...input, amount: money(input.amount) },
        })
      ).data;
    },
    async renew(memberId, input) {
      return (
        await api<{ data: Sale }>(`/members/${memberId}/renewals`, {
          method: "POST",
          body: { ...input, amount: money(input.amount) },
        })
      ).data;
    },
    async updatePeriod(memberId, periodId, changes) {
      return (
        await api<{ data: Sale }>(
          `/members/${memberId}/memberships/${periodId}`,
          {
            method: "PATCH",
            body: {
              ...changes,
              ...(changes.amount ? { amount: money(changes.amount) } : {}),
            },
          },
        )
      ).data;
    },
  },
  sales: {
    async products() {
      return (await api<{ data: Product[] }>("/products")).data
        .filter((p) => p.is_active)
        .sort((a, b) => a.position - b.position);
    },
    async sell(input) {
      return (
        await api<{ data: ProductSale }>("/sales", {
          method: "POST",
          body: input,
        })
      ).data;
    },
    async pending(memberId) {
      return (
        await api<{ data: MemberPending }>(`/members/${memberId}/pending-sales`)
      ).data;
    },
    async collect(input) {
      return (
        await api<{ data: Collection }>("/sales/collections", {
          method: "POST",
          body: input,
        })
      ).data;
    },
  },
  body: {
    async measurements(memberId) {
      return (
        await api<{ data: BodyMeasurement[] }>(
          `/members/${memberId}/measurements`,
        )
      ).data;
    },
    async record(memberId, input) {
      return (
        await api<{ data: BodyMeasurement }>(
          `/members/${memberId}/measurements`,
          { method: "POST", body: input },
        )
      ).data;
    },
  },
};

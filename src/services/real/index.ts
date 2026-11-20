import type {
  BodyMeasurement,
  Collection,
  MemberList,
  MemberPending,
  Product,
  ProductCategory,
  ProductSale,
  MemberDetail,
  MembershipPlan,
  Sale,
  User,
} from "@/types";

import type { GymOption, Services } from "../types";
import { api, uploadFile } from "./http";
import * as tokens from "./tokens";

const money = (value: string) => Number(value).toFixed(2);

/** RENIEC answers in capitals: «JUAN DE LA CRUZ» → «Juan de la Cruz». */
const PARTICLES = new Set(["de", "del", "la", "las", "los", "y"]);
const titleCase = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase("es-PE")
    .split(/\s+/)
    .map((word, i) =>
      i > 0 && PARTICLES.has(word)
        ? word
        : word.replace(
            /(^|-)(\p{L})/gu,
            (_, sep: string, ch: string) => sep + ch.toLocaleUpperCase("es-PE"),
          ),
    )
    .join(" ");

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
    async lookupDni(dni) {
      try {
        const person = (
          await api<{
            data: {
              first_names?: string;
              paternal_surname?: string;
              maternal_surname?: string;
              full_name?: string;
            };
          }>(`/documents/persons/${dni}`)
        ).data;
        const parts = [
          person.first_names,
          person.paternal_surname,
          person.maternal_surname,
        ].filter(Boolean);
        const name = parts.length ? parts.join(" ") : (person.full_name ?? "");
        return titleCase(name) || null;
      } catch {
        // Not found or lookup down: the person types the name.
        return null;
      }
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
        .map((p) => ({
          ...p,
          category_id: p.category_id ?? null,
          category: p.category ?? null,
        }))
        .sort((a, b) => a.position - b.position);
    },
    async categories() {
      // Filters only: a server without categories yet must not block selling.
      try {
        return (
          await api<{ data: ProductCategory[] }>("/product-categories")
        ).data;
      } catch {
        return [];
      }
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
  vouchers: {
    async upload(owner, file) {
      const path =
        owner.kind === "receipt"
          ? `/receipts/${owner.id}/vouchers`
          : owner.kind === "sale"
            ? `/sales/${owner.id}/vouchers`
            : `/sales/collections/${owner.id}/vouchers`;
      await uploadFile(path, file);
    },
  },
};

import { addMonths, planLabel, todayLima } from "@/lib/format";
import type {
  ApiError,
  BodyMeasurement,
  Collection,
  ProductSale,
  MemberCounts,
  MemberDetail,
  MembershipView,
  Sale,
} from "@/types";
import type { MockLab, Services } from "../types";
import { members as seedMembers, products, session } from "./data";

const delay = <T>(fn: () => T): Promise<T> =>
  new Promise((resolve, reject) =>
    setTimeout(() => {
      try {
        resolve(fn());
      } catch (e) {
        reject(e);
      }
    }, 350),
  );

const fail = (code: string, message: string): never => {
  throw { code, message } satisfies ApiError;
};

const labState = {
  scenario: "single" as MockLab["scenario"],
  previewState: "ready" as MockLab["previewState"],
  gymId: "atlas",
  signedIn: false,
};
const lab: MockLab = {
  get scenario() {
    return labState.scenario;
  },
  get previewState() {
    return labState.previewState;
  },
  set(next) {
    if (next.scenario) {
      labState.scenario = next.scenario;
      labState.gymId = "atlas";
    }
    if (next.previewState) labState.previewState = next.previewState;
  },
};

const stores = new Map<string, MemberDetail[]>();
function store(): MemberDetail[] {
  const key = `${labState.scenario}:${labState.gymId}`;
  let list = stores.get(key);
  if (!list) {
    list = seedMembers(labState.gymId, labState.scenario);
    stores.set(key, list);
  }
  return list;
}

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function statusOf(m: MemberDetail) {
  const today = todayLima();
  const current = m.memberships.filter(
    (s) => s.starts_on <= today && today <= s.ends_on,
  );
  const latestEnd = m.memberships.reduce(
    (a, s) => (s.ends_on > a ? s.ends_on : a),
    "",
  );
  const diff = (to: string) =>
    Math.round(
      (Date.parse(to + "T00:00:00Z") - Date.parse(today + "T00:00:00Z")) /
        864e5,
    );
  if (current.length) {
    const end = current.reduce((a, s) => (s.ends_on > a ? s.ends_on : a), "");
    const days = diff(end);
    return {
      status: (days <= 7 ? "expiring" : "active") as MemberDetail["status"],
      days,
      end,
    };
  }
  const scheduled = m.memberships.some((s) => s.starts_on > today);
  return {
    status: (scheduled ? "scheduled" : "expired") as MemberDetail["status"],
    days: diff(latestEnd),
    end: latestEnd,
  };
}

function sell(
  member: MemberDetail,
  input: {
    id?: string;
    plan_id?: string;
    months: number;
    starts_on?: string;
    amount: string;
  },
): Sale {
  const plans = session(labState.scenario, labState.gymId).plans;
  if (plans.length > 1 && !input.plan_id)
    fail("PLAN_REQUIRED", "Elige el plan de la membresía.");
  const plan = plans.find((p) => p.id === input.plan_id) ?? plans[0];
  const sameEnds = member.memberships
    .filter((s) => s.plan_id === plan.id && s.ends_on > todayLima())
    .map((s) => s.ends_on);
  const starts_on =
    input.starts_on ??
    (sameEnds.length ? sameEnds.sort().at(-1)! : todayLima());
  const number = `R-${String(900 + member.memberships.length).padStart(6, "0")}`;
  const membership: MembershipView = {
    id: input.id ?? `${member.id}-sub-${member.memberships.length}`,
    plan_id: plan.id,
    plan_name: plan.name,
    months: input.months,
    plan_label: planLabel(input.months),
    starts_on,
    ends_on: addMonths(starts_on, input.months),
    amount: input.amount,
    access_scope: "branch",
    access_branches: [],
    receipt: { id: `${member.id}-r-${number}`, number },
  };
  member.memberships.unshift(membership);
  const s = statusOf(member);
  Object.assign(member, {
    status: s.status,
    days_remaining: s.days,
    ends_on: s.end,
    starts_on: membership.starts_on,
    plan_label: membership.plan_label,
    plan_names: [...new Set(member.memberships.map((x) => x.plan_name))],
    last_receipt: number,
  });
  return { member, membership, receipt: membership.receipt! };
}

// Sales and measurements live in memory only (measurements are sensitive: nothing is persisted).
const sales: ProductSale[] = [];
const collections = new Map<string, Collection>();
const measurements = new Map<string, BodyMeasurement[]>();
const sold = new Map<string, ProductSale>();

const requireFeature = (feature: "sales" | "body_tracking") => {
  if (
    !session(labState.scenario, labState.gymId).user.gym.features.includes(
      feature,
    )
  )
    fail("FEATURE_DISABLED", "Esta función no está activada para tu gimnasio.");
};

const money = (n: number) => n.toFixed(2);
const openFor = (memberId: string) =>
  sales
    .filter((s) => s.status === "pending" && s.member?.id === memberId)
    .sort((a, b) => a.sold_at.localeCompare(b.sold_at));

export const mockServices: Services = {
  mode: "mock",
  capabilities: { updatePeriod: true },
  lab,
  auth: {
    restore: async () => labState.signedIn,
    signIn: (dni, password) =>
      delay(() => {
        if (!dni || !password)
          fail("INVALID_CREDENTIALS", "DNI o contraseña incorrectos.");
        labState.signedIn = true;
      }),
    changePassword: () => delay(() => undefined),
    signOut: async () => {
      labState.signedIn = false;
    },
    onExpired: () => () => undefined,
  },
  session: {
    load: () => delay(() => session(labState.scenario, labState.gymId)),
    switchGym: async (id) => {
      labState.gymId = id;
    },
  },
  members: {
    list: (query) =>
      delay(() => {
        if (labState.previewState === "error")
          fail("PREVIEW", "Revisa tu conexión e inténtalo otra vez.");
        const all = labState.previewState === "empty" ? [] : store();
        const q = normalize(query.search?.trim() ?? "");
        const matches = all.filter((m) =>
          normalize(m.full_name + m.document_number).includes(q),
        );
        const count = (s: string) =>
          matches.filter((m) => m.status === s).length;
        const counts: MemberCounts = {
          all: matches.length,
          active: count("active"),
          expiring: count("expiring"),
          expired: count("expired"),
          scheduled: count("scheduled"),
        };
        const filtered = matches.filter(
          (m) =>
            !query.status ||
            query.status === "all" ||
            m.status === query.status,
        );
        const size = query.page_size ?? 25;
        const page = query.page ?? 1;
        return {
          data: filtered.slice((page - 1) * size, page * size),
          meta: { page, page_size: size, total: filtered.length },
          counts,
        };
      }),
    get: (id) =>
      delay(() => {
        const member = store().find((m) => m.id === id);
        if (!member) return fail("NOT_FOUND", "Este registro ya no existe.");
        return member;
      }),
    enroll: (input) =>
      delay(() => {
        if (store().some((m) => m.document_number === input.document_number))
          fail(
            "MEMBER_DOCUMENT_TAKEN",
            "Este documento ya pertenece a un miembro.",
          );
        const user = session(labState.scenario, labState.gymId).user;
        const branch =
          user.branches.find((b) => b.id === input.branch_id) ??
          user.branches[0];
        const member: MemberDetail = {
          id: input.id ?? `new-${Date.now()}`,
          document_type: input.document_type,
          document_number: input.document_number,
          full_name: input.full_name,
          phone: input.phone,
          home_branch: {
            id: branch.id,
            name: branch.name,
            gym_name: branch.gym_name,
          },
          status: "active",
          days_remaining: 0,
          plan_label: "",
          plan_names: [],
          starts_on: todayLima(),
          ends_on: todayLima(),
          last_receipt: null,
          memberships: [],
        };
        store().unshift(member);
        return sell(member, input);
      }),
    renew: (memberId, input) =>
      delay(() => {
        const member = store().find((m) => m.id === memberId);
        if (!member) return fail("NOT_FOUND", "Este registro ya no existe.");
        return sell(member, input);
      }),
    updatePeriod: (memberId, periodId, changes) =>
      delay(() => {
        const member = store().find((m) => m.id === memberId);
        const period = member?.memberships.find((x) => x.id === periodId);
        if (!member || !period)
          return fail("MEMBERSHIP_NOT_FOUND", "Este periodo ya no existe.");
        if (period.ends_on < todayLima())
          fail(
            "MEMBERSHIP_ENDED",
            "Este periodo ya terminó y no se puede modificar.",
          );
        period.months = changes.months ?? period.months;
        period.plan_label = planLabel(period.months);
        period.starts_on = changes.starts_on ?? period.starts_on;
        period.amount = changes.amount ?? period.amount;
        period.ends_on = addMonths(period.starts_on, period.months);
        const s = statusOf(member);
        Object.assign(member, {
          status: s.status,
          days_remaining: s.days,
          ends_on: s.end,
        });
        return { member, membership: period, receipt: period.receipt! };
      }),
  },
  sales: {
    products: () => delay(() => (requireFeature("sales"), products)),
    sell: (input) =>
      delay(() => {
        requireFeature("sales");
        const again = input.id ? sold.get(input.id) : undefined;
        if (again) return again;
        const status = input.status ?? "paid";
        const member = input.member_id
          ? store().find((m) => m.id === input.member_id)
          : undefined;
        if (status === "pending" && !input.member_id)
          fail("VALIDATION_FAILED", "Elige un miembro para dejar la venta pendiente.");
        if (input.member_id && !member)
          fail("VALIDATION_FAILED", "El miembro elegido no es válido.");
        if (status === "paid" && !input.method)
          fail("VALIDATION_FAILED", "Elige un medio de pago.");
        const user = session(labState.scenario, labState.gymId).user;
        const branch = user.branches.find((b) => b.id === input.branch_id);
        if (!branch) fail("BRANCH_NOT_ACCESSIBLE", "No tienes acceso a esta sede.");
        const items = input.items.map((i) => {
          const product = products.find((p) => p.id === i.product_id);
          if (!product || i.quantity < 1 || i.quantity > 99)
            return fail("VALIDATION_FAILED", "Revisa los productos y las cantidades (1 a 99).");
          return {
            product_id: product.id,
            name: product.name,
            quantity: i.quantity,
            unit_price: product.price,
            line_total: money(Number(product.price) * i.quantity),
          };
        });
        const sale: ProductSale = {
          id: input.id ?? `sale-${sales.length}-${Date.now()}`,
          branch: { id: branch!.id, name: branch!.name },
          status,
          was_pending: status === "pending",
          method: status === "paid" ? (input.method ?? null) : null,
          total: money(items.reduce((a, i) => a + Number(i.line_total), 0)),
          units: items.reduce((a, i) => a + i.quantity, 0),
          sold_at: new Date().toISOString(),
          sold_on: todayLima(),
          sold_by: { id: user.id, full_name: user.full_name },
          member: member
            ? {
                id: member.id,
                full_name: member.full_name,
                document_number: member.document_number,
              }
            : null,
          collection_id: null,
          collected_at: null,
          items,
        };
        sales.unshift(sale);
        sold.set(sale.id, sale);
        return sale;
      }),
    pending: (memberId) =>
      delay(() => {
        requireFeature("sales");
        const open = openFor(memberId);
        return {
          member_id: memberId,
          balance: money(open.reduce((a, s) => a + Number(s.total), 0)),
          pending_count: open.length,
          sales: open,
        };
      }),
    collect: (input) =>
      delay(() => {
        requireFeature("sales");
        const again = input.id ? collections.get(input.id) : undefined;
        if (again) return again;
        const open = openFor(input.member_id);
        if (open.length === 0)
          fail("NOTHING_TO_COLLECT", "Este miembro ya no tiene nada pendiente.");
        const chosen = input.sale_ids?.length
          ? input.sale_ids.map(
              (id) =>
                open.find((s) => s.id === id) ??
                fail("SALE_NOT_PENDING", "Alguien ya cobró una de estas ventas. No se cobró nada; revisa lo pendiente."),
            )
          : open;
        const id = input.id ?? `collection-${Date.now()}`;
        for (const s of chosen) {
          s.status = "paid";
          s.method = input.method;
          s.collection_id = id;
          s.collected_at = new Date().toISOString();
        }
        const collection: Collection = {
          id,
          amount: money(chosen.reduce((a, s) => a + Number(s.total), 0)),
          remaining_balance: money(
            openFor(input.member_id).reduce((a, s) => a + Number(s.total), 0),
          ),
          method: input.method,
          sale_ids: chosen.map((s) => s.id),
        };
        collections.set(id, collection);
        return collection;
      }),
  },
  body: {
    measurements: (memberId) =>
      delay(() => {
        requireFeature("body_tracking");
        return measurements.get(memberId) ?? [];
      }),
    record: (memberId, input) =>
      delay(() => {
        requireFeature("body_tracking");
        const list = measurements.get(memberId) ?? [];
        const again = list.find((m) => m.id === input.id);
        if (again) return again;
        if (input.weight_kg === undefined)
          fail("VALIDATION_FAILED", "Escribe el peso.");
        if (input.weight_kg! < 20 || input.weight_kg! > 400)
          fail("VALIDATION_FAILED", "El peso debe estar entre 20 y 400 kg, con un decimal.");
        const record: BodyMeasurement = {
          id: input.id ?? `m-${Date.now()}`,
          member_id: memberId,
          measured_on: input.measured_on ?? todayLima(),
          weight_kg: input.weight_kg ?? null,
          notes: input.notes ?? "",
        };
        measurements.set(
          memberId,
          [record, ...list].sort((a, b) =>
            b.measured_on.localeCompare(a.measured_on),
          ),
        );
        return record;
      }),
  },
};

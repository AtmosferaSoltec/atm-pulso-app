import { addMonths, planLabel, todayLima } from "@/lib/format";
import type {
  Branch,
  MemberDetail,
  MembershipPlan,
  Product,
  User,
} from "@/types";
import type { Scenario, SessionSnapshot } from "../types";
const gyms: User["gym"][] = [
  {
    id: "atlas",
    name: "Atlas Fitness",
    brand_color: "#246b55",
    logo_url: null,
    // Atlas has the optional modules on; Titan has none (use it to check that nothing shows).
    features: ["sales", "body_tracking"],
  },
  {
    id: "titan",
    name: "Titan Studio",
    brand_color: "#7951ad",
    logo_url: null,
    features: [],
  },
];
const branches: Branch[] = [
  {
    id: "atlas-1",
    name: "Miraflores",
    address: null,
    gym_id: "atlas",
    gym_name: "Atlas Fitness",
  },
  {
    id: "atlas-2",
    name: "San Isidro",
    address: null,
    gym_id: "atlas",
    gym_name: "Atlas Fitness",
  },
  {
    id: "titan-1",
    name: "Barranco",
    address: null,
    gym_id: "titan",
    gym_name: "Titan Studio",
  },
  {
    id: "titan-2",
    name: "Surco",
    address: null,
    gym_id: "titan",
    gym_name: "Titan Studio",
  },
];
const plan = (
  id: string,
  name: string,
  position: number,
  base: number,
): MembershipPlan => ({
  id,
  name,
  description: null,
  is_active: true,
  position,
  prices: [1, 3, 6, 12].map((months) => ({
    months,
    amount: (base * months * (months === 1 ? 1 : 0.9)).toFixed(2),
  })),
});
/** Atlas has one plan (no selector); Titan has two (selector shown). */
const plans: Record<string, MembershipPlan[]> = {
  atlas: [plan("atlas-plan", "Membresía", 0, 100)],
  titan: [
    plan("titan-plan-1", "Membresía", 0, 120),
    plan("titan-plan-2", "Baile", 1, 80),
  ],
};
export function session(scenario: Scenario, gymId = "atlas"): SessionSnapshot {
  const gym =
    gyms.find(
      (g) => g.id === gymId && (scenario === "gyms" || g.id === "atlas"),
    ) ?? gyms[0];
  const allowed = branches.filter((b) => b.gym_id === gym.id);
  return {
    user: {
      id: "staff-1",
      document_number: "10000002",
      full_name: scenario === "gyms" ? "Diego Quispe" : "Lucía Fernández",
      phone: "987654321",
      role: scenario === "gyms" ? "receptionist" : "admin",
      gym,
      branches: scenario === "branches" ? allowed : allowed.slice(0, 1),
    },
    gyms: (scenario === "gyms" ? gyms : [gyms[0]]).map((g) => ({
      id: g.id,
      name: g.name,
      current: g.id === gym.id,
    })),
    plans: plans[gym.id],
  };
}
function day(offset: number) {
  const d = new Date(todayLima() + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}
const names = [
  "María Torres Vega",
  "Carlos Huamán Ccori",
  "Andrea Salazar Pinto",
  "José Ramírez Luna",
  "Valeria Cruz Medina",
  "Pedro Castillo Ríos",
  "Sofía Mendoza Paredes",
  "Marco Delgado Soto",
  "Camila Flores Ayala",
  "Renzo Gutiérrez Vera",
];
const remaining = [60, 3, 120, 6, -12, -3, 90, 1, 33, 14];
export function members(gymId: string, scenario: Scenario): MemberDetail[] {
  const scope = session(scenario, gymId);
  return names.map((name, i) => {
    const branch = scope.user.branches[i % scope.user.branches.length];
    const days = remaining[i];
    const months = i === 2 ? 6 : 3;
    const start = i === 6 ? day(10) : addMonths(day(days), -months);
    const end = i === 6 ? addMonths(start, months) : day(days);
    const gymPlan = plans[gymId]?.[0] ?? plans.atlas[0];
    const sub = {
      id: `${gymId}-sub-${i}`,
      plan_id: gymPlan.id,
      plan_name: gymPlan.name,
      months,
      plan_label: planLabel(months),
      starts_on: start,
      ends_on: end,
      amount: gymId === "titan" ? "330.00" : "270.00",
      access_scope: "gym" as const,
      access_branches: [],
      receipt: {
        id: `${gymId}-receipt-${i}`,
        number: `R-${String(i + 1).padStart(6, "0")}`,
      },
    };
    return {
      id: `${gymId}-${i}`,
      document_type: i === 7 ? "ce" : "dni",
      document_number: i === 7 ? "000123456" : String(70123456 + i * 1187),
      full_name:
        gymId === "titan"
          ? [
              "Daniela Ríos",
              "Mateo León",
              "Elena Vargas",
              "Nicolás Prado",
              "Paula Díaz",
              "Luis Paredes",
              "Ana Córdova",
              "Bruno Silva",
              "Laura Peña",
              "Iván Ramos",
            ][i]
          : name,
      phone: `9876543${String(i).padStart(2, "0")}`,
      home_branch: {
        id: branch.id,
        name: branch.name,
        gym_name: branch.gym_name,
      },
      status:
        i === 6
          ? "scheduled"
          : days < 0
            ? "expired"
            : days <= 7
              ? "expiring"
              : "active",
      days_remaining: days,
      plan_label: sub.plan_label,
      plan_names: [sub.plan_name],
      starts_on: start,
      ends_on: end,
      last_receipt: null,
      memberships: [
        sub,
        {
          ...sub,
          id: sub.id + "-previous",
          starts_on: addMonths(start, -months),
          ends_on: start,
          receipt: null,
        },
      ],
    };
  });
}

export const products: Product[] = [
  ["Batido", "8.00"],
  ["Agua", "2.50"],
  ["Gaseosa", "3.50"],
  ["Barra de proteína", "6.00"],
  ["Toalla", "15.00"],
].map(([name, price], position) => ({
  id: `product-${position}`,
  name,
  price,
  is_active: true,
  position,
}));

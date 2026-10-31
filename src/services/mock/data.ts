import { addMonths, planLabel, todayLima } from "@/lib/format";
import type { Branch, User } from "@/types";
import type { MemberProfile, Scenario, SessionSnapshot } from "../types";
const gyms: User["gym"][] = [
  {
    id: "atlas",
    name: "Atlas Fitness",
    brand_color: "#246b55",
    logo_url: null,
  },
  { id: "titan", name: "Titan Studio", brand_color: "#7951ad", logo_url: null },
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
      organization: { id: "group-1", name: "" },
      gym,
      branches: scenario === "branches" ? allowed : allowed.slice(0, 1),
    },
    availableGyms: scenario === "gyms" ? gyms : [gyms[0]],
    gymBranchCount: scenario === "single" ? 1 : allowed.length,
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
export function members(gymId: string, scenario: Scenario): MemberProfile[] {
  const scope = session(scenario, gymId);
  return names.map((name, i) => {
    const branch = scope.user.branches[i % scope.user.branches.length];
    const days = remaining[i];
    const months = i === 2 ? 6 : 3;
    const start = i === 6 ? day(10) : addMonths(day(days), -months);
    const end = i === 6 ? addMonths(start, months) : day(days);
    const sub = {
      id: `${gymId}-sub-${i}`,
      months,
      plan_label: planLabel(months),
      starts_on: start,
      ends_on: end,
      amount: gymId === "titan" ? "330.00" : "270.00",
      access_scope: "gym" as const,
      access_branches: [],
      receipt: null,
      method: (["yape_plin", "cash", "card", "transfer"] as const)[i % 4],
      collection_branch: { id: branch.id, name: branch.name },
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
          method: "cash",
        },
      ],
    };
  });
}

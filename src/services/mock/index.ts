import { members, session } from "./data";
import type { Services } from "../types";
const delay = <T>(fn: () => T): Promise<T> =>
  new Promise((resolve, reject) =>
    setTimeout(() => {
      try {
        resolve(fn());
      } catch (e) {
        reject(e);
      }
    }, 550),
  );
export const mockServices: Services = {
  session: {
    preview: (scenario, gymId) => delay(() => session(scenario, gymId)),
  },
  members: {
    list: (gymId, branchId, scenario, query, state) =>
      delay(() => {
        if (state === "error")
          throw {
            code: "PREVIEW",
            message: "No se pudo cargar esta vista. Vuelve a intentarlo.",
          };
        const all =
          state === "empty"
            ? []
            : members(gymId, scenario).filter(
                (m) => m.home_branch.id === branchId,
              );
        const normalize = (s: string) =>
          s
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
        const data = all.filter(
          (m) =>
            (!query.status ||
              query.status === "all" ||
              m.status === query.status) &&
            normalize(m.full_name + m.document_number).includes(
              normalize(query.search?.trim() ?? ""),
            ),
        );
        return {
          data,
          meta: { page: 1, page_size: 25, total: data.length },
          counts: {
            all: all.length,
            active: all.filter((m) => m.status === "active").length,
            expiring: all.filter((m) => m.status === "expiring").length,
            expired: all.filter((m) => m.status === "expired").length,
            scheduled: all.filter((m) => m.status === "scheduled").length,
          },
        };
      }),
    get: (gymId, id, scenario) =>
      delay(() => {
        const member = members(gymId, scenario).find((m) => m.id === id);
        if (!member)
          throw {
            code: "NOT_FOUND",
            message: "Este miembro no está disponible en el gimnasio activo.",
          };
        return member;
      }),
  },
};

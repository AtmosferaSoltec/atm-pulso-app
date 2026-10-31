import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { services, type SessionSnapshot } from "@/services";
import type { ApiError, GymFeature } from "@/types";

const toApiError = (e: unknown): ApiError =>
  (e as ApiError)?.code
    ? (e as ApiError)
    : { code: "UNKNOWN", message: "Algo salió mal. Inténtalo de nuevo." };

function useSessionState() {
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [booting, setBooting] = useState(true);
  const [bootError, setBootError] = useState<ApiError | undefined>();
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | undefined>();
  const [branchId, setBranchId] = useState("");
  const [, setLabTick] = useState(0);
  const [dataVersion, setDataVersion] = useState(0);
  const signedOutByUser = useRef(false);

  const apply = useCallback((data: SessionSnapshot) => {
    setSnapshot(data);
    setBranchId((prev) =>
      data.user.branches.some((b) => b.id === prev)
        ? prev
        : (data.user.branches[0]?.id ?? ""),
    );
  }, []);

  const [bootTick, setBootTick] = useState(0);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (await services.auth.restore()) {
          const data = await services.session.load();
          if (!cancelled) apply(data);
        }
      } catch (e) {
        const error = toApiError(e);
        // An unusable session just means "show the login"; a network failure means "retry".
        if (!cancelled && error.code !== "UNAUTHORIZED") setBootError(error);
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apply, bootTick]);

  useEffect(
    () =>
      services.auth.onExpired(() => {
        // A request still in flight when the user logs out must not show "session expired".
        if (signedOutByUser.current) return;
        setSnapshot(null);
        setNotice("Tu sesión expiró. Vuelve a entrar.");
      }),
    [],
  );

  const user = snapshot?.user ?? null;
  return {
    user,
    booting,
    bootError,
    retryBoot: () => {
      setBooting(true);
      setBootError(undefined);
      setBootTick((t) => t + 1);
    },
    pending,
    notice,
    plans: snapshot?.plans ?? [],
    /** Bumped after a sale so lists and cards reload. */
    dataVersion,
    invalidate: () => setDataVersion((v) => v + 1),
    gyms: snapshot?.gyms ?? [],
    activeBranch: user?.branches.find((b) => b.id === branchId) ?? null,
    /** Gym and branch only show (and switch) when the user has more than one. */
    visibility: {
      showGym: (snapshot?.gyms.length ?? 0) > 1,
      showBranch: (user?.branches.length ?? 0) > 1,
    },
    /** Optional modules of the current gym. */
    hasFeature: (feature: GymFeature) =>
      user?.gym.features.includes(feature) ?? false,
    async signIn(dni: string, password: string) {
      setPending(true);
      setNotice(undefined);
      signedOutByUser.current = false;
      try {
        await services.auth.signIn(dni, password);
        try {
          apply(await services.session.load());
        } catch (e) {
          await services.auth.signOut();
          throw e;
        }
      } finally {
        setPending(false);
      }
    },
    async changePassword(dni: string, current: string, next: string) {
      setPending(true);
      try {
        await services.auth.changePassword(dni, current, next);
      } finally {
        setPending(false);
      }
    },
    async signOut() {
      signedOutByUser.current = true;
      setSnapshot(null);
      setNotice(undefined);
      await services.auth.signOut();
    },
    async switchGym(id: string) {
      setPending(true);
      try {
        await services.session.switchGym(id);
        apply(await services.session.load());
      } finally {
        setPending(false);
      }
    },
    setActiveBranch: (id: string) => {
      if (user?.branches.some((b) => b.id === id)) setBranchId(id);
    },
    /** Mock-only development lab. */
    lab: services.lab,
    async setLab(next: Parameters<NonNullable<typeof services.lab>["set"]>[0]) {
      services.lab?.set(next);
      if (next.scenario) apply(await services.session.load());
      setLabTick((t) => t + 1);
    },
  };
}

const Context = createContext<ReturnType<typeof useSessionState> | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const value = useSessionState();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSession() {
  const value = useContext(Context);
  if (!value) throw new Error("SessionProvider missing");
  return value;
}

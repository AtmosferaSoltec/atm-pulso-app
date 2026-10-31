import { createContext, useContext, useState, type ReactNode } from "react";
import {
  services,
  type PreviewState,
  type Scenario,
  type SessionSnapshot,
} from "@/services";
function useSessionState() {
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [scenario, setScenario] = useState<Scenario>("single");
  const [previewState, setPreviewState] = useState<PreviewState>("ready");
  const [branchId, setBranchId] = useState("");
  const [pending, setPending] = useState(false);
  async function load(next: Scenario, gymId?: string) {
    setPending(true);
    try {
      const data = await services.session.preview(next, gymId);
      setSnapshot(data);
      setScenario(next);
      setBranchId(data.user.branches[0].id);
    } finally {
      setPending(false);
    }
  }
  const user = snapshot?.user ?? null;
  return {
    user,
    scenario,
    pending,
    previewState,
    setPreviewState,
    activeBranch: user?.branches.find((b) => b.id === branchId) ?? null,
    availableGyms: snapshot?.availableGyms ?? [],
    visibility: {
      hasMultipleGyms: (snapshot?.availableGyms.length ?? 0) > 1,
      hasMultipleBranches: (snapshot?.gymBranchCount ?? 0) > 1,
      canSelectBranch: (user?.branches.length ?? 0) > 1,
    },
    signIn: () => load(scenario),
    signOut: () => setSnapshot(null),
    setScenario: (next: Scenario) => load(next),
    switchGym: (id: string) => load(scenario, id),
    setActiveBranch: (id: string) => {
      if (user?.branches.some((b) => b.id === id)) setBranchId(id);
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

import { services } from "@/services";
import { useSession } from "@/state/session";
import type { MemberListQuery } from "@/types";
import { useAsync } from "./use-async";
export function useMembers(query: MemberListQuery) {
  const { user, activeBranch, scenario, previewState } = useSession();
  const gym = user?.gym.id ?? "";
  const branch = activeBranch?.id ?? "";
  return useAsync(
    () => services.members.list(gym, branch, scenario, query, previewState),
    [gym, branch, scenario, previewState, query.status, query.search],
  );
}
export function useMember(id: string) {
  const { user, scenario } = useSession();
  const gym = user?.gym.id ?? "";
  return useAsync(
    () => services.members.get(gym, id, scenario),
    [gym, id, scenario],
  );
}

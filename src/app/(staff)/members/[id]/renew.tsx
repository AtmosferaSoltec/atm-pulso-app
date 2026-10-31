import { useLocalSearchParams } from "expo-router";
import { SubscriptionEditor } from "@/components/SubscriptionEditor";
import { ErrorState, Screen, SkeletonList } from "@/components/ui";
import { useMember } from "@/hooks/queries";
export default function Subscription() {
  const { id, mode, subscriptionId } = useLocalSearchParams<{
    id: string;
    mode?: string;
    subscriptionId?: string;
  }>();
  const result = useMember(id);
  if (result.loading)
    return (
      <Screen>
        <SkeletonList />
      </Screen>
    );
  if (result.error || !result.data)
    return (
      <Screen>
        <ErrorState error={result.error} onRetry={result.refetch} />
      </Screen>
    );
  return (
    <SubscriptionEditor
      member={result.data}
      mode={mode ?? "renew"}
      subscription={
        mode === "edit"
          ? result.data.memberships.find((s) => s.id === subscriptionId)
          : undefined
      }
    />
  );
}

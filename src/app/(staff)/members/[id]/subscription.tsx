import { useLocalSearchParams } from "expo-router";

import { SubscriptionForm } from "@/components/SubscriptionForm";
import { ErrorState, Screen, SkeletonList } from "@/components/ui";
import { useMember } from "@/hooks/queries";

/** Renew (default) or modify an existing subscription (`mode=edit`). */
export default function SubscriptionScreen() {
  const { id, mode, subscriptionId } = useLocalSearchParams<{
    id: string;
    mode?: string;
    subscriptionId?: string;
  }>();
  const result = useMember(id);
  if (result.loading)
    return (
      <Screen>
        <SkeletonList rows={4} />
      </Screen>
    );
  if (result.error || !result.data)
    return (
      <Screen>
        <ErrorState error={result.error} onRetry={result.refetch} />
      </Screen>
    );
  const subscription =
    mode === "edit"
      ? result.data.memberships.find((s) => s.id === subscriptionId)
      : undefined;
  return <SubscriptionForm member={result.data} subscription={subscription} />;
}

import { Redirect } from "expo-router";

import { useSession } from "@/state/session";

export default function Index() {
  const { user } = useSession();
  return <Redirect href={user ? "/(staff)/(tabs)" : "/login"} />;
}

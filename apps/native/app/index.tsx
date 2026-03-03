import { useQuery } from "@tanstack/react-query";
import { Redirect, useRootNavigationState } from "expo-router";
import { Spinner } from "heroui-native";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

export default function Gate() {
  // 1. Add this hook
  const rootNavigationState = useRootNavigationState();
  const { data: session, isPending: authLoading } = authClient.useSession();

  const profileQuery = useQuery({
    ...orpc.profile.get.queryOptions(),
    enabled: !!session?.user,
  });

  // 2. CRITICAL FIX: Don't do anything until Expo Router is mounted
  if (!rootNavigationState?.key) {
    return null;
  }

  // 3. Wait for auth to resolve
  if (authLoading) {
    return (
      <Container isScrollable={false}>
        <View className="flex-1 items-center justify-center gap-4">
          <Text className="text-4xl">🍎</Text>
          <Spinner size="lg" />
          <Text className="text-muted text-lg">Carregando...</Text>
        </View>
      </Container>
    );
  }

  // 4. Not logged in → auth screen
  if (!session?.user) {
    return <Redirect href="/(auth)" />;
  }

  // 5. Wait for profile check
  if (profileQuery.isLoading) {
    return (
      <Container isScrollable={false}>
        <View className="flex-1 items-center justify-center gap-4">
          <Text className="text-4xl">🍎</Text>
          <Spinner size="lg" />
          <Text className="text-muted text-lg">Carregando...</Text>
        </View>
      </Container>
    );
  }

  // 6. No profile → onboarding
  if (!profileQuery.data) {
    return <Redirect href="/onboarding" />;
  }

  // 7. All good → main app
  return <Redirect href="/(tabs)" />;
}

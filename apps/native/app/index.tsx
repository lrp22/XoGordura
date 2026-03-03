import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Spinner } from "heroui-native";
import { useEffect } from "react";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

export default function Gate() {
  const router = useRouter();
  const { data: session, isPending: authLoading } = authClient.useSession();

  const profileQuery = useQuery({
    ...orpc.profile.get.queryOptions(),
    enabled: !!session?.user,
  });

  useEffect(() => {
    // Wait for auth to resolve
    if (authLoading) return;

    // Not logged in → auth screen
    if (!session?.user) {
      router.replace("/(auth)");
      return;
    }

    // Wait for profile check
    if (profileQuery.isLoading) return;

    // No profile → onboarding
    if (!profileQuery.data) {
      router.replace("/onboarding");
      return;
    }

    // All good → main app
    router.replace("/(tabs)");
  }, [authLoading, session, profileQuery.isLoading, profileQuery.data, router]);

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

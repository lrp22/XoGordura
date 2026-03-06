import { useQuery } from "@tanstack/react-query";
import { Redirect, useRootNavigationState } from "expo-router";
import { Spinner } from "heroui-native";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { Image } from "expo-image"; // <-- Add this import
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { Container } from "@/components/container";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

// Replace PulsingEmoji with PulsingLogo
function PulsingLogo() {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        // Slightly softer scale (1.1 instead of 1.2) looks better on larger images
        withTiming(1.1, { duration: 800 }),
        withTiming(1, { duration: 800 }),
      ),
      -1,
      true,
    );
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Image
        source={require("@/assets/images/fitness-cat.png")}
        style={{ width: 160, height: 160 }}
        contentFit="contain"
      />
    </Animated.View>
  );
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <Container isScrollable={false}>
      <View className="flex-1 items-center justify-center gap-6">
        <PulsingLogo />
        <Animated.View entering={FadeIn.delay(300).duration(500)}>
          <Spinner size="lg" color="primary" />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(500).duration(500)}>
          <Text className="text-muted-foreground text-lg font-medium">
            {message}
          </Text>
        </Animated.View>
      </View>
    </Container>
  );
}

export default function Gate() {
  const rootNavigationState = useRootNavigationState();
  const { data: session, isPending: authLoading } = authClient.useSession();

  const profileQuery = useQuery({
    ...orpc.profile.get.queryOptions(),
    enabled: !!session?.user,
  });

  if (!rootNavigationState?.key) {
    return null;
  }

  if (authLoading) {
    return <LoadingScreen message="Carregando..." />;
  }

  if (!session?.user) {
    return <Redirect href="/(auth)" />;
  }

  if (profileQuery.isLoading) {
    return <LoadingScreen message="Carregando perfil..." />;
  }

  if (!profileQuery.data) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}

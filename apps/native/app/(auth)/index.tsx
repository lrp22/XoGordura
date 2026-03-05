import { useQuery } from "@tanstack/react-query";
import { Redirect } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { Container } from "@/components/container";
import { SignIn } from "@/components/sign-in";
import { SignUp } from "@/components/sign-up";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

export default function AuthScreen() {
  const { data: session, isPending } = authClient.useSession();
  const [showSignIn, setShowSignIn] = useState(true);

  const profileQuery = useQuery({
    ...orpc.profile.get.queryOptions(),
    enabled: !isPending && !!session?.user,
  });

  if (!isPending && session?.user) {
    if (profileQuery.isLoading) return null;
    if (!profileQuery.data) return <Redirect href="/onboarding" />;
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Container>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "flex-start",
          padding: 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Branding ──────────────────────────── */}
        <Animated.View
          entering={FadeInDown.duration(600).springify()}
          className="items-center mb-7"
        >
          <Image
            source={require("@/assets/images/fitness-cat.png")}
            style={{ width: 480, height: 180 }}
            contentFit="contain" // Replaces resizeMode for expo-image
            transition={1000} // Smoothly fades in the logo over 1s
          />
          <Text className="text-foreground text-4xl font-bold tracking-tight">
            XoGordura
          </Text>
          <Text className="text-muted-foreground text-lg mt-2">
            Seu diário alimentar inteligente
          </Text>
        </Animated.View>

        {/* ── Form area ─────────────────────────── */}
        <Animated.View layout={LinearTransition.springify()} className="gap-5">
          {showSignIn ? (
            <Animated.View
              key="sign-in"
              entering={FadeIn.duration(400)}
              exiting={FadeOut.duration(200)}
            >
              <SignIn />
            </Animated.View>
          ) : (
            <Animated.View
              key="sign-up"
              entering={FadeIn.duration(400)}
              exiting={FadeOut.duration(200)}
            >
              <SignUp />
            </Animated.View>
          )}

          {/* ── Toggle link ─────────────────────── */}
          <Animated.View entering={FadeInUp.delay(300).duration(500)}>
            <Pressable
              onPress={() => setShowSignIn((prev) => !prev)}
              className="py-3 active:opacity-60"
            >
              <Text className="text-center text-muted-foreground text-base">
                {showSignIn ? "Não tem conta? " : "Já tem conta? "}
                <Text className="text-primary font-bold underline">
                  {showSignIn ? "Criar conta" : "Entrar"}
                </Text>
              </Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </Container>
  );
}

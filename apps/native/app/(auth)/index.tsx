import { useQuery } from "@tanstack/react-query";
import { Redirect } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

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
    if (profileQuery.isLoading) return null; // wait briefly
    if (!profileQuery.data) return <Redirect href="/onboarding" />;
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Container>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-8">
          <Text className="text-5xl mb-3">🍎</Text>
          <Text className="text-foreground text-3xl font-bold">XoGordura</Text>
          <Text className="text-muted text-lg mt-2">
            Seu diário alimentar inteligente
          </Text>
        </View>

        {showSignIn ? (
          <View className="gap-4">
            <SignIn />
            <Text
              onPress={() => setShowSignIn(false)}
              className="text-center text-muted text-base underline py-2"
            >
              Não tem conta? Criar conta
            </Text>
          </View>
        ) : (
          <View className="gap-4">
            <SignUp />
            <Text
              onPress={() => setShowSignIn(true)}
              className="text-center text-muted text-base underline py-2"
            >
              Já tem conta? Entrar
            </Text>
          </View>
        )}
      </ScrollView>
    </Container>
  );
}

import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Button, Spinner, Surface, useThemeColor } from "heroui-native";
import { Platform, Pressable, Text, View } from "react-native";

import { Container } from "@/components/container";
import { authClient } from "@/lib/auth-client";
import { calcAge } from "@/lib/calories";
import { queryClient, orpc } from "@/utils/orpc";

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "Sedentária",
  light: "Leve",
  moderate: "Moderada",
  active: "Ativa",
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center py-3">
      <Text className="text-muted text-base">{label}</Text>
      <Text className="text-foreground text-lg font-semibold">{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const profileQuery = useQuery(orpc.profile.get.queryOptions());
  const dangerColor = useThemeColor("danger");

  const profile = profileQuery.data;

  async function handleSignOut() {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    await authClient.signOut();
    queryClient.clear();
    router.replace("/");
  }

  if (profileQuery.isLoading) {
    return (
      <Container isScrollable={false}>
        <View className="flex-1 items-center justify-center">
          <Spinner size="lg" />
        </View>
      </Container>
    );
  }

  const birthYear = profile?.birthDate
    ? Number.parseInt(profile.birthDate.split("-")[0], 10)
    : null;

  return (
    <Container>
      <View className="px-6 pt-4 pb-8 gap-6">
        {/* User info */}
        <Surface variant="secondary" className="p-6 rounded-2xl items-center">
          <View className="w-20 h-20 rounded-full bg-muted items-center justify-center mb-3">
            <Ionicons name="person" size={40} color={dangerColor} />
          </View>
          <Text className="text-foreground text-2xl font-bold">
            {session?.user?.name}
          </Text>
          <Text className="text-muted text-base mt-1">
            {session?.user?.email}
          </Text>
        </Surface>

        {/* Nutrition profile */}
        {profile && (
          <Surface variant="secondary" className="p-5 rounded-2xl">
            <Text className="text-foreground text-lg font-bold mb-2">
              Meu plano
            </Text>
            <View className="divide-y divide-muted/20">
              {birthYear && (
                <InfoRow label="Idade" value={`${calcAge(birthYear)} anos`} />
              )}
              {profile.heightCm && (
                <InfoRow label="Altura" value={`${profile.heightCm} cm`} />
              )}
              {profile.currentWeightKg && (
                <InfoRow
                  label="Peso inicial"
                  value={`${profile.currentWeightKg.toFixed(1)} kg`}
                />
              )}
              {profile.goalWeightKg && (
                <InfoRow
                  label="Peso desejado"
                  value={`${profile.goalWeightKg.toFixed(1)} kg`}
                />
              )}
              {profile.activityLevel && (
                <InfoRow
                  label="Atividade"
                  value={
                    ACTIVITY_LABELS[profile.activityLevel] ??
                    profile.activityLevel
                  }
                />
              )}
              {profile.dailyCalorieGoal && (
                <InfoRow
                  label="Meta diária"
                  value={`${profile.dailyCalorieGoal.toLocaleString("pt-BR")} kcal`}
                />
              )}
            </View>
          </Surface>
        )}

        {/* Sign out */}
        <Pressable
          onPress={handleSignOut}
          className="bg-danger/10 py-4 px-6 rounded-2xl flex-row items-center justify-center gap-2 active:opacity-70"
        >
          <Ionicons name="log-out-outline" size={22} color={dangerColor} />
          <Text className="text-danger text-lg font-semibold">
            Sair da conta
          </Text>
        </Pressable>
      </View>
    </Container>
  );
}

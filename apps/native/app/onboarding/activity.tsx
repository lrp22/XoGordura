import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Button, Spinner, Surface, useThemeColor } from "heroui-native";
import { Platform, Pressable, Text, View } from "react-native";

import { Container } from "@/components/container";
import { useOnboarding } from "@/contexts/onboarding-context";
import type { ActivityLevel } from "@/lib/calories";
import { calcGoalFromInputs } from "@/lib/calories";
import { queryClient, orpc } from "@/utils/orpc";

const ACTIVITY_OPTIONS: {
  level: ActivityLevel;
  emoji: string;
  title: string;
  description: string;
}[] = [
  {
    level: "sedentary",
    emoji: "🛋️",
    title: "Sedentária",
    description: "Fico mais em casa, pouco exercício",
  },
  {
    level: "light",
    emoji: "🚶",
    title: "Leve",
    description: "Caminhadas leves, 1-2x por semana",
  },
  {
    level: "moderate",
    emoji: "🏃‍♀️",
    title: "Moderada",
    description: "Exercício 3-5x por semana",
  },
  {
    level: "active",
    emoji: "💪",
    title: "Ativa",
    description: "Exercício diário ou trabalho pesado",
  },
];

function StepProgress({ current }: { current: number }) {
  return (
    <View className="flex-row gap-2 mb-6">
      {[1, 2, 3].map((step) => (
        <View
          key={step}
          className={`h-2 flex-1 rounded-full ${step <= current ? "bg-primary" : "bg-muted"}`}
        />
      ))}
    </View>
  );
}

export default function OnboardingActivity() {
  const router = useRouter();
  const { data, update } = useOnboarding();
  const foregroundColor = useThemeColor("foreground");
  const primaryColor = useThemeColor("accent");

  // Calculate calorie goal based on current selections
  const dailyGoal = calcGoalFromInputs(
    data.currentWeightKg,
    data.heightCm,
    data.birthYear,
    data.activityLevel,
  );

  // Save profile mutation
  const saveProfile = useMutation(
    orpc.profile.upsert.mutationOptions({
      onError: (error) => {
        console.error("Profile save failed:", error);
      },
    }),
  );

  // Save initial weight mutation
  const saveWeight = useMutation(
    orpc.weight.log.mutationOptions({
      onError: (error) => {
        console.error("Weight save failed:", error);
      },
    }),
  );

  const isSaving = saveProfile.isPending || saveWeight.isPending;

  async function handleComplete() {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const today = new Date().toISOString().split("T")[0];

    try {
      // Save profile
      await saveProfile.mutateAsync({
        birthDate: `${data.birthYear}-01-01`,
        heightCm: data.heightCm,
        currentWeightKg: data.currentWeightKg,
        goalWeightKg: data.goalWeightKg,
        dailyCalorieGoal: dailyGoal,
        activityLevel: data.activityLevel,
      });

      // Log initial weight
      await saveWeight.mutateAsync({
        date: today,
        weightKg: data.currentWeightKg,
      });

      // Invalidate all cached queries so the gate re-evaluates
      await queryClient.invalidateQueries();

      // Go to main app
      router.replace("/(tabs)");
    } catch {
      // Errors handled by individual mutation onError callbacks
    }
  }

  function selectActivity(level: ActivityLevel) {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    update({ activityLevel: level });
  }

  return (
    <Container>
      <View className="flex-1 px-6 pt-16 pb-8 justify-between">
        {/* Top section */}
        <View>
          {/* Back button */}
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center gap-1 mb-4 self-start py-2"
          >
            <Ionicons name="chevron-back" size={20} color={foregroundColor} />
            <Text className="text-foreground text-base">Voltar</Text>
          </Pressable>

          <StepProgress current={3} />

          <Text className="text-foreground text-3xl font-bold mb-2">
            🏃 Nível de atividade
          </Text>

          <Text className="text-muted text-lg mb-6">
            Escolha o que mais combina com você
          </Text>
        </View>

        {/* Activity options */}
        <View className="gap-3">
          {ACTIVITY_OPTIONS.map((option) => {
            const isSelected = data.activityLevel === option.level;
            return (
              <Pressable
                key={option.level}
                onPress={() => selectActivity(option.level)}
                className="active:opacity-80"
              >
                <Surface
                  variant="secondary"
                  className="p-4 rounded-xl"
                  style={
                    isSelected
                      ? { borderWidth: 2, borderColor: primaryColor }
                      : { borderWidth: 2, borderColor: "transparent" }
                  }
                >
                  <View className="flex-row items-center gap-4">
                    <Text className="text-3xl">{option.emoji}</Text>
                    <View className="flex-1">
                      <Text
                        className={`text-lg font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}
                      >
                        {option.title}
                      </Text>
                      <Text className="text-muted text-sm mt-0.5">
                        {option.description}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={primaryColor}
                      />
                    )}
                  </View>
                </Surface>
              </Pressable>
            );
          })}
        </View>

        {/* Calorie goal display + save button */}
        <View className="mt-6 gap-4">
          <Surface variant="secondary" className="p-5 rounded-xl items-center">
            <Text className="text-muted text-base mb-1">
              Sua meta diária será
            </Text>
            <Text className="text-foreground text-4xl font-bold">
              {dailyGoal.toLocaleString("pt-BR")}
            </Text>
            <Text className="text-muted text-lg">kcal / dia</Text>
          </Surface>

          <Button
            size="lg"
            className="w-full h-16"
            onPress={handleComplete}
            isDisabled={isSaving}
          >
            {isSaving ? (
              <Spinner size="sm" color="default" />
            ) : (
              <Button.Label className="text-lg">Começar! 🚀</Button.Label>
            )}
          </Button>
        </View>
      </View>
    </Container>
  );
}

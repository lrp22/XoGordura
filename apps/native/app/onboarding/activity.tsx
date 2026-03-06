import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Button, Surface, Spinner } from "heroui-native";
import { Text, View, Pressable } from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
} from "react-native-reanimated";

import { Container } from "@/components/container";
import { useOnboarding } from "@/contexts/onboarding-context";
import {
  calcGoals,
  MACRO_PRESETS,
  type ActivityLevel,
  type MacroPresetKey,
} from "@/lib/calories";
import { queryClient, orpc } from "@/utils/orpc";

const ACTIVITY_OPTIONS: {
  key: ActivityLevel;
  label: string;
  emoji: string;
  description: string;
}[] = [
  {
    key: "sedentary",
    label: "Sedentária",
    emoji: "🪑",
    description: "Trabalho de escritório, pouco exercício",
  },
  {
    key: "light",
    label: "Leve",
    emoji: "🚶",
    description: "Exercício leve 1-3x por semana",
  },
  {
    key: "moderate",
    label: "Moderada",
    emoji: "🏃",
    description: "Exercício moderado 3-5x por semana",
  },
  {
    key: "active",
    label: "Ativa",
    emoji: "🏋️",
    description: "Exercício intenso 6-7x por semana",
  },
];

const PRESET_KEYS: MacroPresetKey[] = ["moderate", "lower_carb", "higher_carb"];

export default function OnboardingActivity() {
  const router = useRouter();
  const { data, update } = useOnboarding();

  const selectedSplit = MACRO_PRESETS[data.macroPreset].split;

  const results = calcGoals(
    data.currentWeightKg,
    data.heightCm,
    data.birthYear,
    data.gender,
    data.activityLevel,
    data.deficitPercentage,
    selectedSplit,
  );

  const saveProfile = useMutation(orpc.profile.upsert.mutationOptions());
  const saveWeight = useMutation(orpc.weight.log.mutationOptions());

  async function handleComplete() {
    const today = new Date().toISOString().split("T")[0];

    await saveProfile.mutateAsync({
      birthDate: `${data.birthYear}-01-01`,
      gender: data.gender,
      heightCm: data.heightCm,
      currentWeightKg: data.currentWeightKg,
      // FIX 2: goalWeightKg is now passed and persisted
      goalWeightKg: data.goalWeightKg,
      dailyCalorieGoal: results.calories,
      dailyProteinGoal: results.protein,
      dailyCarbsGoal: results.carbs,
      dailyFatGoal: results.fat,
      activityLevel: data.activityLevel,
      // FIX 3: deficitPercentage is now saved so edit-goals can use
      // the user's original choice rather than always defaulting to 20%
      deficitPercentage: data.deficitPercentage,
      hasDiabetes: data.hasDiabetes,
      diabetesType: data.diabetesType,
      dailySugarLimitG: data.dailySugarLimitG,
    });

    await saveWeight.mutateAsync({
      date: today,
      weightKg: data.currentWeightKg,
    });

    await queryClient.invalidateQueries();
    router.replace("/(tabs)");
  }

  const isSaving = saveProfile.isPending || saveWeight.isPending;

  return (
    <Container>
      <View className="flex-1 px-6 pt-12 pb-8 justify-between bg-background">
        <View>
          {/* ── Activity Level ───────────────────── */}
          <Animated.View entering={FadeInDown.duration(500)}>
            <Text className="text-foreground text-3xl font-bold mb-2">
              Nível de Atividade 🏃
            </Text>
            <Text className="text-muted-foreground text-base mb-4">
              Qual o seu nível de atividade física?
            </Text>
          </Animated.View>

          <View className="gap-2 mb-8">
            {ACTIVITY_OPTIONS.map((opt, i) => {
              const isSelected = data.activityLevel === opt.key;
              return (
                <Animated.View
                  key={opt.key}
                  entering={FadeInDown.delay(100 + i * 60)
                    .duration(400)
                    .springify()}
                >
                  <Pressable
                    onPress={() => update({ activityLevel: opt.key })}
                    className="active:scale-[0.98]"
                  >
                    <Surface
                      variant="secondary"
                      className={`py-3.5 px-4 rounded-2xl bg-card flex-row items-center gap-3 border-2 transition-colors ${
                        isSelected ? "border-accent" : "border-transparent"
                      }`}
                    >
                      <Text className="text-2xl">{opt.emoji}</Text>
                      <View className="flex-1">
                        <Text
                          className={`text-base font-bold ${
                            isSelected ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {opt.label}
                        </Text>
                        <Text className="text-muted-foreground text-xs mt-0.5">
                          {opt.description}
                        </Text>
                      </View>
                    </Surface>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>

          {/* ── Macro Distribution ────────────────── */}
          <Animated.View entering={FadeInDown.delay(400).duration(500)}>
            <Text className="text-foreground text-xl font-bold mb-1">
              Distribuição de Macros 🥩🥑🍚
            </Text>
            <Text className="text-muted-foreground text-sm mb-1">
              Proteína / Gordura / Carboidratos
            </Text>
            {data.hasDiabetes && (
              <Text className="text-warning text-xs font-medium mb-3">
                ⚠️ Recomendamos Low Carb para diabéticos
              </Text>
            )}
          </Animated.View>

          <View className="gap-3 mb-8">
            {PRESET_KEYS.map((key, i) => {
              const preset = MACRO_PRESETS[key];
              const isSelected = data.macroPreset === key;
              const isRecommended = data.hasDiabetes && key === "lower_carb";
              const previewMacros = calcGoals(
                data.currentWeightKg,
                data.heightCm,
                data.birthYear,
                data.gender,
                data.activityLevel,
                data.deficitPercentage,
                preset.split,
              );

              return (
                <Animated.View
                  key={key}
                  entering={FadeInDown.delay(500 + i * 80)
                    .duration(400)
                    .springify()}
                >
                  <Pressable
                    onPress={() => update({ macroPreset: key })}
                    className="active:scale-[0.98]"
                  >
                    <Surface
                      variant="secondary"
                      className={`p-4 bg-card rounded-2xl border-2 transition-colors ${
                        isSelected ? "border-accent" : "border-transparent"
                      }`}
                    >
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center gap-2">
                          <Text
                            className={`text-base font-bold ${
                              isSelected ? "text-primary" : "text-foreground"
                            }`}
                          >
                            {preset.label}
                          </Text>
                          {isRecommended && (
                            <View className="bg-success/20 px-2 py-0.5 rounded">
                              <Text className="text-success text-xs font-bold">
                                Recomendado
                              </Text>
                            </View>
                          )}
                        </View>
                        <View className="bg-secondary px-2.5 py-1 rounded-md">
                          <Text className="text-muted-foreground text-xs font-bold">
                            {preset.tag}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-muted-foreground text-xs mb-3">
                        {preset.description}
                      </Text>
                      <View className="flex-row justify-between">
                        <View className="items-center flex-1">
                          <Text className="text-foreground text-lg font-bold">
                            {previewMacros.protein}g
                          </Text>
                          <Text className="text-muted-foreground text-xs">
                            proteína
                          </Text>
                        </View>
                        <View className="items-center flex-1">
                          <Text className="text-foreground text-lg font-bold">
                            {previewMacros.fat}g
                          </Text>
                          <Text className="text-muted-foreground text-xs">
                            gordura
                          </Text>
                        </View>
                        <View className="items-center flex-1">
                          <Text className="text-foreground text-lg font-bold">
                            {previewMacros.carbs}g
                          </Text>
                          <Text className="text-muted-foreground text-xs">
                            carbos
                          </Text>
                        </View>
                      </View>
                    </Surface>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>

          {/* ── Summary ──────────────────────────── */}
          <Animated.View entering={FadeIn.delay(800).duration(500)}>
            <Surface
              variant="secondary"
              className="p-5 rounded-2xl gap-3 border-2 border-accent"
            >
              <View className="items-center border-b border-border pb-3">
                <Text className="text-muted-foreground text-sm font-medium">
                  Meta Diária
                </Text>
                <Text className="text-primary text-4xl font-bold mt-1">
                  {results.calories} kcal
                </Text>
                <Text className="text-muted-foreground text-xs mt-1">
                  Déficit de {results.deficit} kcal/dia (manutenção:{" "}
                  {results.tdee})
                </Text>
              </View>
              <View className="flex-row justify-between">
                <View className="items-center flex-1">
                  <Text className="text-foreground font-bold text-lg">
                    {results.protein}g
                  </Text>
                  <Text className="text-muted-foreground text-xs">
                    Proteína
                  </Text>
                </View>
                <View className="items-center flex-1">
                  <Text className="text-foreground font-bold text-lg">
                    {results.fat}g
                  </Text>
                  <Text className="text-muted-foreground text-xs">Gordura</Text>
                </View>
                <View className="items-center flex-1">
                  <Text className="text-foreground font-bold text-lg">
                    {results.carbs}g
                  </Text>
                  <Text className="text-muted-foreground text-xs">Carbos</Text>
                </View>
              </View>
              {data.hasDiabetes && data.dailySugarLimitG && (
                <View className="pt-3 border-t border-border">
                  <Text className="text-warning text-xs text-center font-medium">
                    🩺 Limite de açúcar: {data.dailySugarLimitG}g/dia
                  </Text>
                </View>
              )}
            </Surface>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInUp.delay(900).duration(600).springify()}>
          <Button
            size="lg"
            className="h-16 mt-6"
            onPress={handleComplete}
            isDisabled={isSaving}
          >
            {isSaving ? (
              <Spinner />
            ) : (
              <Button.Label className="text-lg">Começar Agora! 🚀</Button.Label>
            )}
          </Button>
        </Animated.View>
      </View>
    </Container>
  );
}

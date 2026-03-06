import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Button, Spinner } from "heroui-native";
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

  // Global calculation for the summary block
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
      dailyCalorieGoal: results.calories,
      dailyProteinGoal: results.protein,
      dailyCarbsGoal: results.carbs,
      dailyFatGoal: results.fat,
      activityLevel: data.activityLevel,
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
            <Text className="text-muted-foreground text-base mb-6">
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
                    <View
                      className={`p-4 rounded-3xl flex-row items-center gap-4 border-2 transition-colors ${isSelected ? "bg-card border-primary" : "bg-muted/30 border-transparent"}`}
                    >
                      <View className="w-12 h-12 rounded-2xl bg-background items-center justify-center">
                        <Text className="text-2xl">{opt.emoji}</Text>
                      </View>
                      <View className="flex-1">
                        <Text
                          className={`text-base font-bold ${isSelected ? "text-primary" : "text-foreground"}`}
                        >
                          {opt.label}
                        </Text>
                        <Text className="text-muted-foreground text-xs">
                          {opt.description}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>

          {/* ── Macro Distribution (Restored Previews!) ────────────────── */}
          <Animated.View entering={FadeInDown.delay(400).duration(500)}>
            <Text className="text-foreground text-xs font-bold uppercase tracking-wider mb-1 px-1">
              Distribuição de Macros 🥩🥑🍚
            </Text>
            <Text className="text-muted-foreground text-xs px-1 mb-3">
              Proteína / Gordura / Carboidratos
            </Text>
            {!!data.hasDiabetes && (
              <Text className="text-warning text-xs font-bold px-1 mb-4">
                ⚠️ Recomendamos Low Carb para diabéticos
              </Text>
            )}
          </Animated.View>

          <View className="gap-3 mb-8">
            {PRESET_KEYS.map((key, i) => {
              const preset = MACRO_PRESETS[key];
              const isSelected = data.macroPreset === key;
              const isRecommended = data.hasDiabetes && key === "lower_carb";

              // RESTORED: Dynamically calculate macros for this specific card
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
                    <View
                      className={`p-5 rounded-3xl border-2 transition-colors ${isSelected ? "bg-card border-primary" : "bg-muted/30 border-transparent"}`}
                    >
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center gap-2">
                          <Text
                            className={`text-base font-bold ${isSelected ? "text-primary" : "text-foreground"}`}
                          >
                            {preset.label}
                          </Text>
                          {!!isRecommended && (
                            <View className="bg-success/20 px-2 py-0.5 rounded border border-success/30">
                              <Text className="text-success text-[10px] font-bold uppercase">
                                Recomendado
                              </Text>
                            </View>
                          )}
                        </View>
                        <View className="bg-background px-3 py-1 rounded-lg border border-border">
                          <Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                            {preset.tag}
                          </Text>
                        </View>
                      </View>

                      <Text className="text-muted-foreground text-xs mb-4">
                        {preset.description}
                      </Text>

                      {/* RESTORED: Macro previews inside the card */}
                      <View className="flex-row justify-between bg-background p-3 rounded-2xl border border-border">
                        <View className="items-center flex-1">
                          <Text className="text-foreground text-base font-bold">
                            {previewMacros.protein}g
                          </Text>
                          <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">
                            Proteína
                          </Text>
                        </View>
                        <View className="w-px bg-border" />
                        <View className="items-center flex-1">
                          <Text className="text-foreground text-base font-bold">
                            {previewMacros.fat}g
                          </Text>
                          <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">
                            Gordura
                          </Text>
                        </View>
                        <View className="w-px bg-border" />
                        <View className="items-center flex-1">
                          <Text className="text-foreground text-base font-bold">
                            {previewMacros.carbs}g
                          </Text>
                          <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">
                            Carbos
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>

          {/* ── Summary ──────────────────────────── */}
          <Animated.View entering={FadeIn.delay(800).duration(500)}>
            <View className="p-6 rounded-3xl gap-3 border-2 border-primary/30 bg-primary/5">
              <View className="items-center border-b border-primary/10 pb-4">
                <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
                  Meta Diária
                </Text>
                <Text className="text-primary text-4xl font-black mt-1">
                  {results.calories} kcal
                </Text>
                <Text className="text-muted-foreground text-xs mt-2 font-medium">
                  Déficit de {results.deficit} kcal/dia (manutenção:{" "}
                  {results.tdee})
                </Text>
              </View>
              <View className="flex-row justify-between pt-2">
                <View className="items-center flex-1">
                  <Text className="text-foreground font-bold text-xl">
                    {results.protein}g
                  </Text>
                  <Text className="text-muted-foreground text-xs">
                    Proteína
                  </Text>
                </View>
                <View className="items-center flex-1">
                  <Text className="text-foreground font-bold text-xl">
                    {results.fat}g
                  </Text>
                  <Text className="text-muted-foreground text-xs">Gordura</Text>
                </View>
                <View className="items-center flex-1">
                  <Text className="text-foreground font-bold text-xl">
                    {results.carbs}g
                  </Text>
                  <Text className="text-muted-foreground text-xs">Carbos</Text>
                </View>
              </View>

              {/* RESTORED: Sugar limit display for diabetics */}
              {!!(data.hasDiabetes && data.dailySugarLimitG) && (
                <View className="pt-4 mt-2 border-t border-primary/10">
                  <Text className="text-warning text-xs text-center font-bold">
                    🩺 Limite de açúcar: {data.dailySugarLimitG}g/dia
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInUp.delay(900).duration(600).springify()}>
          <Button
            size="lg"
            className="h-16 mt-6 rounded-3xl bg-primary"
            onPress={handleComplete}
            isDisabled={isSaving}
          >
            {isSaving ? (
              <Spinner color="default" />
            ) : (
              <Button.Label className="text-lg font-bold text-white">
                Começar Agora! 🚀
              </Button.Label>
            )}
          </Button>
        </Animated.View>
      </View>
    </Container>
  );
}

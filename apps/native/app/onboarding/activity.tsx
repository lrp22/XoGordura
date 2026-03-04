import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Button, Surface, Spinner, useThemeColor } from "heroui-native";
import { Text, View, Pressable } from "react-native";

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
  const primaryColor = useThemeColor("accent");

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
      <View className="flex-1 px-6 pt-12 pb-8 justify-between">
        <View>
          {/* ── Activity Level ───────────────────── */}
          <Text className="text-foreground text-3xl font-bold mb-2">
            Nível de Atividade 🏃
          </Text>
          <Text className="text-muted text-base mb-4">
            Qual o seu nível de atividade física?
          </Text>

          <View className="gap-2 mb-8">
            {ACTIVITY_OPTIONS.map((opt) => {
              const isSelected = data.activityLevel === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => update({ activityLevel: opt.key })}
                  className="active:opacity-80"
                >
                  <Surface
                    variant="secondary"
                    className="py-3 px-4 rounded-xl flex-row items-center gap-3"
                    style={
                      isSelected
                        ? { borderWidth: 2, borderColor: primaryColor }
                        : { borderWidth: 2, borderColor: "transparent" }
                    }
                  >
                    <Text className="text-2xl">{opt.emoji}</Text>
                    <View className="flex-1">
                      <Text
                        className={`text-base font-bold ${isSelected ? "text-primary" : "text-foreground"}`}
                      >
                        {opt.label}
                      </Text>
                      <Text className="text-muted text-xs">
                        {opt.description}
                      </Text>
                    </View>
                  </Surface>
                </Pressable>
              );
            })}
          </View>

          {/* ── Macro Distribution ────────────────── */}
          <Text className="text-foreground text-xl font-bold mb-1">
            Distribuição de Macros 🥩🥑🍚
          </Text>
          <Text className="text-muted text-sm mb-1">
            Proteína / Gordura / Carboidratos
          </Text>
          {data.hasDiabetes && (
            <Text className="text-warning text-xs mb-3">
              ⚠️ Recomendamos Low Carb para diabéticos
            </Text>
          )}

          <View className="gap-3 mb-8">
            {PRESET_KEYS.map((key) => {
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
                <Pressable
                  key={key}
                  onPress={() => update({ macroPreset: key })}
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
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center gap-2">
                        <Text
                          className={`text-base font-bold ${isSelected ? "text-primary" : "text-foreground"}`}
                        >
                          {preset.label}
                        </Text>
                        {isRecommended && (
                          <View className="bg-success/20 px-2 py-0.5 rounded">
                            <Text className="text-success text-xs font-semibold">
                              Recomendado
                            </Text>
                          </View>
                        )}
                      </View>
                      <View className="bg-muted/30 px-2 py-0.5 rounded">
                        <Text className="text-muted text-xs font-semibold">
                          {preset.tag}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-muted text-xs mb-3">
                      {preset.description}
                    </Text>
                    <View className="flex-row justify-between">
                      <View className="items-center flex-1">
                        <Text className="text-foreground text-lg font-bold">
                          {previewMacros.protein}g
                        </Text>
                        <Text className="text-muted text-xs">proteína</Text>
                      </View>
                      <View className="items-center flex-1">
                        <Text className="text-foreground text-lg font-bold">
                          {previewMacros.fat}g
                        </Text>
                        <Text className="text-muted text-xs">gordura</Text>
                      </View>
                      <View className="items-center flex-1">
                        <Text className="text-foreground text-lg font-bold">
                          {previewMacros.carbs}g
                        </Text>
                        <Text className="text-muted text-xs">carbos</Text>
                      </View>
                    </View>
                  </Surface>
                </Pressable>
              );
            })}
          </View>

          {/* ── Summary ──────────────────────────── */}
          <Surface variant="secondary" className="p-5 rounded-2xl gap-3">
            <View className="items-center border-b border-muted/20 pb-3">
              <Text className="text-muted text-sm">Meta Diária</Text>
              <Text className="text-primary text-4xl font-bold">
                {results.calories} kcal
              </Text>
              <Text className="text-muted text-xs mt-1">
                Déficit de {results.deficit} kcal/dia (manutenção:{" "}
                {results.tdee})
              </Text>
            </View>
            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <Text className="text-foreground font-bold text-lg">
                  {results.protein}g
                </Text>
                <Text className="text-muted text-xs">Proteína</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-foreground font-bold text-lg">
                  {results.fat}g
                </Text>
                <Text className="text-muted text-xs">Gordura</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-foreground font-bold text-lg">
                  {results.carbs}g
                </Text>
                <Text className="text-muted text-xs">Carbos</Text>
              </View>
            </View>
            {data.hasDiabetes && data.dailySugarLimitG && (
              <View className="pt-3 border-t border-muted/20">
                <Text className="text-warning text-xs text-center">
                  🩺 Limite de açúcar: {data.dailySugarLimitG}g/dia
                </Text>
              </View>
            )}
          </Surface>
        </View>

        <Button
          size="lg"
          className="h-16 mt-6"
          onPress={handleComplete}
          isDisabled={isSaving}
        >
          {isSaving ? (
            <Spinner color="default" />
          ) : (
            <Button.Label className="text-lg">Começar Agora! 🚀</Button.Label>
          )}
        </Button>
      </View>
    </Container>
  );
}

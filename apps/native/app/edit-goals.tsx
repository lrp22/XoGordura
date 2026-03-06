import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Button, Spinner, Surface, useThemeColor } from "heroui-native";
import { useEffect, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";

import { Container } from "@/components/container";
import { NumberStepper } from "@/components/number-stepper";
import {
  MACRO_PRESETS,
  calcCaloriesFromMacros,
  calcGoals,
  calcMacrosFromSplit,
  type ActivityLevel,
  type MacroPresetKey,
} from "@/lib/calories";
import { queryClient, orpc } from "@/utils/orpc";

const PRESET_KEYS: MacroPresetKey[] = ["moderate", "lower_carb", "higher_carb"];
type ActivePreset = MacroPresetKey | "custom";

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

function detectPreset(
  calories: number,
  protein: number,
  fat: number,
  carbs: number,
): ActivePreset {
  for (const key of PRESET_KEYS) {
    const expected = calcMacrosFromSplit(calories, MACRO_PRESETS[key].split);
    if (
      Math.abs(expected.protein - protein) <= 3 &&
      Math.abs(expected.fat - fat) <= 3 &&
      Math.abs(expected.carbs - carbs) <= 3
    ) {
      return key;
    }
  }
  return "custom";
}

export default function EditGoals() {
  const router = useRouter();
  const primaryColor = useThemeColor("accent");
  const profileQuery = useQuery(orpc.profile.get.queryOptions());

  const [calories, setCalories] = useState<number>(1500);
  const [protein, setProtein] = useState<number>(100);
  const [fat, setFat] = useState<number>(50);
  const [carbs, setCarbs] = useState<number>(150);
  const [activePreset, setActivePreset] = useState<ActivePreset>("custom");
  const [activityLevel, setActivityLevel] =
    useState<ActivityLevel>("sedentary");
  const [hasDiabetes, setHasDiabetes] = useState(false);
  const [dailySugarLimitG, setDailySugarLimitG] = useState<number>(25);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (profileQuery.data && !initialized) {
      const p = profileQuery.data;
      const cal = p.dailyCalorieGoal ?? 1500;
      const pro = p.dailyProteinGoal ?? 100;
      const f = p.dailyFatGoal ?? 50;
      const c = p.dailyCarbsGoal ?? 150;
      setCalories(cal);
      setProtein(pro);
      setFat(f);
      setCarbs(c);
      setActivePreset(detectPreset(cal, pro, f, c));
      setActivityLevel((p.activityLevel as ActivityLevel) ?? "sedentary");
      setHasDiabetes(p.hasDiabetes ?? false);
      setDailySugarLimitG(p.dailySugarLimitG ?? 25);
      setInitialized(true);
    }
  }, [profileQuery.data, initialized]);

  // ── Recalculate calories + macros from profile biometrics ──
  function recalcFromProfile(newLevel: ActivityLevel, preset: ActivePreset) {
    const p = profileQuery.data;
    if (!p?.heightCm || !p?.currentWeightKg || !p?.birthDate) return null;

    const birthYear = Number.parseInt(p.birthDate.split("-")[0]!, 10);
    const resolvedPreset: MacroPresetKey =
      preset !== "custom" ? preset : "moderate";
    const split = MACRO_PRESETS[resolvedPreset].split;

    return calcGoals(
      p.currentWeightKg,
      p.heightCm,
      birthYear,
      (p.gender as "male" | "female") ?? "female",
      newLevel,
      0.2,
      split,
    );
  }

  // ── Activity level change → recalculate ────────────────
  function handleActivityChange(newLevel: ActivityLevel) {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActivityLevel(newLevel);

    const results = recalcFromProfile(newLevel, activePreset);
    if (!results) return;

    setCalories(results.calories);
    setProtein(results.protein);
    setFat(results.fat);
    setCarbs(results.carbs);
  }

  // ── Preset selection ────────────────────────────────────
  function selectPreset(key: MacroPresetKey) {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const macros = calcMacrosFromSplit(calories, MACRO_PRESETS[key].split);
    setProtein(macros.protein);
    setFat(macros.fat);
    setCarbs(macros.carbs);
    setActivePreset(key);
  }

  // ── Calorie change → recalc macros if preset active ────
  function handleCaloriesChange(newCal: number) {
    setCalories(newCal);
    if (activePreset !== "custom") {
      const macros = calcMacrosFromSplit(
        newCal,
        MACRO_PRESETS[activePreset].split,
      );
      setProtein(macros.protein);
      setFat(macros.fat);
      setCarbs(macros.carbs);
    }
  }

  // ── Diabetes toggle — mirrors onboarding logic exactly ─
  function toggleDiabetes(value: boolean) {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setHasDiabetes(value);

    if (value) {
      // Enable diabetes: switch to lower_carb, set sugar limit
      setDailySugarLimitG(25);
      const macros = calcMacrosFromSplit(
        calories,
        MACRO_PRESETS["lower_carb"].split,
      );
      setProtein(macros.protein);
      setFat(macros.fat);
      setCarbs(macros.carbs);
      setActivePreset("lower_carb");
    } else {
      // Disable diabetes: revert to moderate preset
      const macros = calcMacrosFromSplit(
        calories,
        MACRO_PRESETS["moderate"].split,
      );
      setProtein(macros.protein);
      setFat(macros.fat);
      setCarbs(macros.carbs);
      setActivePreset("moderate");
    }
  }

  const macroCalories = calcCaloriesFromMacros(protein, carbs, fat);
  const calorieDiff = macroCalories - calories;

  const saveMutation = useMutation(
    orpc.profile.upsert.mutationOptions({
      onSuccess: async () => {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        await queryClient.invalidateQueries();
        router.back();
      },
    }),
  );

  function handleSave() {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    saveMutation.mutate({
      dailyCalorieGoal: calories,
      dailyProteinGoal: protein,
      dailyCarbsGoal: carbs,
      dailyFatGoal: fat,
      activityLevel,
      hasDiabetes,
      dailySugarLimitG: hasDiabetes ? dailySugarLimitG : null,
    });
  }

  if (profileQuery.isLoading || !initialized) {
    return (
      <Container isScrollable={false}>
        <View className="flex-1 items-center justify-center gap-4">
          <Spinner size="lg" />
          <Text className="text-muted text-lg">Carregando...</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <View className="px-6 pt-4 pb-8 gap-6">
        {/* ── Activity Level ───────────────────── */}
        <View>
          <Text className="text-foreground text-xl font-bold mb-1">
            Nível de Atividade
          </Text>
          <Text className="text-muted text-sm mb-3">
            Recalcula suas calorias automaticamente
          </Text>
          <View className="gap-2">
            {ACTIVITY_OPTIONS.map((opt) => {
              const isSelected = activityLevel === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => handleActivityChange(opt.key)}
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
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={primaryColor}
                      />
                    )}
                  </Surface>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Diabetes Toggle ──────────────────── */}
        <View>
          <Text className="text-foreground text-xl font-bold mb-1">
            Modo Diabetes 🩺
          </Text>
          <Text className="text-muted text-sm mb-3">
            Ativa rastreamento de açúcar e carga glicêmica
          </Text>
          <View className="flex-row gap-3">
            {[
              { value: false, label: "NÃO", emoji: "👍" },
              { value: true, label: "SIM", emoji: "🩺" },
            ].map((opt) => (
              <Pressable
                key={String(opt.value)}
                onPress={() => toggleDiabetes(opt.value)}
                className="flex-1 active:opacity-80"
              >
                <Surface
                  variant="secondary"
                  className="py-5 rounded-xl items-center gap-1"
                  style={
                    hasDiabetes === opt.value
                      ? { borderWidth: 2, borderColor: primaryColor }
                      : { borderWidth: 2, borderColor: "transparent" }
                  }
                >
                  <Text className="text-2xl">{opt.emoji}</Text>
                  <Text
                    className={`font-bold text-sm ${hasDiabetes === opt.value ? "text-primary" : "text-muted"}`}
                  >
                    {opt.label}
                  </Text>
                </Surface>
              </Pressable>
            ))}
          </View>

          {hasDiabetes && (
            <View className="mt-4 gap-2">
              <NumberStepper
                label="Limite diário de açúcar"
                unit="g"
                value={dailySugarLimitG}
                onChange={setDailySugarLimitG}
                min={10}
                max={100}
                step={5}
              />
              <Text className="text-muted text-xs text-center">
                OMS recomenda máx. 25g/dia para diabéticos
              </Text>
              <Surface
                variant="secondary"
                className="p-4 rounded-xl flex-row items-start gap-3 mt-1"
              >
                <Text className="text-2xl">💡</Text>
                <View className="flex-1">
                  <Text className="text-foreground text-sm font-medium mb-1">
                    O que muda com diabetes ativo?
                  </Text>
                  <Text className="text-muted text-xs leading-5">
                    • Rastreamento de açúcar e fibra{"\n"}• Indicador de carga
                    glicêmica{"\n"}• Carboidratos líquidos (carbs - fibra){"\n"}
                    • Distribuição Low Carb aplicada{"\n"}• Dicas da IA
                    adaptadas
                  </Text>
                </View>
              </Surface>
            </View>
          )}
        </View>

        {/* ── Calorie Goal ────────────────────── */}
        <View>
          <Text className="text-foreground text-xl font-bold mb-1">
            Meta Calórica Diária
          </Text>
          <Text className="text-muted text-sm mb-2">
            Ajuste manualmente se desejar
          </Text>
          <NumberStepper
            label="Calorias"
            unit="kcal"
            value={calories}
            onChange={handleCaloriesChange}
            min={800}
            max={5000}
            step={25}
          />
        </View>

        {/* ── Macro Presets ────────────────────── */}
        <View>
          <Text className="text-foreground text-xl font-bold mb-1">
            Distribuição de Macros
          </Text>
          <Text className="text-muted text-sm mb-3">
            Escolha um preset ou ajuste manualmente
          </Text>
          {hasDiabetes && (
            <Text className="text-warning text-xs mb-3">
              ⚠️ Recomendamos Low Carb para diabéticos
            </Text>
          )}
          <View className="flex-row gap-2 mb-4">
            {PRESET_KEYS.map((key) => {
              const preset = MACRO_PRESETS[key];
              const isSelected = activePreset === key;
              const isRecommended = hasDiabetes && key === "lower_carb";
              return (
                <Pressable
                  key={key}
                  onPress={() => selectPreset(key)}
                  className="flex-1 active:opacity-80"
                >
                  <Surface
                    variant="secondary"
                    className="py-3 px-2 rounded-xl items-center"
                    style={
                      isSelected
                        ? { borderWidth: 2, borderColor: primaryColor }
                        : { borderWidth: 2, borderColor: "transparent" }
                    }
                  >
                    <Text
                      className={`text-sm font-bold ${isSelected ? "text-primary" : "text-foreground"}`}
                    >
                      {preset.label}
                    </Text>
                    <Text className="text-muted text-xs mt-0.5">
                      {preset.tag}
                    </Text>
                    {isRecommended && (
                      <View className="bg-success/20 px-1 py-0.5 rounded mt-1">
                        <Text className="text-success" style={{ fontSize: 9 }}>
                          Recomendado
                        </Text>
                      </View>
                    )}
                  </Surface>
                </Pressable>
              );
            })}
            <Pressable className="flex-1" disabled>
              <Surface
                variant="secondary"
                className="py-3 px-2 rounded-xl items-center"
                style={
                  activePreset === "custom"
                    ? { borderWidth: 2, borderColor: primaryColor }
                    : { borderWidth: 2, borderColor: "transparent" }
                }
              >
                <Text
                  className={`text-sm font-bold ${activePreset === "custom" ? "text-primary" : "text-foreground"}`}
                >
                  Custom
                </Text>
                <Text className="text-muted text-xs mt-0.5">Manual</Text>
              </Surface>
            </Pressable>
          </View>
        </View>

        {/* ── Individual Macros ────────────────── */}
        <View className="gap-2">
          <NumberStepper
            label="Proteína"
            unit="g"
            value={protein}
            onChange={(v) => {
              setProtein(v);
              setActivePreset("custom");
            }}
            min={0}
            max={500}
            step={5}
          />
          <NumberStepper
            label="Gordura"
            unit="g"
            value={fat}
            onChange={(v) => {
              setFat(v);
              setActivePreset("custom");
            }}
            min={0}
            max={300}
            step={5}
          />
          <NumberStepper
            label="Carboidratos"
            unit="g"
            value={carbs}
            onChange={(v) => {
              setCarbs(v);
              setActivePreset("custom");
            }}
            min={0}
            max={600}
            step={5}
          />
        </View>

        {/* ── Calorie reconciliation ──────────── */}
        <Surface
          variant="secondary"
          className="p-4 rounded-xl"
          style={
            Math.abs(calorieDiff) > 50
              ? { borderWidth: 1, borderColor: "#F59E0B" }
              : {}
          }
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-muted text-sm">Total dos macros:</Text>
            <Text className="text-foreground text-lg font-bold">
              {macroCalories} kcal
            </Text>
          </View>
          <View className="flex-row items-center justify-between mt-1">
            <Text className="text-muted text-sm">Meta definida:</Text>
            <Text className="text-foreground text-lg font-bold">
              {calories} kcal
            </Text>
          </View>
          {!!(Math.abs(calorieDiff) > 50) && (
            <View className="flex-row items-center gap-2 mt-2 pt-2 border-t border-muted/20">
              <Ionicons name="warning-outline" size={16} color="#F59E0B" />
              <Text className="text-warning text-xs flex-1">
                Diferença de {Math.abs(calorieDiff)} kcal entre a meta e os
                macros. Considere ajustar.
              </Text>
            </View>
          )}
        </Surface>

        {saveMutation.isError && (
          <Text className="text-danger text-base text-center">
            Erro ao salvar. Tente novamente.
          </Text>
        )}

        <Button
          size="lg"
          className="w-full h-16"
          onPress={handleSave}
          isDisabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <Spinner size="sm" color="default" />
          ) : (
            <Button.Label className="text-lg">💾 Salvar Metas</Button.Label>
          )}
        </Button>

        <Button
          size="lg"
          variant="ghost"
          className="w-full h-14"
          onPress={() => router.back()}
        >
          <Button.Label className="text-base">Cancelar</Button.Label>
        </Button>
      </View>
    </Container>
  );
}

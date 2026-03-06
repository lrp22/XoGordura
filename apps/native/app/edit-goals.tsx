import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Button, Spinner, useThemeColor } from "heroui-native";
import { useEffect, useState, useCallback } from "react";
import { Platform, Pressable, Text, View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  FadeInUp,
  LinearTransition,
} from "react-native-reanimated";

import { Container } from "@/components/container";
import { NumberStepper } from "@/components/number-stepper";
import {
  MACRO_PRESETS,
  calcCaloriesFromMacros,
  calcGoals,
  calcMacrosFromSplit,
  calcAge,
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

// FIX 3: deficit options are now surfaced in the UI so users can change them,
// and the saved value is read from the profile instead of being hardcoded.
const DEFICIT_OPTIONS: {
  value: number;
  label: string;
  emoji: string;
  description: string;
}[] = [
  {
    value: 0.1,
    label: "MODERADA",
    emoji: "🐢",
    description: "-10% das calorias",
  },
  {
    value: 0.2,
    label: "AGRESSIVA",
    emoji: "🐇",
    description: "-20% das calorias",
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
  const insets = useSafeAreaInsets();
  const profileQuery = useQuery(orpc.profile.get.queryOptions());

  // ─── State ─────────────────────────────────────────────
  const [calories, setCalories] = useState<number>(1500);
  const [protein, setProtein] = useState<number>(100);
  const [fat, setFat] = useState<number>(50);
  const [carbs, setCarbs] = useState<number>(150);
  const [activePreset, setActivePreset] = useState<ActivePreset>("custom");
  const [activityLevel, setActivityLevel] =
    useState<ActivityLevel>("sedentary");
  // FIX 3: deficit percentage is now state, initialised from the profile
  const [deficitPercentage, setDeficitPercentage] = useState<number>(0.2);
  const [hasDiabetes, setHasDiabetes] = useState(false);
  const [dailySugarLimitG, setDailySugarLimitG] = useState<number>(25);
  const [initialized, setInitialized] = useState(false);

  // ─── Initialization ────────────────────────────────────
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
      setActivityLevel((p.activityLevel as ActivityLevel) ?? "sedentary");
      // FIX 3: read the stored deficit — fall back to 0.2 for existing users
      // who were saved before this field existed
      setDeficitPercentage(p.deficitPercentage ?? 0.2);
      setHasDiabetes(p.hasDiabetes ?? false);
      setDailySugarLimitG(p.dailySugarLimitG ?? 25);
      setActivePreset(detectPreset(cal, pro, f, c));
      setInitialized(true);
    }
  }, [profileQuery.data, initialized]);

  // ─── Recalculation Logic ───────────────────────────────
  // FIX 3: recalcFromProfile now uses the actual deficitPercentage from state
  // instead of the hardcoded 0.2 that was here before.
  const recalcFromProfile = useCallback(
    (newLevel: ActivityLevel, preset: ActivePreset, deficit: number) => {
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
        deficit, // ← was hardcoded 0.2
        split,
      );
    },
    [profileQuery.data],
  );

  // ─── Handlers ──────────────────────────────────────────
  function handleActivityChange(newLevel: ActivityLevel) {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActivityLevel(newLevel);

    const results = recalcFromProfile(
      newLevel,
      activePreset,
      deficitPercentage,
    );
    if (results) {
      setCalories(results.calories);
      setProtein(results.protein);
      setFat(results.fat);
      setCarbs(results.carbs);
    }
  }

  // FIX 3: changing the deficit recalculates goals immediately
  function handleDeficitChange(newDeficit: number) {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDeficitPercentage(newDeficit);

    const results = recalcFromProfile(activityLevel, activePreset, newDeficit);
    if (results) {
      setCalories(results.calories);
      setProtein(results.protein);
      setFat(results.fat);
      setCarbs(results.carbs);
    }
  }

  function selectPreset(key: MacroPresetKey) {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const macros = calcMacrosFromSplit(calories, MACRO_PRESETS[key].split);
    setProtein(macros.protein);
    setFat(macros.fat);
    setCarbs(macros.carbs);
    setActivePreset(key);
  }

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

  function toggleDiabetes(value: boolean) {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHasDiabetes(value);

    if (value) {
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

  // ─── Save Mutation ─────────────────────────────────────
  const saveMutation = useMutation(
    orpc.profile.upsert.mutationOptions({
      onSuccess: async () => {
        if (Platform.OS !== "web")
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await queryClient.invalidateQueries();
        router.back();
      },
    }),
  );

  function handleSave() {
    saveMutation.mutate({
      dailyCalorieGoal: calories,
      dailyProteinGoal: protein,
      dailyCarbsGoal: carbs,
      dailyFatGoal: fat,
      activityLevel,
      // FIX 3: persist the (possibly changed) deficit so future recalcs are correct
      deficitPercentage,
      hasDiabetes,
      dailySugarLimitG: hasDiabetes ? dailySugarLimitG : null,
    });
  }

  const macroCalories = calcCaloriesFromMacros(protein, carbs, fat);
  const calorieDiff = macroCalories - calories;

  if (profileQuery.isLoading || !initialized) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Spinner size="lg" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        <View className="px-6 pt-6 gap-8">
          {/* ── Section: Activity ───────────────── */}
          <Animated.View
            entering={FadeInDown.delay(100)}
            layout={LinearTransition}
          >
            <Text className="text-foreground text-xs font-bold uppercase tracking-wider mb-4 px-1">
              Nível de Atividade
            </Text>
            <View className="gap-2">
              {ACTIVITY_OPTIONS.map((opt) => {
                const isSelected = activityLevel === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => handleActivityChange(opt.key)}
                  >
                    <View
                      className={`p-4 rounded-3xl flex-row items-center gap-4 border-2 transition-colors ${
                        isSelected
                          ? "bg-card border-primary"
                          : "bg-muted/30 border-transparent"
                      }`}
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
                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color="#cb6441"
                        />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* ── Section: Deficit ────────────────── */}
          {/* FIX 3: deficit selector is now shown so users can change it */}
          <Animated.View
            entering={FadeInDown.delay(160)}
            layout={LinearTransition}
          >
            <Text className="text-foreground text-xs font-bold uppercase tracking-wider mb-4 px-1">
              Intensidade do Déficit
            </Text>
            <View className="flex-row gap-3">
              {DEFICIT_OPTIONS.map((opt) => {
                const isSelected = deficitPercentage === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => handleDeficitChange(opt.value)}
                    className="flex-1"
                  >
                    <View
                      className={`py-5 rounded-3xl items-center border-2 transition-colors ${
                        isSelected
                          ? "bg-card border-primary"
                          : "bg-muted/30 border-transparent"
                      }`}
                    >
                      <Text className="text-xl mb-1">{opt.emoji}</Text>
                      <Text
                        className={`text-xs font-black tracking-widest ${
                          isSelected ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {opt.label}
                      </Text>
                      <Text className="text-muted-foreground text-[10px] mt-1">
                        {opt.description}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* ── Section: Diabetes ───────────────── */}
          <Animated.View
            entering={FadeInDown.delay(220)}
            layout={LinearTransition}
          >
            <Text className="text-foreground text-xs font-bold uppercase tracking-wider mb-4 px-1">
              Monitoramento de Saúde 🩺
            </Text>
            <View className="flex-row gap-3">
              {[
                { val: false, label: "PADRÃO", emoji: "⚖️" },
                { val: true, label: "DIABETES", emoji: "🩺" },
              ].map((item) => (
                <Pressable
                  key={String(item.val)}
                  onPress={() => toggleDiabetes(item.val)}
                  className="flex-1"
                >
                  <View
                    className={`py-5 rounded-3xl items-center border-2 transition-colors ${
                      hasDiabetes === item.val
                        ? "bg-card border-primary"
                        : "bg-muted/30 border-transparent"
                    }`}
                  >
                    <Text className="text-xl mb-1">{item.emoji}</Text>
                    <Text
                      className={`text-xs font-black tracking-widest ${
                        hasDiabetes === item.val
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {item.label}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>

            {!!hasDiabetes && (
              <Animated.View entering={FadeInUp} className="mt-4 gap-4">
                <View className="bg-card rounded-3xl p-6 border border-border">
                  <NumberStepper
                    label="Limite de Açúcar"
                    unit="g"
                    value={dailySugarLimitG}
                    onChange={setDailySugarLimitG}
                    min={10}
                    max={100}
                    step={5}
                  />
                  <Text className="text-muted-foreground text-[10px] text-center uppercase tracking-widest mt-2">
                    OMS recomenda máximo de 25g/dia
                  </Text>
                </View>
              </Animated.View>
            )}
          </Animated.View>

          {/* ── Section: Calorie Goal ────────────── */}
          <Animated.View entering={FadeInDown.delay(300)}>
            <Text className="text-foreground text-xs font-bold uppercase tracking-wider mb-4 px-1">
              Meta Energética
            </Text>
            <View className="bg-card rounded-3xl p-8 border border-border items-center">
              <NumberStepper
                label="Calorias Diárias"
                unit="kcal"
                value={calories}
                onChange={handleCaloriesChange}
                min={800}
                max={5000}
                step={25}
              />
            </View>
          </Animated.View>

          {/* ── Section: Macros ──────────────────── */}
          <Animated.View entering={FadeInDown.delay(400)}>
            <Text className="text-foreground text-xs font-bold uppercase tracking-wider mb-4 px-1">
              Distribuição de Macronutrientes
            </Text>
            <View className="flex-row gap-2 mb-4">
              {PRESET_KEYS.map((key) => {
                const isSelected = activePreset === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => selectPreset(key)}
                    className="flex-1"
                  >
                    <View
                      className={`py-3 rounded-2xl items-center border-2 ${
                        isSelected
                          ? "bg-card border-primary"
                          : "bg-muted/30 border-transparent"
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-black tracking-tighter ${
                          isSelected ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {MACRO_PRESETS[key].label.toUpperCase()}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
              <View
                className={`flex-1 py-3 rounded-2xl items-center border-2 ${
                  activePreset === "custom"
                    ? "bg-card border-primary"
                    : "bg-muted/30 border-transparent"
                }`}
              >
                <Text
                  className={`text-[10px] font-black tracking-tighter ${
                    activePreset === "custom"
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  MANUAL
                </Text>
              </View>
            </View>

            <View className="bg-card rounded-3xl p-6 gap-2 border border-border">
              <NumberStepper
                label="Proteína"
                unit="g"
                value={protein}
                onChange={(v) => {
                  setProtein(v);
                  setActivePreset("custom");
                }}
                min={0}
                max={400}
                step={5}
              />
              <View className="h-px bg-border my-2" />
              <NumberStepper
                label="Gordura"
                unit="g"
                value={fat}
                onChange={(v) => {
                  setFat(v);
                  setActivePreset("custom");
                }}
                min={0}
                max={200}
                step={5}
              />
              <View className="h-px bg-border my-2" />
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
          </Animated.View>

          {/* ── Section: Summary ─────────────────── */}
          <Animated.View entering={FadeInUp.delay(500)}>
            <View
              className={`p-6 rounded-3xl border-2 ${
                Math.abs(calorieDiff) > 50
                  ? "border-warning/40 bg-warning/5"
                  : "border-primary/20 bg-primary/5"
              }`}
            >
              <View className="flex-row justify-between items-center">
                <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
                  Total Macros
                </Text>
                <Text className="text-foreground font-bold text-xl">
                  {macroCalories} kcal
                </Text>
              </View>
              <View className="flex-row justify-between items-center mt-2">
                <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
                  Meta Definida
                </Text>
                <Text className="text-foreground font-bold text-xl">
                  {calories} kcal
                </Text>
              </View>

              {!!(Math.abs(calorieDiff) > 50) && (
                <View className="flex-row items-start gap-3 mt-4 pt-4 border-t border-warning/20">
                  <Ionicons name="warning" size={18} color="#f59e0b" />
                  <Text className="text-warning text-xs font-medium flex-1 leading-4">
                    A soma dos macros diverge da meta em {Math.abs(calorieDiff)}{" "}
                    kcal. Ajuste os valores para maior precisão.
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* ── Actions ─────────────────────────── */}
          <View className="gap-3 mt-4">
            {!!saveMutation.isError && (
              <Text className="text-danger text-center font-bold mb-2">
                Erro ao salvar. Tente novamente.
              </Text>
            )}
            <Button
              size="lg"
              className="h-16 rounded-3xl bg-primary"
              onPress={handleSave}
              isDisabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <Spinner color="primary" />
              ) : (
                <Button.Label className="text-lg font-bold text-white">
                  💾 Salvar Alterações
                </Button.Label>
              )}
            </Button>

            <Button
              variant="ghost"
              size="lg"
              className="h-14"
              onPress={() => router.back()}
            >
              <Button.Label className="text-muted-foreground font-bold">
                Cancelar
              </Button.Label>
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

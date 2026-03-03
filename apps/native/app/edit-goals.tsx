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
  calcMacrosFromSplit,
  type MacroPresetKey,
} from "@/lib/calories";
import { queryClient, orpc } from "@/utils/orpc";

const PRESET_KEYS: MacroPresetKey[] = ["moderate", "lower_carb", "higher_carb"];

type ActivePreset = MacroPresetKey | "custom";

// ─── Detect which preset matches current macros ─────────
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
  const [initialized, setInitialized] = useState(false);

  // Sync from server once
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
      setInitialized(true);
    }
  }, [profileQuery.data, initialized]);

  // ── Preset selection: recalc macros from calories ──
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

  // ── When calories change, recalc macros if a preset is active ──
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

  // ── When individual macros change, switch to custom ──
  function handleProteinChange(v: number) {
    setProtein(v);
    setActivePreset("custom");
  }
  function handleFatChange(v: number) {
    setFat(v);
    setActivePreset("custom");
  }
  function handleCarbsChange(v: number) {
    setCarbs(v);
    setActivePreset("custom");
  }

  const macroCalories = calcCaloriesFromMacros(protein, carbs, fat);
  const calorieDiff = macroCalories - calories;

  // ── Save ────────────────────────────────────────────
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
        {/* ── Calorie Goal ────────────────────── */}
        <View>
          <Text className="text-foreground text-xl font-bold mb-1">
            Meta Calórica Diária
          </Text>
          <Text className="text-muted text-sm mb-2">
            Ajuste suas calorias totais por dia
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

          <View className="flex-row gap-2 mb-4">
            {PRESET_KEYS.map((key) => {
              const preset = MACRO_PRESETS[key];
              const isSelected = activePreset === key;
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
                  </Surface>
                </Pressable>
              );
            })}

            {/* Custom indicator */}
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

        {/* ── Individual Macro Inputs ─────────── */}
        <View className="gap-2">
          <NumberStepper
            label="Proteína"
            unit="g"
            value={protein}
            onChange={handleProteinChange}
            min={0}
            max={500}
            step={5}
          />
          <NumberStepper
            label="Gordura"
            unit="g"
            value={fat}
            onChange={handleFatChange}
            min={0}
            max={300}
            step={5}
          />
          <NumberStepper
            label="Carboidratos"
            unit="g"
            value={carbs}
            onChange={handleCarbsChange}
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
          {Math.abs(calorieDiff) > 50 && (
            <View className="flex-row items-center gap-2 mt-2 pt-2 border-t border-muted/20">
              <Ionicons name="warning-outline" size={16} color="#F59E0B" />
              <Text className="text-warning text-xs flex-1">
                Diferença de {Math.abs(calorieDiff)} kcal entre a meta e os
                macros. Considere ajustar.
              </Text>
            </View>
          )}
        </Surface>

        {/* ── Error ───────────────────────────── */}
        {saveMutation.isError && (
          <Text className="text-danger text-base text-center">
            Erro ao salvar. Tente novamente.
          </Text>
        )}

        {/* ── Save ────────────────────────────── */}
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

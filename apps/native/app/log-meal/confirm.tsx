import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Spinner } from "heroui-native";
import { useCallback, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";

import { GlycemicBadge } from "@/components/glycemic-badge";
import { type AnalyzedItem, useLogMeal } from "@/contexts/log-meal-context";
import { getLocalToday, getMealTypeLabel } from "@/lib/date";
import { queryClient, orpc } from "@/utils/orpc";
import { ringColors } from "@/constants/ring-colors";

// ─── Confidence badge ────────────────────────────────────
function ConfidenceBadge({ level }: { level: string }) {
  const configs: Record<string, { bg: string; text: string; label: string }> = {
    high: { bg: "bg-success/15", text: "text-success", label: "Alta" },
    medium: { bg: "bg-warning/15", text: "text-warning", label: "Média" },
    low: { bg: "bg-danger/15", text: "text-danger", label: "Baixa" },
  };
  const c = configs[level] ?? configs.medium;
  return (
    <View
      className={`${c.bg} px-3 py-1.5 rounded-full flex-row items-center gap-1.5`}
    >
      <View className={`w-1.5 h-1.5 rounded-full ${c.bg.replace("/15", "")}`} />
      <Text className={`${c.text} text-xs font-bold`}>Precisão {c.label}</Text>
    </View>
  );
}

// ─── Source dots ─────────────────────────────────────────
function SourceDots({ sources }: { sources: string[] }) {
  const LABELS: Record<string, string> = {
    taco: "TACO",
    fatsecret: "FS",
    web: "Web",
    ai_estimate: "IA",
  };
  return (
    <View className="flex-row gap-1.5 flex-wrap">
      {sources.map((source) => (
        <View key={source} className="bg-muted/40 px-2 py-0.5 rounded-md">
          <Text className="text-muted-foreground text-xs font-medium">
            {LABELS[source] ?? source}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── Macro pill ──────────────────────────────────────────
function MacroPill({
  label,
  value,
  color,
  bold,
}: {
  label: string;
  value: string;
  color?: string;
  bold?: boolean;
}) {
  return (
    <View className="items-center gap-0.5">
      <Text
        className={`text-base ${bold ? "text-primary" : "text-foreground"} font-bold`}
      >
        {value}
      </Text>
      <Text className="text-muted-foreground text-xs">{label}</Text>
    </View>
  );
}

// ─── Food item card ──────────────────────────────────────
function FoodItemCard({
  item,
  index,
  onRemove,
  showDiabetesInfo,
}: {
  item: AnalyzedItem;
  index: number;
  onRemove: () => void;
  showDiabetesInfo: boolean;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 70)
        .duration(400)
        .springify()}
    >
      <View className="bg-card rounded-3xl p-4 border border-border">
        {/* Top row */}
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <View className="flex-row items-center gap-2 flex-wrap">
              <Text className="text-foreground text-base font-bold">
                {item.name}
              </Text>
              {showDiabetesInfo && (
                <GlycemicBadge level={item.glycemicLoad} compact />
              )}
            </View>
            <Text className="text-muted-foreground text-sm mt-0.5">
              {item.portion}
            </Text>
            <View className="mt-2">
              <SourceDots sources={item.sourcesUsed} />
            </View>
          </View>

          {/* Calories + remove */}
          <View className="items-end gap-2">
            <View className="items-end">
              <Text className="text-foreground text-2xl font-bold">
                {item.calories}
              </Text>
              <Text className="text-muted-foreground text-xs">kcal</Text>
            </View>
            <Pressable
              onPress={onRemove}
              hitSlop={12}
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              className="p-1.5 rounded-xl bg-danger/10"
            >
              <Ionicons name="trash-outline" size={15} color="#ef4444" />
            </Pressable>
          </View>
        </View>

        {/* Macros */}
        <View className="flex-row gap-4 mt-3 pt-3 border-t border-border flex-wrap">
          <Text className="text-muted-foreground text-xs font-medium">
            P: {item.proteinG.toFixed(1)}g
          </Text>
          <Text className="text-muted-foreground text-xs font-medium">
            C: {item.carbsG.toFixed(1)}g
          </Text>
          <Text className="text-muted-foreground text-xs font-medium">
            G: {item.fatG.toFixed(1)}g
          </Text>
          {showDiabetesInfo && (
            <>
              <Text className="text-muted-foreground text-xs font-medium">
                Fi: {item.fiberG.toFixed(1)}g
              </Text>
              <Text className="text-muted-foreground text-xs font-medium">
                Aç: {item.sugarG.toFixed(1)}g
              </Text>
              <Text className="text-primary text-xs font-bold">
                Net: {item.netCarbsG.toFixed(1)}g
              </Text>
            </>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Main screen ─────────────────────────────────────────
export default function LogMealConfirm() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = ringColors[scheme === "dark" ? "dark" : "light"];

  const { mealType, voiceTranscript, analysisResult, reset } = useLogMeal();
  const profileQuery = useQuery(orpc.profile.get.queryOptions());
  const isDiabetic = profileQuery.data?.hasDiabetes ?? false;

  const [items, setItems] = useState<AnalyzedItem[]>(
    () => analysisResult?.items ?? [],
  );

  const totals = useMemo(
    () =>
      items.reduce(
        (acc, item) => ({
          calories: acc.calories + item.calories,
          proteinG: acc.proteinG + item.proteinG,
          carbsG: acc.carbsG + item.carbsG,
          fatG: acc.fatG + item.fatG,
          fiberG: acc.fiberG + item.fiberG,
          sugarG: acc.sugarG + item.sugarG,
        }),
        { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0, sugarG: 0 },
      ),
    [items],
  );

  const netCarbsG = Math.max(0, totals.carbsG - totals.fiberG);

  const handleRemoveItem = useCallback((index: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const saveMutation = useMutation(
    orpc.meal.create.mutationOptions({
      onSuccess: async () => {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        await queryClient.invalidateQueries();
        reset();
        router.dismissAll();
      },
    }),
  );

  function handleSave() {
    if (items.length === 0 || !analysisResult) return;
    saveMutation.mutate({
      date: getLocalToday(),
      mealType: mealType as "breakfast" | "lunch" | "dinner" | "snack",
      voiceTranscript,
      items: items.map((item) => ({
        name: item.name,
        portion: item.portion,
        calories: item.calories,
        proteinG: item.proteinG,
        carbsG: item.carbsG,
        fatG: item.fatG,
        fiberG: item.fiberG,
        sugarG: item.sugarG,
        glycemicLoad: item.glycemicLoad,
        source: item.bestSource as "taco" | "fatsecret" | "web" | "ai_estimate",
      })),
      totalCalories: Math.round(totals.calories),
      totalProteinG: +totals.proteinG.toFixed(1),
      totalCarbsG: +totals.carbsG.toFixed(1),
      totalFatG: +totals.fatG.toFixed(1),
      totalFiberG: +totals.fiberG.toFixed(1),
      totalSugarG: +totals.sugarG.toFixed(1),
      confidence: analysisResult.overallConfidence,
      aiTip: analysisResult.tip,
      aiRawResponse: JSON.stringify(analysisResult),
    });
  }

  // ─── No result fallback ───────────────────────────────
  if (!analysisResult) {
    return (
      <View
        className="flex-1 bg-background items-center justify-center px-6 gap-4"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-5xl">🤷</Text>
        <Text className="text-foreground text-xl font-bold text-center">
          Nenhum resultado encontrado
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          className="bg-primary px-6 py-3 rounded-2xl"
        >
          <Text className="text-primary-foreground font-semibold">Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const highGIItems = isDiabetic
    ? items.filter((i) => i.glycemicLoad === "high")
    : [];

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* ── Header ───────────────────────────── */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        className="px-6 pt-4 pb-3 flex-row items-center justify-between"
      >
        <View>
          <Text className="text-foreground text-3xl font-bold">
            {getMealTypeLabel(mealType)}
          </Text>
          <Text className="text-muted-foreground text-sm mt-0.5">
            {items.length} {items.length === 1 ? "item" : "itens"} identificados
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <ConfidenceBadge level={analysisResult.overallConfidence} />
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            className="w-9 h-9 rounded-2xl bg-muted/30 items-center justify-center ml-1"
          >
            <Ionicons name="close" size={18} color="#6b7280" />
          </Pressable>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        <View className="px-6 gap-4">
          {/* ── AI tip ───────────────────────────── */}
          {analysisResult.tip && (
            <Animated.View entering={FadeInDown.delay(80).duration(400)}>
              <View className="bg-card rounded-3xl p-4 flex-row items-start gap-3 border border-border">
                <Text className="text-xl mt-0.5">💡</Text>
                <Text className="text-foreground text-sm flex-1 leading-5">
                  {analysisResult.tip}
                </Text>
              </View>
            </Animated.View>
          )}

          {/* ── Diabetic high-GI warning ──────────── */}
          {highGIItems.length > 0 && (
            <Animated.View entering={FadeInDown.delay(120).duration(400)}>
              <View className="bg-danger/10 rounded-3xl p-4 flex-row items-start gap-3 border border-danger/30">
                <Text className="text-xl mt-0.5">🩺</Text>
                <View className="flex-1">
                  <Text className="text-danger text-sm font-bold mb-1">
                    Índice glicêmico alto
                  </Text>
                  <Text className="text-muted-foreground text-xs leading-5">
                    {highGIItems.map((i) => i.name).join(", ")}{" "}
                    {highGIItems.length === 1 ? "pode causar" : "podem causar"}{" "}
                    picos de glicose. Combine com fibras para reduzir o impacto.
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* ── Food items ───────────────────────── */}
          <View className="gap-3">
            {items.map((item, index) => (
              <FoodItemCard
                key={`${item.name}-${index}`}
                item={item}
                index={index}
                onRemove={() => handleRemoveItem(index)}
                showDiabetesInfo={isDiabetic}
              />
            ))}
          </View>

          {/* ── Empty state ──────────────────────── */}
          {items.length === 0 && (
            <Animated.View entering={FadeIn.duration(400)}>
              <View className="bg-card rounded-3xl p-10 items-center gap-3 border border-border">
                <Text className="text-5xl">🤷</Text>
                <Text className="text-foreground text-lg font-bold text-center">
                  Todos os itens removidos
                </Text>
                <Text className="text-muted-foreground text-sm text-center">
                  Volte para analisar novamente
                </Text>
              </View>
            </Animated.View>
          )}

          {/* ── Totals card ──────────────────────── */}
          {items.length > 0 && (
            <Animated.View
              entering={FadeInUp.delay(items.length * 70 + 80)
                .duration(500)
                .springify()}
            >
              <View className="bg-card rounded-3xl p-5 border-2 border-primary/30">
                {/* Calorie hero */}
                <View className="flex-row items-center justify-between mb-4">
                  <Text
                    className="text-foreground text-base font-bold uppercase tracking-wider"
                    style={{ fontSize: 11 }}
                  >
                    Total da refeição
                  </Text>
                  <View className="bg-primary/10 px-4 py-1.5 rounded-2xl">
                    <Text className="text-primary text-2xl font-bold">
                      {Math.round(totals.calories)} kcal
                    </Text>
                  </View>
                </View>

                {/* Main macros */}
                <View className="flex-row justify-around py-3 bg-muted/20 rounded-2xl">
                  <MacroPill
                    label="Proteína"
                    value={`${totals.proteinG.toFixed(1)}g`}
                  />
                  <View className="w-px bg-border" />
                  <MacroPill
                    label="Carboidratos"
                    value={`${totals.carbsG.toFixed(1)}g`}
                  />
                  <View className="w-px bg-border" />
                  <MacroPill
                    label="Gordura"
                    value={`${totals.fatG.toFixed(1)}g`}
                  />
                </View>

                {/* Diabetic extras */}
                {isDiabetic && (
                  <View className="flex-row justify-around py-3 mt-2 border-t border-border">
                    <MacroPill
                      label="Açúcar"
                      value={`${totals.sugarG.toFixed(1)}g`}
                    />
                    <MacroPill
                      label="Fibra"
                      value={`${totals.fiberG.toFixed(1)}g`}
                    />
                    <MacroPill
                      label="Carb Líq."
                      value={`${netCarbsG.toFixed(1)}g`}
                      bold
                    />
                  </View>
                )}
              </View>
            </Animated.View>
          )}

          {/* ── Save error ───────────────────────── */}
          {saveMutation.isError && (
            <Animated.View entering={FadeIn.duration(300)}>
              <View className="bg-destructive/10 rounded-2xl p-4 flex-row items-center gap-3 border border-destructive/30">
                <Ionicons name="alert-circle" size={18} color="#ef4444" />
                <Text className="text-destructive text-sm flex-1">
                  {saveMutation.error?.message ??
                    "Erro ao salvar. Tente novamente."}
                </Text>
              </View>
            </Animated.View>
          )}
        </View>
      </ScrollView>

      {/* ── Save button (sticky footer) ──────── */}
      <Animated.View
        entering={FadeInUp.delay(300).duration(500).springify()}
        style={{ paddingBottom: insets.bottom + 16 }}
        className="px-6 pt-3 bg-background border-t border-border"
      >
        <Pressable
          onPress={handleSave}
          disabled={items.length === 0 || saveMutation.isPending}
          style={({ pressed }) => ({
            opacity: items.length === 0 ? 0.4 : pressed ? 0.8 : 1,
          })}
        >
          <View className="bg-primary rounded-3xl h-16 items-center justify-center flex-row gap-3">
            {saveMutation.isPending ? (
              <Spinner size="sm" color="default" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color="#fff" />
                <Text
                  style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}
                >
                  Salvar Refeição
                </Text>
              </>
            )}
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

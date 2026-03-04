import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Button, Spinner, Surface, useThemeColor } from "heroui-native";
import { useCallback, useMemo, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";

import { Container } from "@/components/container";
import { type AnalyzedItem, useLogMeal } from "@/contexts/log-meal-context";
import { getLocalToday, getMealTypeLabel } from "@/lib/date";
import { queryClient, orpc } from "@/utils/orpc";

// ─── Confidence badge ────────────────────────────────────
function ConfidenceBadge({ level }: { level: string }) {
  const colors: Record<string, { bg: string; text: string; label: string }> = {
    high: { bg: "bg-success/20", text: "text-success", label: "Alta" },
    medium: { bg: "bg-warning/20", text: "text-warning", label: "Média" },
    low: { bg: "bg-danger/20", text: "text-danger", label: "Baixa" },
  };
  const c = colors[level] ?? colors.medium;

  return (
    <View className={`${c.bg} px-3 py-1 rounded-full`}>
      <Text className={`${c.text} text-xs font-semibold`}>
        Precisão: {c.label}
      </Text>
    </View>
  );
}

// ─── Source indicator dots ───────────────────────────────
function SourceDots({ sources }: { sources: string[] }) {
  const LABELS: Record<string, string> = {
    taco: "TACO",
    fatsecret: "FS",
    web: "Web",
    ai_estimate: "IA",
  };

  return (
    <View className="flex-row gap-1 flex-wrap">
      {sources.map((source) => (
        <View key={source} className="bg-muted/50 px-2 py-0.5 rounded">
          <Text className="text-muted text-xs">{LABELS[source] ?? source}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Food item card ──────────────────────────────────────
function FoodItemCard({
  item,
  onRemove,
}: {
  item: AnalyzedItem;
  onRemove: () => void;
}) {
  const dangerColor = useThemeColor("danger");

  return (
    <Surface variant="secondary" className="p-4 rounded-xl">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-foreground text-lg font-semibold">
            {item.name}
          </Text>
          <Text className="text-muted text-sm mt-0.5">{item.portion}</Text>
          <View className="mt-2">
            <SourceDots sources={item.sourcesUsed} />
          </View>
        </View>

        <View className="items-end gap-2">
          <Text className="text-foreground text-xl font-bold">
            {item.calories}
          </Text>
          <Text className="text-muted text-xs">kcal</Text>
          <Pressable
            onPress={onRemove}
            hitSlop={12}
            className="mt-1 p-1 active:opacity-50"
          >
            <Ionicons name="trash-outline" size={18} color={dangerColor} />
          </Pressable>
        </View>
      </View>

      {/* Macros row */}
      <View className="flex-row gap-4 mt-3 pt-3 border-t border-muted/20">
        <Text className="text-muted text-xs">
          P: {item.proteinG.toFixed(1)}g
        </Text>
        <Text className="text-muted text-xs">C: {item.carbsG.toFixed(1)}g</Text>
        <Text className="text-muted text-xs">G: {item.fatG.toFixed(1)}g</Text>
      </View>
    </Surface>
  );
}

// ─── Main confirm screen ─────────────────────────────────
export default function LogMealConfirm() {
  const router = useRouter();
  const { mealType, voiceTranscript, analysisResult, reset } = useLogMeal();

  // Local state for editable items
  const [items, setItems] = useState<AnalyzedItem[]>(
    () => analysisResult?.items ?? [],
  );

  // Recalculate totals from remaining items
  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        proteinG: acc.proteinG + item.proteinG,
        carbsG: acc.carbsG + item.carbsG,
        fatG: acc.fatG + item.fatG,
      }),
      { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
    );
  }, [items]);

  // Remove item handler
  const handleRemoveItem = useCallback((index: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Save mutation
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

    const today = getLocalToday();

    saveMutation.mutate({
      date: today,
      mealType: mealType as "breakfast" | "lunch" | "dinner" | "snack",
      voiceTranscript,
      items: items.map((item) => ({
        name: item.name,
        portion: item.portion,
        calories: item.calories,
        proteinG: item.proteinG,
        carbsG: item.carbsG,
        fatG: item.fatG,
        source: item.bestSource as "taco" | "fatsecret" | "web" | "ai_estimate",
      })),
      totalCalories: Math.round(totals.calories),
      totalProteinG: +totals.proteinG.toFixed(1),
      totalCarbsG: +totals.carbsG.toFixed(1),
      totalFatG: +totals.fatG.toFixed(1),
      confidence: analysisResult.overallConfidence,
      aiTip: analysisResult.tip,
      aiRawResponse: JSON.stringify(analysisResult),
    });
  }

  // Early return AFTER all hooks
  if (!analysisResult) {
    return (
      <Container isScrollable={false}>
        <View className="flex-1 items-center justify-center px-6 gap-4">
          <Text className="text-foreground text-xl">
            Nenhum resultado encontrado
          </Text>
          <Button onPress={() => router.back()}>
            <Button.Label>Voltar</Button.Label>
          </Button>
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <View className="px-6 pt-4 pb-8 gap-5">
        {/* ── Header ──────────────────────────── */}
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-foreground text-2xl font-bold">
              {getMealTypeLabel(mealType)}
            </Text>
            <Text className="text-muted text-sm mt-1">
              {items.length} {items.length === 1 ? "item" : "itens"}{" "}
              identificados
            </Text>
          </View>
          <ConfidenceBadge level={analysisResult.overallConfidence} />
        </View>

        {/* ── AI Tip ──────────────────────────── */}
        {analysisResult.tip && (
          <Surface
            variant="secondary"
            className="p-4 rounded-xl flex-row items-center gap-3"
          >
            <Text className="text-2xl">💡</Text>
            <Text className="text-foreground text-base flex-1">
              {analysisResult.tip}
            </Text>
          </Surface>
        )}

        {/* ── Food items ──────────────────────── */}
        <View className="gap-3">
          {items.map((item, index) => (
            <FoodItemCard
              key={`${item.name}-${index}`}
              item={item}
              onRemove={() => handleRemoveItem(index)}
            />
          ))}
        </View>

        {items.length === 0 && (
          <Surface variant="secondary" className="p-8 rounded-xl items-center">
            <Text className="text-4xl mb-3">🤷</Text>
            <Text className="text-foreground text-lg font-medium">
              Todos os itens foram removidos
            </Text>
            <Text className="text-muted text-base mt-1">
              Volte para analisar novamente
            </Text>
          </Surface>
        )}

        {/* ── Totals ──────────────────────────── */}
        {items.length > 0 && (
          <Surface
            variant="secondary"
            className="p-5 rounded-xl"
            style={{ borderWidth: 2, borderColor: "#4CAF50" }}
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-foreground text-lg font-bold">Total</Text>
              <Text className="text-foreground text-3xl font-bold">
                {Math.round(totals.calories)} kcal
              </Text>
            </View>
            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-foreground text-base font-semibold">
                  {totals.proteinG.toFixed(1)}g
                </Text>
                <Text className="text-muted text-xs">Proteína</Text>
              </View>
              <View className="items-center">
                <Text className="text-foreground text-base font-semibold">
                  {totals.carbsG.toFixed(1)}g
                </Text>
                <Text className="text-muted text-xs">Carboidratos</Text>
              </View>
              <View className="items-center">
                <Text className="text-foreground text-base font-semibold">
                  {totals.fatG.toFixed(1)}g
                </Text>
                <Text className="text-muted text-xs">Gordura</Text>
              </View>
            </View>
          </Surface>
        )}

        {/* ── Error ───────────────────────────── */}
        {saveMutation.isError && (
          <Text className="text-danger text-base text-center">
            Erro ao salvar: {saveMutation.error?.message ?? "Tente novamente"}
          </Text>
        )}

        {/* ── Save button ─────────────────────── */}
        <Button
          size="lg"
          className="w-full h-16"
          onPress={handleSave}
          isDisabled={items.length === 0 || saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <Spinner size="sm" color="default" />
          ) : (
            <Button.Label className="text-lg">✅ Salvar Refeição</Button.Label>
          )}
        </Button>
      </View>
    </Container>
  );
}

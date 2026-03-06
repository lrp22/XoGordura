import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Card, Spinner, Surface } from "heroui-native";
import { Platform, Pressable, Text, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";

import { CalorieRing } from "@/components/calorie-ring";
import { MacroRing } from "@/components/macro-ring";
import { Container } from "@/components/container";
import { getLocalToday, getMealTypeEmoji, getMealTypeLabel } from "@/lib/date";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";
import { ringColors } from "@/constants/ring-colors";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const firstName = session?.user?.name?.split(" ")[0] ?? "";

  const scheme = useColorScheme();
  const colors = ringColors[scheme === "dark" ? "dark" : "light"];

  const profileQuery = useQuery(orpc.profile.get.queryOptions());
  const today = getLocalToday();
  const mealsQuery = useQuery(
    orpc.meal.getByDate.queryOptions({ input: { date: today } }),
  );

  const suggestMutation = useMutation(orpc.meal.suggestSnack.mutationOptions());

  const profile = profileQuery.data;
  const isDiabetic = profile?.hasDiabetes ?? false;
  const meals = mealsQuery.data ?? [];

  // ─── Calculate Consumed ─────────────────────────
  const consumed = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.totalCalories,
      protein: acc.protein + m.totalProteinG,
      fat: acc.fat + m.totalFatG,
      carbs: acc.carbs + m.totalCarbsG,
      fiber: acc.fiber + m.totalFiberG,
      sugar: acc.sugar + m.totalSugarG,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sugar: 0 },
  );

  const netCarbs = Math.max(0, consumed.carbs - consumed.fiber);

  // ─── Set Goals ──────────────────────────────────
  const goals = {
    calories: profile?.dailyCalorieGoal ?? 1500,
    protein: profile?.dailyProteinGoal ?? 100,
    fat: profile?.dailyFatGoal ?? 50,
    carbs: profile?.dailyCarbsGoal ?? 150,
    sugar: profile?.dailySugarLimitG ?? (isDiabetic ? 25 : 50),
  };

  // ─── Calculate Remaining ────────────────────────
  const remCalories = Math.max(0, goals.calories - consumed.calories);
  const remProtein = Math.max(0, goals.protein - consumed.protein);
  const remCarbs = Math.max(0, goals.carbs - consumed.carbs);
  const remFat = Math.max(0, goals.fat - consumed.fat);

  const canSuggest =
    consumed.calories > 0 && remCalories > 50 && remCalories < 1000;

  // ─── Handlers ───────────────────────────────────
  function handleAddMeal() {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push("/log-meal");
  }

  function handleSuggest() {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    suggestMutation.mutate({
      remCalories: Math.round(remCalories),
      remProtein: Math.round(remProtein),
      remCarbs: Math.round(remCarbs),
      remFat: Math.round(remFat),
      isDiabetic,
    });
  }

  if (profileQuery.isLoading) {
    return (
      <Container isScrollable={false}>
        <View className="flex-1 items-center justify-center">
          <Spinner size="lg" color="primary" />
        </View>
      </Container>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <Container scrollViewProps={{ showsVerticalScrollIndicator: false }}>
        <View className="px-6 pt-4 pb-32 gap-6">
          {/* ── Greeting ────────────────────────── */}
          <View>
            <Text className="text-foreground text-3xl font-bold">
              Olá, {firstName}! 👋
            </Text>
            <Text className="text-muted-foreground text-lg mt-1">
              {new Date().toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </Text>
          </View>

          {/* ── Calorie ring ────────────────────── */}
          <View className="items-center py-2">
            <CalorieRing consumed={consumed.calories} goal={goals.calories} />
          </View>

          {/* ── Macro rings ─────────────────────── */}
          <View className="flex-row justify-around px-2">
            <MacroRing
              label="Proteína"
              emoji="🥩"
              consumed={consumed.protein}
              goal={goals.protein}
              macroType="protein"
            />
            <MacroRing
              label="Gordura"
              emoji="🥑"
              consumed={consumed.fat}
              goal={goals.fat}
              macroType="fat"
            />
            <MacroRing
              label="Carbos"
              emoji="🍚"
              consumed={consumed.carbs}
              goal={goals.carbs}
              macroType="carbs"
            />
          </View>

          {/* ── Diabetes-specific rings ──────────── */}
          {!!isDiabetic && (
            <View>
              <View className="flex-row items-center gap-2 mb-3 mt-4">
                <Text className="text-foreground text-lg font-bold">
                  Controle Glicêmico
                </Text>
                <Text className="text-lg">🩺</Text>
              </View>
              <View className="flex-row justify-around px-2">
                <MacroRing
                  label="Açúcar"
                  emoji="🍬"
                  consumed={consumed.sugar}
                  goal={goals.sugar}
                  macroType="sugar"
                />
                <MacroRing
                  label="Fibra"
                  emoji="🥬"
                  consumed={consumed.fiber}
                  goal={25}
                  macroType="fiber"
                />
                <MacroRing
                  label="Carb Líq."
                  emoji="📊"
                  consumed={netCarbs}
                  goal={Math.max(0, goals.carbs - 25)}
                  macroType="netCarbs"
                />
              </View>
            </View>
          )}

          {/* ── Sugar warning (diabetic) ─────────── */}
          {!!(isDiabetic && consumed.sugar > goals.sugar) && (
            <Surface
              variant="secondary"
              className="p-4 rounded-3xl flex-row items-center gap-3 border-2 border-danger/30 bg-danger/5"
            >
              <Text className="text-2xl">⚠️</Text>
              <View className="flex-1">
                <Text className="text-danger text-sm font-bold">
                  Limite de açúcar excedido
                </Text>
                <Text className="text-foreground text-xs mt-0.5 leading-4">
                  Consumo: {consumed.sugar.toFixed(1)}g / Meta: {goals.sugar}g.
                  Considere alimentos com menor índice glicêmico.
                </Text>
              </View>
            </Surface>
          )}

          {/* ── Today's meals ───────────────────── */}
          <View>
            <Text className="text-foreground text-xl font-bold mb-3">
              Refeições de hoje
            </Text>

            {mealsQuery.isLoading ? (
              <View className="items-center py-8">
                <Spinner size="md" color="primary" />
              </View>
            ) : meals.length === 0 ? (
              <Pressable onPress={handleAddMeal} className="active:opacity-80">
                <Surface
                  variant="secondary"
                  className="p-8 rounded-3xl items-center bg-card border border-border"
                >
                  <Text className="text-5xl mb-3">🍽️</Text>
                  <Text className="text-foreground text-lg font-medium mb-1">
                    Nenhuma refeição ainda
                  </Text>
                  <Text className="text-muted-foreground text-base text-center mb-4">
                    Toque aqui ou no botão + abaixo{"\n"}para registrar sua
                    refeição
                  </Text>
                  <View className="bg-primary px-6 py-3 rounded-2xl">
                    <Text className="text-primary-foreground text-base font-semibold">
                      + Registrar agora
                    </Text>
                  </View>
                </Surface>
              </Pressable>
            ) : (
              <View className="gap-3">
                {meals.map((meal) => (
                  <Card
                    key={meal.id}
                    variant="secondary"
                    className="p-4 rounded-3xl border border-border"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3 flex-1">
                        <Text className="text-3xl">
                          {getMealTypeEmoji(meal.mealType)}
                        </Text>
                        <View className="flex-1">
                          <Text className="text-foreground text-base font-bold">
                            {getMealTypeLabel(meal.mealType)}
                          </Text>
                          <Text
                            className="text-muted-foreground text-sm mt-0.5"
                            numberOfLines={1}
                          >
                            {meal.items?.map((i) => i.name).join(", ")}
                          </Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <Text className="text-foreground text-2xl font-bold">
                          {meal.totalCalories}
                        </Text>
                        <Text className="text-muted-foreground text-xs uppercase tracking-widest">
                          kcal
                        </Text>
                      </View>
                    </View>

                    {/* Macros row */}
                    <View className="flex-row gap-3 mt-4 pt-3 border-t border-border flex-wrap">
                      <View className="flex-row items-center gap-1.5 bg-muted/40 px-2 py-1 rounded-md">
                        <View
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: colors.protein }}
                        />
                        <Text className="text-muted-foreground text-xs font-medium">
                          P: {meal.totalProteinG.toFixed(1)}g
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-1.5 bg-muted/40 px-2 py-1 rounded-md">
                        <View
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: colors.carbs }}
                        />
                        <Text className="text-muted-foreground text-xs font-medium">
                          C: {meal.totalCarbsG.toFixed(1)}g
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-1.5 bg-muted/40 px-2 py-1 rounded-md">
                        <View
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: colors.fat }}
                        />
                        <Text className="text-muted-foreground text-xs font-medium">
                          G: {meal.totalFatG.toFixed(1)}g
                        </Text>
                      </View>
                    </View>

                    {/* Diabetic rows or AI tip */}
                    {(isDiabetic || !!meal.aiTip) && (
                      <View className="mt-2 flex-row flex-wrap gap-2">
                        {!!isDiabetic && (
                          <>
                            <Text className="text-muted-foreground text-xs">
                              Açúcar: {meal.totalSugarG.toFixed(1)}g
                            </Text>
                            <Text className="text-muted-foreground text-xs">
                              Fibra: {meal.totalFiberG.toFixed(1)}g
                            </Text>
                          </>
                        )}
                        {!!meal.aiTip && !isDiabetic && (
                          <Text
                            className="text-primary text-xs font-medium flex-1 mt-1"
                            numberOfLines={1}
                          >
                            💡 {meal.aiTip}
                          </Text>
                        )}
                      </View>
                    )}
                  </Card>
                ))}

                <Pressable
                  onPress={handleAddMeal}
                  className="active:opacity-70 mt-1"
                >
                  <Surface
                    variant="secondary"
                    className="p-4 rounded-3xl flex-row items-center justify-center gap-2 border-2 border-dashed border-border bg-transparent"
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={20}
                      color={colors.protein}
                    />
                    <Text className="text-foreground text-sm font-bold">
                      Adicionar refeição
                    </Text>
                  </Surface>
                </Pressable>

                {/* ✨ NEW AI SUGGESTION BLOCK ✨ */}
                {!!canSuggest && (
                  <View className="mt-3">
                    <Pressable
                      onPress={handleSuggest}
                      disabled={suggestMutation.isPending}
                      className="active:scale-[0.98] transition-transform"
                    >
                      <View className="bg-primary/10 border-2 border-primary/20 p-5 rounded-3xl flex-row items-center gap-4">
                        <Text className="text-3xl">✨</Text>
                        <View className="flex-1">
                          <Text className="text-primary font-bold text-base">
                            Completar os macros?
                          </Text>
                          <Text className="text-muted-foreground text-xs mt-0.5 leading-4">
                            Peça para a IA sugerir o que comer para fechar as{" "}
                            {Math.round(remCalories)} kcal restantes.
                          </Text>
                        </View>
                        {suggestMutation.isPending ? (
                          <Spinner size="sm" color="primary" />
                        ) : (
                          <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center">
                            <Ionicons
                              name="sparkles"
                              size={16}
                              color="#cb6441"
                            />
                          </View>
                        )}
                      </View>
                    </Pressable>

                    {!!suggestMutation.data && (
                      <Animated.View
                        entering={FadeInDown}
                        className="mt-3 bg-card border border-border rounded-3xl p-5 shadow-sm"
                      >
                        <Text className="text-foreground font-bold text-lg mb-1">
                          {suggestMutation.data.title}
                        </Text>
                        <Text className="text-muted-foreground text-sm leading-5">
                          {suggestMutation.data.description}
                        </Text>
                        <View className="bg-muted rounded-xl px-4 py-3 mt-4 items-center border border-border">
                          <Text className="text-foreground text-xs font-bold tracking-widest uppercase">
                            {suggestMutation.data.macros}
                          </Text>
                        </View>
                      </Animated.View>
                    )}
                  </View>
                )}
                {/* ✨ END AI SUGGESTION BLOCK ✨ */}
              </View>
            )}
          </View>
        </View>
      </Container>

      {/* ── FAB ─────────────────────────────────── */}
      <View
        style={{
          position: "absolute",
          bottom: insets.bottom + 24,
          right: 24,
          zIndex: 50,
        }}
      >
        <Pressable
          onPress={handleAddMeal}
          style={({ pressed }) => ({
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: colors.protein, // Using primary theme color
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.8 : 1,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          })}
        >
          <Ionicons name="add" size={36} color="#ffffff" />
        </Pressable>
      </View>
    </View>
  );
}

import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Card, Spinner, Surface } from "heroui-native";
import { Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CalorieRing } from "@/components/calorie-ring";
import { MacroRing } from "@/components/macro-ring";
import { Container } from "@/components/container";
import { getLocalToday, getMealTypeEmoji, getMealTypeLabel } from "@/lib/date";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";
import { useColorScheme } from "react-native";
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

  const profile = profileQuery.data;
  const isDiabetic = profile?.hasDiabetes ?? false;
  const meals = mealsQuery.data ?? [];

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

  const goals = {
    calories: profile?.dailyCalorieGoal ?? 1500,
    protein: profile?.dailyProteinGoal ?? 100,
    fat: profile?.dailyFatGoal ?? 50,
    carbs: profile?.dailyCarbsGoal ?? 150,
    sugar: profile?.dailySugarLimitG ?? (isDiabetic ? 25 : 50),
  };

  function handleAddMeal() {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push("/log-meal");
  }

  if (profileQuery.isLoading) {
    return (
      <Container isScrollable={false}>
        <View className="flex-1 items-center justify-center">
          <Spinner size="lg" />
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
          {isDiabetic && (
            <View>
              <View className="flex-row items-center gap-2 mb-3">
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
          {isDiabetic && consumed.sugar > goals.sugar && (
            <Surface
              variant="secondary"
              className="p-4 rounded-xl flex-row items-center gap-3"
              style={{ borderWidth: 1, borderColor: "#E53935" }}
            >
              <Text className="text-2xl">⚠️</Text>
              <View className="flex-1">
                <Text className="text-destructive text-sm font-bold">
                  Limite de açúcar excedido
                </Text>
                <Text className="text-foreground text-xs">
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
                <Spinner size="md" />
              </View>
            ) : meals.length === 0 ? (
              <Pressable onPress={handleAddMeal} className="active:opacity-80">
                <Surface
                  variant="secondary"
                  className="p-8 rounded-2xl items-center bg-card"
                >
                  <Text className="text-5xl mb-3">🍽️</Text>
                  <Text className="text-foreground text-lg font-medium mb-1">
                    Nenhuma refeição ainda
                  </Text>
                  <Text className="text-muted-foreground text-base text-center mb-4">
                    Toque aqui ou no botão + abaixo{"\n"}para registrar sua
                    refeição
                  </Text>
                  <View className="bg-primary px-6 py-3 rounded-xl">
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
                    className="p-4 rounded-xl"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3 flex-1">
                        <Text className="text-3xl">
                          {getMealTypeEmoji(meal.mealType)}
                        </Text>
                        <View className="flex-1">
                          <Text className="text-foreground text-base font-semibold">
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
                        <Text className="text-foreground text-3xl font-bold">
                          {meal.totalCalories}
                        </Text>
                        <Text className="text-muted-foreground text-xs">
                          kcal
                        </Text>
                      </View>
                    </View>

                    {/* Macros row */}
                    <View className="flex-row gap-3 mt-3 pt-3 border-t border-muted/20 flex-wrap">
                      <View className="flex-row items-center gap-1">
                        <View
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: colors.protein }}
                        />
                        <Text className="text-muted-foreground text-xs">
                          P: {meal.totalProteinG.toFixed(1)}g
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <View
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: colors.carbs }}
                        />
                        <Text className="text-muted-foreground text-xs">
                          C: {meal.totalCarbsG.toFixed(1)}g
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <View
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: colors.fat }}
                        />
                        <Text className="text-muted-foreground text-xs">
                          G: {meal.totalFatG.toFixed(1)}g
                        </Text>
                      </View>
                      {isDiabetic && (
                        <>
                          <View className="flex-row items-center gap-1">
                            <View
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: colors.sugar }}
                            />
                            <Text className="text-muted-foreground text-xs">
                              Aç: {meal.totalSugarG.toFixed(1)}g
                            </Text>
                          </View>
                          <View className="flex-row items-center gap-1">
                            <View
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: colors.fiber }}
                            />
                            <Text className="text-muted-foreground text-xs">
                              Fi: {meal.totalFiberG.toFixed(1)}g
                            </Text>
                          </View>
                        </>
                      )}
                      {meal.aiTip && !isDiabetic && (
                        <Text
                          className="text-muted-foreground text-xs flex-1 text-right"
                          numberOfLines={1}
                        >
                          💡 {meal.aiTip}
                        </Text>
                      )}
                    </View>
                  </Card>
                ))}

                <Pressable
                  onPress={handleAddMeal}
                  className="active:opacity-70"
                >
                  <Surface
                    variant="secondary"
                    className="p-4 rounded-xl flex-row items-center justify-center gap-2"
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={22}
                      color="#4CAF50"
                    />
                    <Text className="text-primary text-base font-medium">
                      Adicionar refeição
                    </Text>
                  </Surface>
                </Pressable>
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
            backgroundColor: "#f59e0b",
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.8 : 1,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 8,
            elevation: 10,
          })}
        >
          <Ionicons name="add" size={36} color="#ffffff" />
        </Pressable>
      </View>
    </View>
  );
}

import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Card, Spinner, Surface } from "heroui-native";
import { Platform, Pressable, Text, View } from "react-native";

import { CalorieRing } from "@/components/calorie-ring";
import { Container } from "@/components/container";
import { getLocalToday, getMealTypeEmoji, getMealTypeLabel } from "@/lib/date";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

export default function HomeScreen() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const firstName = session?.user?.name?.split(" ")[0] ?? "";

  const profileQuery = useQuery(orpc.profile.get.queryOptions());
  const today = getLocalToday();
  const mealsQuery = useQuery(
    orpc.meal.getByDate.queryOptions({ input: { date: today } }),
  );

  const profile = profileQuery.data;
  const meals = mealsQuery.data ?? [];
  const consumedCalories = meals.reduce((sum, m) => sum + m.totalCalories, 0);
  const goalCalories = profile?.dailyCalorieGoal ?? 1500;

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
    <Container
      scrollViewProps={{
        showsVerticalScrollIndicator: false,
      }}
    >
      <View className="px-6 pt-4 pb-32 gap-6">
        {/* ── Greeting ────────────────────────── */}
        <View>
          <Text className="text-foreground text-3xl font-bold">
            Olá, {firstName}! 👋
          </Text>
          <Text className="text-muted text-lg mt-1">
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </Text>
        </View>

        {/* ── Calorie ring ────────────────────── */}
        <View className="items-center py-2">
          <CalorieRing consumed={consumedCalories} goal={goalCalories} />
        </View>

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
                className="p-8 rounded-2xl items-center"
              >
                <Text className="text-5xl mb-3">🍽️</Text>
                <Text className="text-foreground text-lg font-medium mb-1">
                  Nenhuma refeição ainda
                </Text>
                <Text className="text-muted text-base text-center mb-4">
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
                          className="text-muted text-sm mt-0.5"
                          numberOfLines={1}
                        >
                          {meal.items?.map((i) => i.name).join(", ")}
                        </Text>
                      </View>
                    </View>

                    <View className="items-end">
                      <Text className="text-foreground text-xl font-bold">
                        {meal.totalCalories}
                      </Text>
                      <Text className="text-muted text-xs">kcal</Text>
                    </View>
                  </View>

                  {/* Macros */}
                  <View className="flex-row gap-4 mt-3 pt-3 border-t border-muted/20">
                    <Text className="text-muted text-xs">
                      P: {meal.totalProteinG.toFixed(1)}g
                    </Text>
                    <Text className="text-muted text-xs">
                      C: {meal.totalCarbsG.toFixed(1)}g
                    </Text>
                    <Text className="text-muted text-xs">
                      G: {meal.totalFatG.toFixed(1)}g
                    </Text>
                    {meal.aiTip && (
                      <Text
                        className="text-muted text-xs flex-1 text-right"
                        numberOfLines={1}
                      >
                        💡 {meal.aiTip}
                      </Text>
                    )}
                  </View>
                </Card>
              ))}

              {/* Add another meal inline */}
              <Pressable onPress={handleAddMeal} className="active:opacity-70">
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

      {/* ═══ Floating Action Button ═══════════════ */}
      <View
        className="absolute bottom-6 right-6"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Pressable
          onPress={handleAddMeal}
          className="bg-primary w-20 h-20 rounded-full items-center justify-center active:opacity-80"
        >
          <Ionicons name="add" size={40} color="#fff" />
        </Pressable>
      </View>
    </Container>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Spinner } from "heroui-native";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { orpc } from "@/utils/orpc";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from "react-native-reanimated";

export default function ProgressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const weightQuery = useQuery(orpc.weight.getHistory.queryOptions());
  const weights = weightQuery.data ?? [];
  const latest = weights[weights.length - 1];
  const first = weights[0];
  const diff =
    latest && first ? +(latest.weightKg - first.weightKg).toFixed(1) : 0;

  function handleAddWeight() {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/log-weight");
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* ── Header ───────────────────────────────── */}
      <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text className="text-foreground text-3xl font-bold">Progresso</Text>
          <Text className="text-muted-foreground text-sm mt-0.5">
            Histórico de peso
          </Text>
        </Animated.View>

        <Animated.View entering={ZoomIn.delay(200).duration(400)}>
          <Pressable
            onPress={handleAddWeight}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            className="bg-primary w-11 h-11 rounded-2xl items-center justify-center"
          >
            <Ionicons name="add" size={26} color="#fff" />
          </Pressable>
        </Animated.View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        <View className="px-6 pt-4 gap-5">
          {/* ── Current weight hero card ──────────── */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(500).springify()}
          >
            <View className="bg-card rounded-3xl p-6 overflow-hidden">
              {/* Decorative background circle */}
              <View
                style={{
                  position: "absolute",
                  width: 200,
                  height: 200,
                  borderRadius: 100,
                  backgroundColor: "rgba(var(--primary), 0.06)",
                  top: -60,
                  right: -40,
                }}
              />

              <Text className="text-muted-foreground text-sm font-medium mb-4 uppercase tracking-widest">
                Peso atual
              </Text>

              {weightQuery.isLoading ? (
                <View className="items-center py-6">
                  <Spinner size="lg" color="primary" />
                </View>
              ) : latest ? (
                <View>
                  {/* Big weight number */}
                  <View className="flex-row items-end gap-2 mb-4">
                    <Text
                      className="text-foreground font-bold"
                      style={{ fontSize: 72, lineHeight: 76 }}
                    >
                      {latest.weightKg.toFixed(1)}
                    </Text>
                    <Text className="text-muted-foreground text-2xl font-medium mb-3">
                      kg
                    </Text>
                  </View>

                  {/* Stats row */}
                  <View className="flex-row gap-3">
                    {weights.length > 1 && (
                      <View
                        className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl ${
                          diff <= 0 ? "bg-success/10" : "bg-danger/10"
                        }`}
                      >
                        <Ionicons
                          name={diff <= 0 ? "trending-down" : "trending-up"}
                          size={16}
                          color={diff <= 0 ? "#22c55e" : "#ef4444"}
                        />
                        <Text
                          className={`text-sm font-bold ${
                            diff <= 0 ? "text-success" : "text-danger"
                          }`}
                        >
                          {diff <= 0 ? "" : "+"}
                          {diff} kg desde o início
                        </Text>
                      </View>
                    )}

                    <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/30">
                      <Ionicons
                        name="bar-chart-outline"
                        size={14}
                        color="#6b7280"
                      />
                      <Text className="text-muted-foreground text-sm font-medium">
                        {weights.length} registros
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View className="items-center py-8 gap-3">
                  <Text className="text-5xl">⚖️</Text>
                  <Text className="text-muted-foreground text-base text-center">
                    Nenhum peso registrado ainda.{"\n"}Toque em + para começar.
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* ── History ───────────────────────────── */}
          {weights.length > 0 && (
            <Animated.View
              entering={FadeInDown.delay(200).duration(500).springify()}
              className="gap-3"
            >
              <Text className="text-foreground text-lg font-bold px-1">
                Histórico
              </Text>

              {[...weights]
                .reverse()
                .slice(0, 20)
                .map((entry, i) => {
                  const prev = [...weights].reverse()[i + 1];
                  const entryDiff = prev
                    ? +(entry.weightKg - prev.weightKg).toFixed(1)
                    : null;

                  return (
                    <Animated.View
                      key={entry.id}
                      entering={FadeInUp.delay(i * 50).duration(350)}
                    >
                      <View className="bg-card rounded-2xl px-5 py-4 flex-row items-center justify-between">
                        {/* Date */}
                        <View className="flex-row items-center gap-3">
                          <View className="w-9 h-9 rounded-xl bg-muted/30 items-center justify-center">
                            <Ionicons
                              name="calendar-outline"
                              size={16}
                              color="#6b7280"
                            />
                          </View>
                          <Text className="text-foreground text-base font-medium">
                            {new Date(
                              `${entry.date}T12:00:00`,
                            ).toLocaleDateString("pt-BR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </Text>
                        </View>

                        {/* Weight + diff */}
                        <View className="items-end gap-1">
                          <Text className="text-foreground text-lg font-bold">
                            {entry.weightKg.toFixed(1)} kg
                          </Text>
                          {entryDiff !== null && (
                            <Text
                              className={`text-xs font-semibold ${
                                entryDiff <= 0 ? "text-success" : "text-danger"
                              }`}
                            >
                              {entryDiff <= 0 ? "▼" : "▲"} {Math.abs(entryDiff)}{" "}
                              kg
                            </Text>
                          )}
                        </View>
                      </View>
                    </Animated.View>
                  );
                })}
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

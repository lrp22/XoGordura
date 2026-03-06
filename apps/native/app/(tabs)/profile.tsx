import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Spinner } from "heroui-native";
import { Platform, Pressable, ScrollView, Text, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp, ZoomIn } from "react-native-reanimated";

import { authClient } from "@/lib/auth-client";
import { calcAge, calcCaloriesFromMacros } from "@/lib/calories";
import { queryClient, orpc } from "@/utils/orpc";
import { useAppTheme } from "@/contexts/app-theme-context";

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "Sedentária",
  light:     "Leve",
  moderate:  "Moderada",
  active:    "Ativa",
};

function InfoRow({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View className="flex-row items-center justify-between py-3.5 border-b border-border/50">
      <View className="flex-row items-center gap-2.5">
        <View className="w-7 h-7 rounded-lg bg-muted/40 items-center justify-center">
          <Ionicons name={icon as any} size={14} color="#6b7280" />
        </View>
        <Text className="text-muted-foreground text-sm">{label}</Text>
      </View>
      <Text className="text-foreground text-base font-semibold">{value}</Text>
    </View>
  );
}

function MacroBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View className="flex-1 items-center py-3 gap-1">
      <View
        className="w-1.5 h-1.5 rounded-full mb-1"
        style={{ backgroundColor: color }}
      />
      <Text className="text-foreground text-lg font-bold">{value}</Text>
      <Text className="text-muted-foreground text-xs">{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: session } = authClient.useSession();
  const profileQuery = useQuery(orpc.profile.get.queryOptions());
  const { toggleTheme, isLight } = useAppTheme();
  const isDark = !isLight;
  const profile = profileQuery.data;

  async function handleSignOut() {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    queryClient.clear();
    await authClient.signOut();
  }

  function handleEditGoals() {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/edit-goals" as never);
  }

  if (profileQuery.isLoading) {
    return (
      <View
        className="flex-1 bg-background items-center justify-center"
        style={{ paddingTop: insets.top }}
      >
        <Spinner size="lg" color="primary" />
      </View>
    );
  }

  const birthYear = profile?.birthDate
    ? Number.parseInt(profile.birthDate.split("-")[0], 10)
    : null;

  const initials = session?.user?.name
    ?.split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() ?? "?";

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>

      {/* ── Header ───────────────────────────── */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        className="px-6 pt-4 pb-2 flex-row items-center justify-between"
      >
        <View>
          <Text className="text-foreground text-3xl font-bold">Perfil</Text>
          <Text className="text-muted-foreground text-sm mt-0.5">
            Suas informações e metas
          </Text>
        </View>
        <Pressable
          onPress={toggleTheme}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          className="w-10 h-10 rounded-2xl bg-muted/30 items-center justify-center"
        >
          <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={20} color={isDark ? "#f59e0b" : "#6b7280"} />
        </Pressable>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        <View className="px-6 pt-4 gap-5">

          {/* ── Avatar card ──────────────────────── */}
          <Animated.View entering={ZoomIn.delay(80).duration(500).springify()}>
            <View className="bg-card rounded-3xl p-6 items-center gap-2 border border-border">
              {/* Avatar circle */}
              <View className="w-20 h-20 rounded-3xl bg-primary/15 items-center justify-center mb-1">
                <Text className="text-primary text-3xl font-bold">
                  {initials}
                </Text>
              </View>
              <Text className="text-foreground text-2xl font-bold">
                {session?.user?.name}
              </Text>
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="mail-outline" size={13} color="#9ca3af" />
                <Text className="text-muted-foreground text-sm">
                  {session?.user?.email}
                </Text>
              </View>
              {profile?.hasDiabetes && (
                <View className="flex-row items-center gap-1.5 bg-warning/15 px-3 py-1.5 rounded-full mt-1">
                  <Text className="text-sm">🩺</Text>
                  <Text className="text-warning text-xs font-bold">
                    Controle glicêmico ativo
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* ── Personal info ─────────────────────── */}
          {profile && (
            <Animated.View entering={FadeInDown.delay(120).duration(400)}>
              <View className="bg-card rounded-3xl px-5 pt-2 pb-1 border border-border">
                <Text className="text-foreground text-xs font-bold uppercase tracking-wider pt-4 pb-2">
                  Informações pessoais
                </Text>
                {birthYear && (
                  <InfoRow
                    label="Idade"
                    value={`${calcAge(birthYear)} anos`}
                    icon="calendar-outline"
                  />
                )}
                {profile.heightCm && (
                  <InfoRow
                    label="Altura"
                    value={`${profile.heightCm} cm`}
                    icon="resize-outline"
                  />
                )}
                {profile.currentWeightKg && (
                  <InfoRow
                    label="Peso inicial"
                    value={`${profile.currentWeightKg.toFixed(1)} kg`}
                    icon="barbell-outline"
                  />
                )}
                {profile.goalWeightKg && (
                  <InfoRow
                    label="Peso desejado"
                    value={`${profile.goalWeightKg.toFixed(1)} kg`}
                    icon="flag-outline"
                  />
                )}
                {profile.activityLevel && (
                  <InfoRow
                    label="Atividade"
                    value={ACTIVITY_LABELS[profile.activityLevel] ?? profile.activityLevel}
                    icon="walk-outline"
                  />
                )}
              </View>
            </Animated.View>
          )}

          {/* ── Nutrition goals ───────────────────── */}
          {profile && (
            <Animated.View entering={FadeInDown.delay(180).duration(400)}>
              <View className="bg-card rounded-3xl p-5 border border-border">
                {/* Title + edit */}
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-foreground text-xs font-bold uppercase tracking-wider">
                    Metas nutricionais
                  </Text>
                  <Pressable
                    onPress={handleEditGoals}
                    hitSlop={12}
                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                    className="flex-row items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-xl"
                  >
                    <Ionicons name="pencil-outline" size={13} color="#f97316" />
                    <Text className="text-primary text-xs font-bold">
                      Editar
                    </Text>
                  </Pressable>
                </View>

                {/* Calorie hero */}
                <View className="bg-primary/10 rounded-2xl py-4 items-center mb-4">
                  <Text className="text-muted-foreground text-xs mb-1 uppercase tracking-wider">
                    Meta diária
                  </Text>
                  <Text className="text-primary text-4xl font-bold">
                    {(profile.dailyCalorieGoal ?? 1500).toLocaleString("pt-BR")}
                  </Text>
                  <Text className="text-primary/70 text-sm font-medium">kcal</Text>
                </View>

                {/* Macro breakdown */}
                <View className="flex-row bg-muted/20 rounded-2xl overflow-hidden">
                  <MacroBox
                    label="Proteína"
                    value={`${profile.dailyProteinGoal ?? "–"}g`}
                    color="#3B82F6"
                  />
                  <View className="w-px bg-border" />
                  <MacroBox
                    label="Gordura"
                    value={`${profile.dailyFatGoal ?? "–"}g`}
                    color="#F59E0B"
                  />
                  <View className="w-px bg-border" />
                  <MacroBox
                    label="Carbos"
                    value={`${profile.dailyCarbsGoal ?? "–"}g`}
                    color="#8B5CF6"
                  />
                </View>

                {/* Macro calorie footnote */}
                {profile.dailyProteinGoal != null &&
                  profile.dailyCarbsGoal != null &&
                  profile.dailyFatGoal != null && (
                    <Text className="text-muted-foreground text-xs text-center mt-3">
                      Macros totalizam{" "}
                      {calcCaloriesFromMacros(
                        profile.dailyProteinGoal,
                        profile.dailyCarbsGoal,
                        profile.dailyFatGoal,
                      )}{" "}
                      kcal
                    </Text>
                  )}
              </View>
            </Animated.View>
          )}

          {/* ── Sign out ──────────────────────────── */}
          <Animated.View entering={FadeInUp.delay(240).duration(400)}>
            <Pressable
              onPress={handleSignOut}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              className="bg-danger/10 py-4 rounded-3xl flex-row items-center justify-center gap-2 border border-danger/20"
            >
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text className="text-danger text-base font-semibold">
                Sair da conta
              </Text>
            </Pressable>
          </Animated.View>

        </View>
      </ScrollView>
    </View>
  );
}
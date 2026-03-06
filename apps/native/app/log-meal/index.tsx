import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Spinner } from "heroui-native";
import { useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from "react-native-reanimated";
import { useColorScheme } from "react-native";

import { Container } from "@/components/container";
import { useLogMeal } from "@/contexts/log-meal-context";
import { orpc } from "@/utils/orpc";
import { ringColors } from "@/constants/ring-colors";

// ─── Meal type options ───────────────────────────────────
const MEAL_TYPES = [
  { key: "breakfast", emoji: "☀️", label: "Café" },
  { key: "lunch", emoji: "🌤️", label: "Almoço" },
  { key: "dinner", emoji: "🌙", label: "Jantar" },
  { key: "snack", emoji: "🍎", label: "Lanche" },
] as const;

// ─── Loading messages ────────────────────────────────────
const LOADING_MESSAGES = [
  "Analisando sua refeição... 🔍",
  "Consultando tabela TACO... 📊",
  "Verificando calorias... 🧮",
  "Buscando dados nutricionais... 🥗",
  "Quase lá... ✨",
];

const EXAMPLES = [
  "Pão com manteiga e café com leite",
  "Arroz, feijão, frango grelhado e salada",
  "Macarrão com molho de tomate",
  "Iogurte com granola e banana",
];

export default function LogMealInput() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = ringColors[scheme === "dark" ? "dark" : "light"];

  const {
    mealType,
    setMealType,
    voiceTranscript,
    setVoiceTranscript,
    setAnalysisResult,
  } = useLogMeal();

  const inputRef = useRef<TextInput>(null);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  const analyzeMutation = useMutation(
    orpc.meal.analyze.mutationOptions({
      onSuccess: (data) => {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setAnalysisResult(data as any);
        router.push("/log-meal/confirm");
      },
      onError: () => {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      },
    }),
  );

  useEffect(() => {
    if (!analyzeMutation.isPending) return;
    const interval = setInterval(() => {
      setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [analyzeMutation.isPending]);

  function handleAnalyze() {
    if (!voiceTranscript.trim()) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setLoadingMsgIndex(0);
    analyzeMutation.mutate({ voiceTranscript: voiceTranscript.trim() });
  }

  function selectMealType(type: string) {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setMealType(type);
  }

  const canAnalyze =
    voiceTranscript.trim().length >= 3 && !analyzeMutation.isPending;

  // ─── Loading overlay ─────────────────────────────────
  if (analyzeMutation.isPending) {
    return (
      <View
        className="flex-1 bg-background items-center justify-center px-8 gap-6"
        style={{ paddingTop: insets.top }}
      >
        <Animated.View entering={ZoomIn.duration(500).springify()}>
          <View className="w-24 h-24 rounded-3xl bg-primary/10 items-center justify-center">
            <Spinner size="lg" color="primary" />
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          key={loadingMsgIndex}
          className="items-center gap-2"
        >
          <Text className="text-foreground text-xl font-bold text-center">
            {LOADING_MESSAGES[loadingMsgIndex]}
          </Text>
          <Text className="text-muted-foreground text-base text-center">
            Isso pode levar alguns segundos
          </Text>
        </Animated.View>

        {/* Progress dots */}
        <View className="flex-row gap-2 mt-4">
          {LOADING_MESSAGES.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === loadingMsgIndex ? 20 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor:
                  i === loadingMsgIndex ? colors.protein : "#d1d5db",
                opacity: i === loadingMsgIndex ? 1 : 0.4,
              }}
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* ── Header ─────────────────────────────── */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        className="px-6 pt-4 pb-2 flex-row items-center justify-between"
      >
        <View>
          <Text className="text-foreground text-3xl font-bold">
            Nova refeição
          </Text>
          <Text className="text-muted-foreground text-sm mt-0.5">
            Descreva o que você comeu
          </Text>
        </View>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          className="w-10 h-10 rounded-2xl bg-muted/30 items-center justify-center"
        >
          <Ionicons name="close" size={20} color="#6b7280" />
        </Pressable>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        <View className="px-6 pt-4 gap-6">
          {/* ── Meal type selector ────────────────── */}
          <Animated.View entering={FadeInDown.delay(80).duration(400)}>
            <Text
              className="text-foreground text-base font-bold mb-3 uppercase tracking-wider"
              style={{ fontSize: 11 }}
            >
              Tipo de refeição
            </Text>
            <View className="flex-row gap-2">
              {MEAL_TYPES.map((type, i) => {
                const isSelected = mealType === type.key;
                return (
                  <Animated.View
                    key={type.key}
                    entering={FadeInDown.delay(80 + i * 50)
                      .duration(350)
                      .springify()}
                    className="flex-1"
                  >
                    <Pressable
                      onPress={() => selectMealType(type.key)}
                      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
                    >
                      <View
                        className={`py-3.5 rounded-2xl items-center gap-1 border-2 ${
                          isSelected
                            ? "bg-primary/10 border-primary"
                            : "bg-card border-transparent"
                        }`}
                      >
                        <Text style={{ fontSize: 22 }}>{type.emoji}</Text>
                        <Text
                          className={`text-xs font-bold ${
                            isSelected
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        >
                          {type.label}
                        </Text>
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>

          {/* ── Text input ───────────────────────── */}
          <Animated.View entering={FadeInDown.delay(180).duration(400)}>
            <View className="flex-row items-center justify-between mb-3">
              <Text
                className="text-foreground text-base font-bold uppercase tracking-wider"
                style={{ fontSize: 11 }}
              >
                O que você comeu?
              </Text>
              {!!voiceTranscript.length && (
                <Text className="text-muted-foreground text-xs">
                  {voiceTranscript.length} caracteres
                </Text>
              )}
            </View>

            <Pressable onPress={() => inputRef.current?.focus()}>
              <View className="bg-card rounded-3xl overflow-hidden border border-border">
                <TextInput
                  ref={inputRef}
                  value={voiceTranscript}
                  onChangeText={setVoiceTranscript}
                  placeholder="Ex: Arroz, feijão, bife grelhado e salada..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  autoCorrect
                  style={{
                    minHeight: 140,
                    fontSize: 17,
                    lineHeight: 26,
                    padding: 16,
                    color: scheme === "dark" ? "#f3f4f6" : "#1f2937",
                  }}
                />

                {/* Mic hint row */}
                <View className="flex-row items-center gap-2 px-4 py-3 border-t border-border">
                  <Ionicons name="mic-outline" size={15} color="#9ca3af" />
                  <Text className="text-muted-foreground text-xs">
                    Use o 🎤 do teclado para ditar
                  </Text>
                  {voiceTranscript.length > 0 && (
                    <Pressable
                      onPress={() => setVoiceTranscript("")}
                      className="ml-auto"
                      hitSlop={8}
                    >
                      <Text className="text-danger text-xs font-semibold">
                        Limpar
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </Pressable>
          </Animated.View>

          {/* ── Error ────────────────────────────── */}
          {analyzeMutation.isError && (
            <Animated.View entering={FadeIn.duration(300)}>
              <View className="p-4 rounded-2xl border border-destructive bg-destructive/10 flex-row items-start gap-3">
                <Ionicons
                  name="alert-circle"
                  size={18}
                  color="#ef4444"
                  style={{ marginTop: 1 }}
                />
                <View className="flex-1">
                  <Text className="text-destructive text-sm font-bold mb-0.5">
                    Erro ao analisar
                  </Text>
                  <Text className="text-muted-foreground text-xs">
                    {analyzeMutation.error?.message ?? "Tente novamente"}
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* ── Examples ─────────────────────────── */}
          {voiceTranscript.length === 0 && (
            <Animated.View entering={FadeInDown.delay(260).duration(400)}>
              <Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-3">
                Exemplos rápidos
              </Text>
              <View className="gap-2">
                {EXAMPLES.map((example, i) => (
                  <Animated.View
                    key={example}
                    entering={FadeInUp.delay(260 + i * 40).duration(350)}
                  >
                    <Pressable
                      onPress={() => setVoiceTranscript(example)}
                      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                    >
                      <View className="bg-card rounded-2xl px-4 py-3.5 flex-row items-center gap-3">
                        <View className="w-7 h-7 rounded-xl bg-primary/10 items-center justify-center">
                          <Ionicons
                            name="arrow-forward"
                            size={13}
                            color={colors.protein}
                          />
                        </View>
                        <Text className="text-foreground text-sm flex-1">
                          {example}
                        </Text>
                      </View>
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          )}
        </View>
      </ScrollView>

      {/* ── Analyze button (sticky footer) ───── */}
      <Animated.View
        entering={FadeInUp.delay(320).duration(500).springify()}
        style={{ paddingBottom: insets.bottom + 16 }}
        className="px-6 pt-3 bg-background border-t border-border"
      >
        <Pressable
          onPress={handleAnalyze}
          disabled={!canAnalyze}
          style={({ pressed }) => ({
            opacity: !canAnalyze ? 0.4 : pressed ? 0.8 : 1,
          })}
        >
          <View className="bg-primary mb-14 rounded-3xl h-16 items-center justify-center flex-row gap-3">
            <Ionicons name="search" size={20} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>
              Analisar Refeição
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

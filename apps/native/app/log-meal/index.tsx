import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Button, Spinner, Surface, useThemeColor } from "heroui-native";
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";

import { Container } from "@/components/container";
import { useLogMeal } from "@/contexts/log-meal-context";
import { orpc } from "@/utils/orpc";

// ─── Meal type options ───────────────────────────────────
const MEAL_TYPES = [
  { key: "breakfast", emoji: "☀️", label: "Café" },
  { key: "lunch", emoji: "🌤️", label: "Almoço" },
  { key: "dinner", emoji: "🌙", label: "Jantar" },
  { key: "snack", emoji: "🍎", label: "Lanche" },
] as const;

// ─── Loading messages (rotate during analysis) ──────────
const LOADING_MESSAGES = [
  "Analisando sua refeição... 🔍",
  "Consultando tabela TACO... 📊",
  "Verificando calorias... 🧮",
  "Buscando dados nutricionais... 🥗",
  "Quase lá... ✨",
];

export default function LogMealInput() {
  const router = useRouter();
  const {
    mealType,
    setMealType,
    voiceTranscript,
    setVoiceTranscript,
    setAnalysisResult,
  } = useLogMeal();
  const primaryColor = useThemeColor("accent");
  const foregroundColor = useThemeColor("foreground");
  const inputRef = useRef<TextInput>(null);

  // Loading message rotation
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

  // Rotate loading messages
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
      <Container isScrollable={false}>
        <View className="flex-1 items-center justify-center px-8 gap-6">
          <Spinner size="lg" />
          <Text className="text-foreground text-xl font-medium text-center">
            {LOADING_MESSAGES[loadingMsgIndex]}
          </Text>
          <Text className="text-muted-foreground text-base text-center">
            Isso pode levar alguns segundos
          </Text>
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <View className="px-6 pt-4 pb-8 gap-6 bg-background">
        {/* ── Meal type selector ──────────────── */}
        <View>
          <Text className="text-foreground text-lg font-semibold mb-3">
            Tipo de refeição
          </Text>
          <View className="flex-row gap-3">
            {MEAL_TYPES.map((type) => {
              const isSelected = mealType === type.key;
              return (
                <Pressable
                  key={type.key}
                  onPress={() => selectMealType(type.key)}
                  className="flex-1 active:opacity-80"
                >
                  <Surface
                    variant="secondary"
                    // Adicione as classes de borda condicionalmente aqui
                    className={`py-4 px-2 rounded-xl bg-card items-center border-2 ${
                      isSelected ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <Text className="text-2xl mb-1">{type.emoji}</Text>
                    <Text
                      className={`text-sm font-semibold ${
                        isSelected ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {type.label}
                    </Text>
                  </Surface>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Voice/text input area ───────────── */}
        <View>
          <Text className="text-foreground text-lg font-semibold mb-3">
            O que você comeu?
          </Text>

          {/* Mic hint */}
          <Pressable
            onPress={() => inputRef.current?.focus()}
            className="flex-row items-center gap-2 mb-3 py-2"
          >
            <Ionicons name="mic" size={20} color={primaryColor} />
            <Text className="text-muted-foreground text-sm">
              Dica: use o 🎤 do teclado para falar
            </Text>
          </Pressable>

          {/* Text input */}
          <Surface variant="secondary" className="rounded-xl p-1 bg-card">
            <TextInput
              ref={inputRef}
              value={voiceTranscript}
              onChangeText={setVoiceTranscript}
              placeholder="Ex: Comi arroz, feijão, bife grelhado e salada..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              autoCorrect
              style={{
                minHeight: 140,
                fontSize: 18,
                lineHeight: 28,
                padding: 16,
                color: foregroundColor,
              }}
            />
          </Surface>

          {voiceTranscript.length > 0 && (
            <Text className="text-muted-foreground text-sm mt-2 text-right">
              {voiceTranscript.length} caracteres
            </Text>
          )}
        </View>

        {/* ── Error display ───────────────────── */}
        {analyzeMutation.isError && (
          <Surface
            variant="secondary"
            className="p-4 rounded-xl"
            style={{ borderWidth: 1, borderColor: "#E53935" }}
          >
            <Text className="text-destructive text-base font-medium mb-1">
              Erro ao analisar 😕
            </Text>
            <Text className="text-muted-foreground text-sm">
              {analyzeMutation.error?.message ?? "Tente novamente"}
            </Text>
          </Surface>
        )}

        {/* ── Examples (when input is empty) ──── */}
        {voiceTranscript.length === 0 && (
          <View>
            <Text className="text-muted-foreground text-sm font-medium mb-2">
              Exemplos:
            </Text>
            {[
              "Comi pão com manteiga e café com leite",
              "Arroz, feijão, frango grelhado e salada",
              "Um prato de macarrão com molho de tomate",
              "Iogurte Danone com granola e banana",
            ].map((example) => (
              <Pressable
                key={example}
                onPress={() => setVoiceTranscript(example)}
                className="py-2 active:opacity-60"
              >
                <Text className="text-muted-foreground text-base">
                  → "{example}"
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* ── Analyze button ──────────────────── */}
        <Button
          size="lg"
          className="w-full h-16 bg-primary"
          onPress={handleAnalyze}
          isDisabled={!canAnalyze}
        >
          <Button.Label className="text-lg text-foreground">
            🔍 Analisar Refeição
          </Button.Label>
        </Button>
      </View>
    </Container>
  );
}

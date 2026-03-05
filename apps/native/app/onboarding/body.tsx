import { useRouter } from "expo-router";
import { Button, Surface } from "heroui-native";
import { Text, View, Pressable } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { Container } from "@/components/container";
import { NumberStepper } from "@/components/number-stepper";
import { useOnboarding } from "@/contexts/onboarding-context";

const DEFICIT_OPTIONS = [
  {
    value: 0.1,
    label: "MODERADA",
    emoji: "🐢",
    description: "-10% das calorias",
  },
  {
    value: 0.2,
    label: "AGRESSIVA",
    emoji: "🐇",
    description: "-20% das calorias",
  },
] as const;

export default function OnboardingBody() {
  const router = useRouter();
  const { data, update } = useOnboarding();

  return (
    <Container>
      {/* Added bg-background for consistency */}
      <View className="flex-1 px-6 pt-16 pb-8 justify-between bg-background">
        <View>
          <Animated.View entering={FadeInDown.duration(500)}>
            <Text className="text-foreground text-3xl font-bold mb-6">
              Suas Medidas ⚖️
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <NumberStepper
              label="Peso Atual"
              unit="kg"
              value={data.currentWeightKg}
              onChange={(v) => update({ currentWeightKg: v })}
              min={30}
              max={250}
              step={0.1}
              decimals={1}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <NumberStepper
              label="Altura"
              unit="cm"
              value={data.heightCm}
              onChange={(v) => update({ heightCm: v })}
              min={100}
              max={220}
              step={1}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <Text className="text-foreground text-lg font-bold mt-6 mb-4">
              Intensidade da Dieta (Déficit)
            </Text>
            <View className="flex-row gap-4">
              {DEFICIT_OPTIONS.map((opt) => {
                const isSelected = data.deficitPercentage === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => update({ deficitPercentage: opt.value })}
                    className="flex-1 active:scale-95"
                  >
                    <Surface
                      variant="secondary"
                      // FIX: Using border-accent class instead of style/oklch hook
                      className={`py-5 bg-card rounded-2xl items-center gap-1 border-2 transition-colors ${
                        isSelected ? "border-accent" : "border-transparent"
                      }`}
                    >
                      <Text className="text-2xl mb-1">{opt.emoji}</Text>
                      <Text
                        className={`font-bold ${
                          isSelected ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {opt.label}
                      </Text>
                      <Text className="text-muted-foreground text-xs mt-0.5">
                        {opt.description}
                      </Text>
                    </Surface>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInUp.delay(500).duration(600).springify()}>
          <Button
            size="lg"
            className="h-16"
            onPress={() => router.push("/onboarding/activity" as any)}
          >
            <Button.Label className="text-lg">Próximo →</Button.Label>
          </Button>
        </Animated.View>
      </View>
    </Container>
  );
}

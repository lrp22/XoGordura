import { useRouter } from "expo-router";
import { Button } from "heroui-native";
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
      <View className="flex-1 px-6 pt-16 pb-8 justify-between bg-background">
        <View>
          <Animated.View entering={FadeInDown.duration(500)}>
            <Text className="text-foreground text-3xl font-bold mb-6">
              Suas Medidas ⚖️
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <View className="bg-card rounded-3xl p-5 border border-border mb-4">
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
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <View className="bg-card rounded-3xl p-5 border border-border">
              <NumberStepper
                label="Altura"
                unit="cm"
                value={data.heightCm}
                onChange={(v) => update({ heightCm: v })}
                min={100}
                max={220}
                step={1}
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <Text className="text-foreground text-xs font-bold uppercase tracking-wider mt-6 mb-4 px-1">
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
                    <View
                      className={`py-5 rounded-3xl items-center border-2 transition-colors ${isSelected ? "bg-card border-primary" : "bg-muted/30 border-transparent"}`}
                    >
                      <Text className="text-3xl mb-2">{opt.emoji}</Text>
                      <Text
                        className={`font-bold text-xs tracking-widest uppercase ${isSelected ? "text-primary" : "text-foreground"}`}
                      >
                        {opt.label}
                      </Text>
                      <Text className="text-muted-foreground text-xs mt-1">
                        {opt.description}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInUp.delay(500).duration(600).springify()}>
          <Button
            size="lg"
            className="h-16 rounded-3xl bg-primary"
            onPress={() => router.push("/onboarding/activity" as any)}
          >
            <Button.Label className="text-lg font-bold text-white">
              Próximo →
            </Button.Label>
          </Button>
        </Animated.View>
      </View>
    </Container>
  );
}

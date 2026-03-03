import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Button, useThemeColor } from "heroui-native";
import { Pressable, Text, View } from "react-native";

import { Container } from "@/components/container";
import { NumberStepper } from "@/components/number-stepper";
import { useOnboarding } from "@/contexts/onboarding-context";

function StepProgress({ current }: { current: number }) {
  return (
    <View className="flex-row gap-2 mb-6">
      {[1, 2, 3].map((step) => (
        <View
          key={step}
          className={`h-2 flex-1 rounded-full ${step <= current ? "bg-primary" : "bg-muted"}`}
        />
      ))}
    </View>
  );
}

export default function OnboardingBody() {
  const router = useRouter();
  const { data, update } = useOnboarding();
  const foregroundColor = useThemeColor("foreground");

  return (
    <Container>
      <View className="flex-1 px-6 pt-16 pb-8 justify-between">
        {/* Top section */}
        <View>
          {/* Back button */}
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center gap-1 mb-4 self-start py-2"
          >
            <Ionicons name="chevron-back" size={20} color={foregroundColor} />
            <Text className="text-foreground text-base">Voltar</Text>
          </Pressable>

          <StepProgress current={2} />

          <Text className="text-foreground text-3xl font-bold mb-2">
            ⚖️ Suas medidas
          </Text>

          <Text className="text-muted text-lg mb-4">
            Precisamos disso para calcular sua meta
          </Text>
        </View>

        {/* Steppers */}
        <View className="gap-2">
          <NumberStepper
            label="Peso atual"
            unit="kg"
            value={data.currentWeightKg}
            onChange={(v) => update({ currentWeightKg: v })}
            min={30}
            max={250}
            step={0.5}
            decimals={1}
          />

          <NumberStepper
            label="Altura"
            unit="cm"
            value={data.heightCm}
            onChange={(v) => update({ heightCm: v })}
            min={100}
            max={220}
            step={1}
            decimals={0}
          />

          <NumberStepper
            label="Peso desejado"
            unit="kg"
            value={data.goalWeightKg}
            onChange={(v) => update({ goalWeightKg: v })}
            min={30}
            max={250}
            step={0.5}
            decimals={1}
          />
        </View>

        {/* Next button */}
        <Button
          size="lg"
          className="w-full h-16 mt-4"
          onPress={() => router.push("/onboarding/activity")}
        >
          <Button.Label className="text-lg">Próximo →</Button.Label>
        </Button>
      </View>
    </Container>
  );
}

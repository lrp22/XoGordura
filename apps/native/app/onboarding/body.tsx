import { useRouter } from "expo-router";
import { Button, Surface, useThemeColor } from "heroui-native";
import { Text, View, Pressable } from "react-native";
import { Container } from "@/components/container";
import { NumberStepper } from "@/components/number-stepper";
import { useOnboarding } from "@/contexts/onboarding-context";

export default function OnboardingBody() {
  const router = useRouter();
  const { data, update } = useOnboarding();
  const primaryColor = useThemeColor("accent");

  return (
    <Container>
      <View className="flex-1 px-6 pt-16 pb-8 justify-between">
        <View>
          <Text className="text-foreground text-3xl font-bold mb-6">
            Suas Medidas ⚖️
          </Text>

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

          <NumberStepper
            label="Altura"
            unit="cm"
            value={data.heightCm}
            onChange={(v) => update({ heightCm: v })}
            min={100}
            max={220}
            step={1}
          />

          <Text className="text-foreground text-lg font-bold mt-6 mb-4">
            Intensidade da Dieta (Déficit)
          </Text>
          <View className="flex-row gap-4">
            {[0.1, 0.2].map((d) => (
              <Pressable
                key={d}
                onPress={() => update({ deficitPercentage: d })}
                className="flex-1"
              >
                <Surface
                  variant="secondary"
                  className="py-4 rounded-xl items-center"
                  style={
                    data.deficitPercentage === d
                      ? { borderWidth: 2, borderColor: primaryColor }
                      : {}
                  }
                >
                  <Text
                    className={`font-bold ${data.deficitPercentage === d ? "text-primary" : "text-muted"}`}
                  >
                    {d === 0.1 ? "MODERADA (-10%)" : "AGRESSIVA (-20%)"}
                  </Text>
                </Surface>
              </Pressable>
            ))}
          </View>
        </View>

        <Button
          size="lg"
          className="h-16"
          onPress={() => router.push("/onboarding/activity")}
        >
          <Button.Label className="text-lg">Próximo →</Button.Label>
        </Button>
      </View>
    </Container>
  );
}

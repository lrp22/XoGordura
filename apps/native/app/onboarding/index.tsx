import { useRouter } from "expo-router";
import { Button, Surface } from "heroui-native"; // Removed useThemeColor
import { Text, View, Pressable } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { Container } from "@/components/container";
import { NumberStepper } from "@/components/number-stepper";
import { useOnboarding } from "@/contexts/onboarding-context";

export default function OnboardingWelcome() {
  const router = useRouter();
  const { data, update } = useOnboarding();

  console.log("Current Gender:", data.gender);

  return (
    <Container>
      <View className="flex-1 px-6 pt-16 pb-8 justify-between bg-background">
        <View>
          <Animated.View entering={FadeInDown.duration(500)}>
            <Text className="text-foreground text-3xl font-bold mb-2">
              Bem-vindo! 👋
            </Text>
            <Text className="text-muted-foreground text-lg mb-8">
              Vamos definir seu perfil biológico.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150).duration(500)}>
            <Text className="text-foreground text-lg font-bold mb-4">
              Gênero
            </Text>
            <View className="flex-row gap-4 mb-8">
              {(["male", "female"] as const).map((g) => {
                // Fix: Define isSelected inside the map loop
                const isSelected = data.gender === g;

                return (
                  <Pressable
                    key={g}
                    onPress={() => update({ gender: g })}
                    className="flex-1 active:scale-95"
                  >
                    <Surface
                      variant="secondary"
                      // Removed the style prop.
                      // Using border-accent classes which map to your CSS variables.
                      className={`py-5 rounded-2xl items-center border-2 transition-colors ${
                        isSelected ? "border-accent" : "border-transparent"
                      }`}
                    >
                      <Text className="text-3xl mb-2">
                        {g === "male" ? "👨" : "👩"}
                      </Text>
                      <Text
                        className={`font-bold text-base ${
                          isSelected ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {g === "male" ? "MASCULINO" : "FEMININO"}
                      </Text>
                    </Surface>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <NumberStepper
              label="Ano de nascimento"
              unit="ano"
              value={data.birthYear}
              onChange={(v) => update({ birthYear: v })}
              min={1940}
              max={2010}
              step={1}
            />
          </Animated.View>
        </View>

        <Animated.View entering={FadeInUp.delay(500).duration(600).springify()}>
          <Button
            size="lg"
            className="h-16"
            onPress={() => router.push("/onboarding/health" as any)}
          >
            <Button.Label className="text-lg">Próximo →</Button.Label>
          </Button>
        </Animated.View>
      </View>
    </Container>
  );
}

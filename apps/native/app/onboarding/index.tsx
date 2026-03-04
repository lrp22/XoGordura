import { useRouter } from "expo-router";
import { Button, Surface, useThemeColor } from "heroui-native";
import { Text, View, Pressable } from "react-native";

import { Container } from "@/components/container";
import { NumberStepper } from "@/components/number-stepper";
import { useOnboarding } from "@/contexts/onboarding-context";

export default function OnboardingWelcome() {
  const router = useRouter();
  const { data, update } = useOnboarding();
  const primaryColor = useThemeColor("accent");

  return (
    <Container>
      <View className="flex-1 px-6 pt-16 pb-8 justify-between">
        <View>
          <Text className="text-foreground text-3xl font-bold mb-2">
            Bem-vindo! 👋
          </Text>
          <Text className="text-muted text-lg mb-8">
            Vamos definir seu perfil biológico.
          </Text>

          <Text className="text-foreground text-lg font-bold mb-4">Gênero</Text>
          <View className="flex-row gap-4 mb-8">
            {(["male", "female"] as const).map((g) => (
              <Pressable
                key={g}
                onPress={() => update({ gender: g })}
                className="flex-1"
              >
                <Surface
                  variant="secondary"
                  className="py-4 rounded-xl items-center"
                  style={
                    data.gender === g
                      ? { borderWidth: 2, borderColor: primaryColor }
                      : { borderWidth: 2, borderColor: "transparent" }
                  }
                >
                  <Text
                    className={`font-bold ${data.gender === g ? "text-primary" : "text-muted"}`}
                  >
                    {g === "male" ? "MASCULINO" : "FEMININO"}
                  </Text>
                </Surface>
              </Pressable>
            ))}
          </View>

          <NumberStepper
            label="Ano de nascimento"
            unit="ano"
            value={data.birthYear}
            onChange={(v) => update({ birthYear: v })}
            min={1940}
            max={2010}
            step={1}
          />
        </View>

        <Button
          size="lg"
          className="h-16"
          onPress={() => router.push("/onboarding/health" as any)}
        >
          <Button.Label className="text-lg">Próximo →</Button.Label>
        </Button>
      </View>
    </Container>
  );
}

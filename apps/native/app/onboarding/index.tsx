import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { NumberStepper } from "@/components/number-stepper";
import { useOnboarding } from "@/contexts/onboarding-context";
import { authClient } from "@/lib/auth-client";

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

export default function OnboardingWelcome() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { data, update } = useOnboarding();

  const firstName = session?.user?.name?.split(" ")[0] ?? "você";

  return (
    <Container>
      <View className="flex-1 px-6 pt-16 pb-8 justify-between">
        {/* Top section */}
        <View>
          <StepProgress current={1} />

          <Text className="text-5xl mb-4">👋</Text>

          <Text className="text-foreground text-3xl font-bold mb-3">
            Olá, {firstName}!
          </Text>

          <Text className="text-muted text-xl leading-8 mb-8">
            Vamos configurar tudo{"\n"}
            pra te ajudar a ficar{"\n"}
            mais saudável 💚
          </Text>
        </View>

        {/* Birth year stepper */}
        <View className="items-center py-8">
          <NumberStepper
            label="Ano de nascimento"
            unit="ano"
            value={data.birthYear}
            onChange={(v) => update({ birthYear: v })}
            min={1930}
            max={2010}
            step={1}
            decimals={0}
          />
        </View>

        {/* Next button */}
        <Button
          size="lg"
          className="w-full h-16"
          onPress={() => router.push("/onboarding/body")}
        >
          <Button.Label className="text-lg">Próximo →</Button.Label>
        </Button>
      </View>
    </Container>
  );
}

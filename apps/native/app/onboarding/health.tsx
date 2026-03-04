import { useRouter } from "expo-router";
import { Button, Surface, useThemeColor } from "heroui-native";
import { Text, View, Pressable } from "react-native";

import { Container } from "@/components/container";
import { NumberStepper } from "@/components/number-stepper";
import {
  useOnboarding,
  type DiabetesType,
} from "@/contexts/onboarding-context";

const DIABETES_TYPES: {
  key: DiabetesType;
  label: string;
  description: string;
}[] = [
  {
    key: "type2",
    label: "Tipo 2",
    description: "O mais comum — resistência à insulina",
  },
  {
    key: "type1",
    label: "Tipo 1",
    description: "Autoimune — o corpo não produz insulina",
  },
  {
    key: "prediabetes",
    label: "Pré-diabetes",
    description: "Glicose elevada, mas ainda não diabético",
  },
  {
    key: "gestational",
    label: "Gestacional",
    description: "Desenvolvido durante a gravidez",
  },
];

export default function OnboardingHealth() {
  const router = useRouter();
  const { data, update } = useOnboarding();
  const primaryColor = useThemeColor("accent");

  function toggleDiabetes(value: boolean) {
    if (value) {
      update({
        hasDiabetes: true,
        diabetesType: "type2",
        dailySugarLimitG: 25,
        // Default to lower_carb for diabetics
        macroPreset: "lower_carb",
      });
    } else {
      update({
        hasDiabetes: false,
        diabetesType: null,
        dailySugarLimitG: null,
        macroPreset: "moderate",
      });
    }
  }

  return (
    <Container>
      <View className="flex-1 px-6 pt-16 pb-8 justify-between">
        <View>
          <Text className="text-foreground text-3xl font-bold mb-2">
            Saúde 🩺
          </Text>
          <Text className="text-muted text-lg mb-8">
            Nos ajude a personalizar sua experiência.
          </Text>

          {/* ── Diabetes toggle ───────────────── */}
          <Text className="text-foreground text-lg font-bold mb-4">
            Você tem diabetes?
          </Text>
          <View className="flex-row gap-4 mb-6">
            {[
              { value: false, label: "NÃO", emoji: "👍" },
              { value: true, label: "SIM", emoji: "🩺" },
            ].map((opt) => (
              <Pressable
                key={String(opt.value)}
                onPress={() => toggleDiabetes(opt.value)}
                className="flex-1 active:opacity-80"
              >
                <Surface
                  variant="secondary"
                  className="py-5 rounded-xl items-center gap-1"
                  style={
                    data.hasDiabetes === opt.value
                      ? { borderWidth: 2, borderColor: primaryColor }
                      : { borderWidth: 2, borderColor: "transparent" }
                  }
                >
                  <Text className="text-2xl">{opt.emoji}</Text>
                  <Text
                    className={`font-bold ${data.hasDiabetes === opt.value ? "text-primary" : "text-muted"}`}
                  >
                    {opt.label}
                  </Text>
                </Surface>
              </Pressable>
            ))}
          </View>

          {/* ── Diabetes type (only if yes) ──── */}
          {data.hasDiabetes && (
            <View className="gap-4">
              <Text className="text-foreground text-lg font-bold">
                Qual tipo?
              </Text>
              <View className="gap-2">
                {DIABETES_TYPES.map((type) => {
                  const isSelected = data.diabetesType === type.key;
                  return (
                    <Pressable
                      key={type.key}
                      onPress={() => update({ diabetesType: type.key })}
                      className="active:opacity-80"
                    >
                      <Surface
                        variant="secondary"
                        className="py-3 px-4 rounded-xl flex-row items-center gap-3"
                        style={
                          isSelected
                            ? { borderWidth: 2, borderColor: primaryColor }
                            : { borderWidth: 2, borderColor: "transparent" }
                        }
                      >
                        <View className="flex-1">
                          <Text
                            className={`text-base font-bold ${isSelected ? "text-primary" : "text-foreground"}`}
                          >
                            {type.label}
                          </Text>
                          <Text className="text-muted text-xs">
                            {type.description}
                          </Text>
                        </View>
                      </Surface>
                    </Pressable>
                  );
                })}
              </View>

              {/* ── Sugar limit ──────────────── */}
              <View className="mt-4">
                <NumberStepper
                  label="Limite diário de açúcar"
                  unit="g"
                  value={data.dailySugarLimitG ?? 25}
                  onChange={(v) => update({ dailySugarLimitG: v })}
                  min={10}
                  max={100}
                  step={5}
                />
                <Text className="text-muted text-xs text-center mt-2">
                  OMS recomenda máx. 25g/dia para diabéticos
                </Text>
              </View>

              {/* ── Info card ────────────────── */}
              <Surface
                variant="secondary"
                className="p-4 rounded-xl flex-row items-start gap-3 mt-2"
              >
                <Text className="text-2xl">💡</Text>
                <View className="flex-1">
                  <Text className="text-foreground text-sm font-medium mb-1">
                    O que muda para diabéticos?
                  </Text>
                  <Text className="text-muted text-xs leading-5">
                    • Rastreamento de açúcar e fibra em cada refeição{"\n"}•
                    Indicador de carga glicêmica por alimento{"\n"}•
                    Carboidratos líquidos (carbs - fibra){"\n"}• Distribuição de
                    macros com menos carboidratos{"\n"}• Dicas da IA adaptadas
                    para controle glicêmico
                  </Text>
                </View>
              </Surface>
            </View>
          )}
        </View>

        <Button
          size="lg"
          className="h-16 mt-6"
          onPress={() => router.push("/onboarding/body")}
        >
          <Button.Label className="text-lg">Próximo →</Button.Label>
        </Button>
      </View>
    </Container>
  );
}

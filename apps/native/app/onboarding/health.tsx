import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { Text, View, Pressable } from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
} from "react-native-reanimated";

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

  function toggleDiabetes(value: boolean) {
    if (value) {
      update({
        hasDiabetes: true,
        diabetesType: "type2",
        dailySugarLimitG: 25,
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
      <View className="flex-1 px-6 pt-16 pb-8 justify-between bg-background">
        <View>
          <Animated.View entering={FadeInDown.duration(500)}>
            <Text className="text-foreground text-3xl font-bold mb-2">
              Saúde 🩺
            </Text>
            <Text className="text-muted-foreground text-lg mb-8">
              Nos ajude a personalizar sua experiência.
            </Text>
          </Animated.View>

          {/* ── Diabetes toggle ───────────────── */}
          <Animated.View entering={FadeInDown.delay(150).duration(500)}>
            <Text className="text-foreground text-xs font-bold uppercase tracking-wider mb-4 px-1">
              Você tem diabetes?
            </Text>
            <View className="flex-row gap-4 mb-6">
              {[
                { value: false, label: "NÃO", emoji: "👍" },
                { value: true, label: "SIM", emoji: "🩺" },
              ].map((opt) => {
                const isSelected = data.hasDiabetes === opt.value;
                return (
                  <Pressable
                    key={String(opt.value)}
                    onPress={() => toggleDiabetes(opt.value)}
                    className="flex-1 active:scale-95"
                  >
                    <View
                      className={`py-5 rounded-3xl items-center border-2 transition-colors ${isSelected ? "bg-card border-primary" : "bg-muted/30 border-transparent"}`}
                    >
                      <Text className="text-3xl mb-2">{opt.emoji}</Text>
                      <Text
                        className={`font-bold text-xs tracking-widest uppercase ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                      >
                        {opt.label}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* ── Diabetes details (only if yes) ──── */}
          {!!data.hasDiabetes && (
            <Animated.View entering={FadeIn.duration(400)} className="gap-4">
              <Text className="text-foreground text-xs font-bold uppercase tracking-wider px-1">
                Qual tipo?
              </Text>
              <View className="gap-2">
                {DIABETES_TYPES.map((type, i) => {
                  const isTypeSelected = data.diabetesType === type.key;
                  return (
                    <Animated.View
                      key={type.key}
                      entering={FadeInDown.delay(i * 60)
                        .duration(400)
                        .springify()}
                    >
                      <Pressable
                        onPress={() => update({ diabetesType: type.key })}
                        className="active:scale-[0.98]"
                      >
                        <View
                          className={`py-4 px-5 rounded-3xl flex-row items-center border-2 transition-colors ${isTypeSelected ? "bg-card border-primary" : "bg-muted/30 border-transparent"}`}
                        >
                          <View className="flex-1">
                            <Text
                              className={`text-base font-bold ${isTypeSelected ? "text-primary" : "text-foreground"}`}
                            >
                              {type.label}
                            </Text>
                            <Text className="text-muted-foreground text-xs mt-0.5">
                              {type.description}
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </View>

              {/* ── Sugar limit ──────────────── */}
              <Animated.View entering={FadeInDown.delay(250).duration(400)}>
                <View className="bg-card rounded-3xl p-5 border border-border mt-2">
                  <NumberStepper
                    label="Limite diário de açúcar"
                    unit="g"
                    value={data.dailySugarLimitG ?? 25}
                    onChange={(v) => update({ dailySugarLimitG: v })}
                    min={10}
                    max={100}
                    step={5}
                  />
                  <Text className="text-muted-foreground text-xs text-center mt-2 font-medium">
                    OMS recomenda máx. 25g/dia para diabéticos
                  </Text>
                </View>
              </Animated.View>

              {/* ── Info card (Restored!) ────────────────── */}
              <Animated.View entering={FadeInDown.delay(350).duration(400)}>
                <View className="bg-card p-5 rounded-3xl flex-row items-start gap-4 border border-border mt-2">
                  <Text className="text-2xl mt-1">💡</Text>
                  <View className="flex-1">
                    <Text className="text-foreground text-sm font-bold mb-2">
                      O que muda para diabéticos?
                    </Text>
                    <Text className="text-muted-foreground text-xs leading-5">
                      • Rastreamento de açúcar e fibra em cada refeição{"\n"}•
                      Indicador de carga glicêmica por alimento{"\n"}•
                      Carboidratos líquidos (carbs - fibra){"\n"}• Distribuição
                      de macros com menos carboidratos{"\n"}• Dicas da IA
                      adaptadas para controle glicêmico
                    </Text>
                  </View>
                </View>
              </Animated.View>
            </Animated.View>
          )}
        </View>

        <Animated.View entering={FadeInUp.delay(400).duration(600).springify()}>
          <Button
            size="lg"
            className="h-16 mt-6 rounded-3xl bg-primary"
            onPress={() => router.push("/onboarding/body" as any)}
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

import { useQuery } from "@tanstack/react-query";
import { Spinner, Surface } from "heroui-native";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { orpc } from "@/utils/orpc";

export default function ProgressScreen() {
  const weightQuery = useQuery(orpc.weight.getHistory.queryOptions());
  const weights = weightQuery.data ?? [];

  const latest = weights[weights.length - 1];
  const first = weights[0];
  const diff =
    latest && first ? +(latest.weightKg - first.weightKg).toFixed(1) : 0;

  return (
    <Container>
      <View className="px-6 pt-4 pb-8 gap-6">
        {/* Weight summary */}
        <Surface variant="secondary" className="p-6 rounded-2xl items-center">
          <Text className="text-muted text-lg mb-2">Peso atual</Text>

          {weightQuery.isLoading ? (
            <Spinner size="lg" />
          ) : latest ? (
            <>
              <Text className="text-foreground text-5xl font-bold">
                {latest.weightKg.toFixed(1)}
              </Text>
              <Text className="text-muted text-lg">kg</Text>

              {weights.length > 1 && (
                <Text
                  className={`text-lg font-semibold mt-3 ${diff <= 0 ? "text-success" : "text-danger"}`}
                >
                  {diff <= 0 ? "↓" : "↑"} {Math.abs(diff)} kg desde o início
                </Text>
              )}
            </>
          ) : (
            <Text className="text-muted text-base">Nenhum peso registrado</Text>
          )}
        </Surface>

        {/* Weight history list */}
        <View>
          <Text className="text-foreground text-xl font-bold mb-3">
            Histórico
          </Text>

          {weights.length === 0 ? (
            <Surface
              variant="secondary"
              className="p-8 rounded-2xl items-center"
            >
              <Text className="text-4xl mb-3">📊</Text>
              <Text className="text-muted text-base text-center">
                Em breve: gráfico de progresso{"\n"}e registro de peso
              </Text>
            </Surface>
          ) : (
            <View className="gap-2">
              {[...weights]
                .reverse()
                .slice(0, 20)
                .map((entry) => (
                  <Surface
                    key={entry.id}
                    variant="secondary"
                    className="p-4 rounded-xl flex-row justify-between items-center"
                  >
                    <Text className="text-foreground text-base">
                      {new Date(`${entry.date}T12:00:00`).toLocaleDateString(
                        "pt-BR",
                        { day: "numeric", month: "short" },
                      )}
                    </Text>
                    <Text className="text-foreground text-lg font-bold">
                      {entry.weightKg.toFixed(1)} kg
                    </Text>
                  </Surface>
                ))}
            </View>
          )}
        </View>
      </View>
    </Container>
  );
}

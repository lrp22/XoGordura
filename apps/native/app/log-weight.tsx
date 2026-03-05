import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Button, Spinner } from "heroui-native";
import { Platform, Text, View } from "react-native";
import { useState, useEffect } from "react";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";

import { Container } from "@/components/container";
import { NumberStepper } from "@/components/number-stepper";
import { getLocalToday } from "@/lib/date";
import { queryClient, orpc } from "@/utils/orpc";

export default function LogWeight() {
  const router = useRouter();

  const profileQuery = useQuery(orpc.profile.get.queryOptions());
  const [weight, setWeight] = useState<number | null>(null);

  useEffect(() => {
    if (profileQuery.data?.currentWeightKg != null && weight === null) {
      setWeight(profileQuery.data.currentWeightKg);
    }
  }, [profileQuery.data?.currentWeightKg, weight]);

  const displayWeight = weight ?? profileQuery.data?.currentWeightKg ?? 70;

  const saveMutation = useMutation(
    orpc.weight.log.mutationOptions({
      onSuccess: async () => {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        await queryClient.invalidateQueries();
        router.back();
      },
    }),
  );

  function handleSave() {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    saveMutation.mutate({
      date: getLocalToday(),
      weightKg: displayWeight,
    });
  }

  if (profileQuery.isLoading) {
    return (
      <Container isScrollable={false}>
        <View className="flex-1 items-center justify-center gap-4">
          <Spinner size="lg" />
          <Text className="text-muted-foreground text-lg">
            Carregando perfil...
          </Text>
        </View>
      </Container>
    );
  }

  return (
    <Container isScrollable={false}>
      <View className="flex-1 px-6 pt-8 pb-8 justify-between">
        <Animated.View
          entering={FadeInDown.duration(600).springify()}
          className="items-center gap-4"
        >
          <Text className="text-5xl">⚖️</Text>
          <Text className="text-foreground text-2xl font-bold">
            Registrar Peso
          </Text>
          <Text className="text-muted-foreground text-base">
            {new Date().toLocaleDateString("pt-BR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(200).duration(500)}>
          <NumberStepper
            label="Peso"
            unit="kg"
            value={displayWeight}
            onChange={setWeight}
            min={30}
            max={250}
            step={0.1}
            decimals={1}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(400).duration(600).springify()}
          className="gap-3"
        >
          {saveMutation.isError && (
            <Text className="text-destructive text-base text-center">
              Erro ao salvar. Tente novamente.
            </Text>
          )}

          <Button
            size="lg"
            className="w-full h-16"
            onPress={handleSave}
            isDisabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Spinner size="sm" color="default" />
            ) : (
              <Button.Label className="text-lg">Salvar Peso</Button.Label>
            )}
          </Button>

          <Button
            size="lg"
            variant="ghost"
            className="w-full h-14"
            onPress={() => router.back()}
          >
            <Button.Label className="text-base text-muted-foreground">
              Cancelar
            </Button.Label>
          </Button>
        </Animated.View>
      </View>
    </Container>
  );
}

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Button, Surface, Spinner } from "heroui-native";
import { Text, View, Pressable } from "react-native";
import { Container } from "@/components/container";
import { useOnboarding } from "@/contexts/onboarding-context";
import { calcGoals } from "@/lib/calories";
import { queryClient, orpc } from "@/utils/orpc";

export default function OnboardingActivity() {
  const router = useRouter();
  const { data } = useOnboarding();

  // Cálculo final usando a nova lógica
  const results = calcGoals(
    data.currentWeightKg,
    data.heightCm,
    data.birthYear,
    data.gender,
    data.activityLevel,
    data.deficitPercentage,
  );

  const saveProfile = useMutation(orpc.profile.upsert.mutationOptions());
  const saveWeight = useMutation(orpc.weight.log.mutationOptions());

  async function handleComplete() {
    const today = new Date().toISOString().split("T")[0];
    await saveProfile.mutateAsync({
      birthDate: `${data.birthYear}-01-01`,
      gender: data.gender,
      heightCm: data.heightCm,
      currentWeightKg: data.currentWeightKg,
      dailyCalorieGoal: results.calories,
      dailyProteinGoal: results.protein,
      dailyCarbsGoal: results.carbs,
      dailyFatGoal: results.fat,
      activityLevel: data.activityLevel,
    });
    await saveWeight.mutateAsync({
      date: today,
      weightKg: data.currentWeightKg,
    });
    await queryClient.invalidateQueries();
    router.replace("/(tabs)");
  }

  return (
    <Container>
      <View className="flex-1 px-6 pt-16 pb-8 justify-between">
        <View>
          <Text className="text-foreground text-3xl font-bold mb-2">
            Resumo do Plano 📋
          </Text>
          <Surface variant="secondary" className="p-6 rounded-2xl mt-4 gap-4">
            <View className="items-center border-b border-muted/20 pb-4">
              <Text className="text-muted">Meta Diária</Text>
              <Text className="text-primary text-5xl font-bold">
                {results.calories} kcal
              </Text>
            </View>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="font-bold text-lg">{results.protein}g</Text>
                <Text className="text-muted text-xs">Proteína</Text>
              </View>
              <View className="items-center">
                <Text className="font-bold text-lg">{results.carbs}g</Text>
                <Text className="text-muted text-xs">Carbos</Text>
              </View>
              <View className="items-center">
                <Text className="font-bold text-lg">{results.fat}g</Text>
                <Text className="text-muted text-xs">Gordura</Text>
              </View>
            </View>
            <View className="mt-2 pt-4 border-t border-muted/20">
              <Text className="text-muted text-center text-xs">
                BMR: {results.bmr} | TDEE: {results.tdee}
              </Text>
            </View>
          </Surface>
        </View>

        <Button
          size="lg"
          className="h-16"
          onPress={handleComplete}
          isDisabled={saveProfile.isPending}
        >
          {saveProfile.isPending ? (
            <Spinner color="default" />
          ) : (
            <Button.Label className="text-lg">Começar Agora! 🚀</Button.Label>
          )}
        </Button>
      </View>
    </Container>
  );
}

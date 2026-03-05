import { Stack } from "expo-router";
import { useThemeColor } from "heroui-native";

import { LogMealProvider } from "@/contexts/log-meal-context";

export default function LogMealLayout() {
  const foregroundColor = useThemeColor("foreground");
  const backgroundColor = useThemeColor("background");
  console.log("Background Color:", backgroundColor);
  return (
    <LogMealProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor },
          headerTintColor: foregroundColor,
          headerTitleStyle: { fontWeight: "600", fontSize: 18 },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Registrar Refeição" }} />
        <Stack.Screen
          name="confirm"
          options={{ title: "Confirmar", headerBackTitle: "Voltar" }}
        />
      </Stack>
    </LogMealProvider>
  );
}

// apps/native/app/log-meal/_layout.tsx
import { Stack } from "expo-router";
import { useAppTheme } from "@/contexts/app-theme-context";
import { LogMealProvider } from "@/contexts/log-meal-context";

export default function LogMealLayout() {
  const { isLight } = useAppTheme();
  
  // Explicitly map your theme colors
  const backgroundColor = isLight ? "#faf8f1" : "#262626";
  const foregroundColor = isLight ? "#3d3826" : "#c3c1ba";

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
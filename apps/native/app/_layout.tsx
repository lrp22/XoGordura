import "@/global.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { HeroUINativeProvider } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppThemeProvider } from "@/contexts/app-theme-context";
import { queryClient } from "@/utils/orpc";

export default function RootLayout() {
  console.count("RootLayout render");
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <KeyboardProvider>
            <AppThemeProvider>
              <HeroUINativeProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="onboarding" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen
                    name="log-meal"
                    options={{ presentation: "modal" }}
                  />
                  <Stack.Screen
                    name="log-weight"
                    options={{
                      presentation: "modal",
                      headerShown: true,
                      headerTitle: "",
                    }}
                  />
                  <Stack.Screen
                    name="edit-goals"
                    options={{
                      presentation: "modal",
                      headerShown: true,
                      headerTitle: "Editar Metas",
                    }}
                  />
                  <Stack.Screen
                    name="+not-found"
                    options={{ headerShown: true, title: "Not Found" }}
                  />
                </Stack>
              </HeroUINativeProvider>
            </AppThemeProvider>
          </KeyboardProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

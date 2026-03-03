import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { useThemeColor } from "heroui-native";

import { ThemeToggle } from "@/components/theme-toggle";
import { authClient } from "@/lib/auth-client";

export default function TabsLayout() {
  const foregroundColor = useThemeColor("foreground");
  const backgroundColor = useThemeColor("background");
  const { data: session, isPending } = authClient.useSession();

  // If session is lost (sign out), go back to gate
  if (!isPending && session === null) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor },
        headerTintColor: foregroundColor,
        headerTitleStyle: { fontWeight: "600", fontSize: 18 },
        headerRight: () => <ThemeToggle />,
        tabBarStyle: {
          backgroundColor,
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        tabBarActiveTintColor: foregroundColor,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          headerTitle: "XoGordura",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progresso",
          headerTitle: "Progresso",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trending-up" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          headerTitle: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

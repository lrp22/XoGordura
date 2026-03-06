// apps/native/app/(tabs)/_layout.tsx

import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { ThemeToggle } from "@/components/theme-toggle";
import { authClient } from "@/lib/auth-client";
import { useAppTheme } from "@/contexts/app-theme-context"; // Import your context

export default function TabsLayout() {
  const { data: session, isPending } = authClient.useSession();
  const { isLight } = useAppTheme(); // Get the current theme state

  // Map your requested Hex colors strictly to JS variables
  const backgroundColor = isLight ? "#faf8f1" : "#262626";
  const foregroundColor = isLight ? "#3d3826" : "#c3c1ba";
  const inactiveColor = isLight ? "#85837d" : "#51504a";
  const primaryColor = isLight ? "#cb6441" : "#d87757";

  if (!isPending && session === null) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor },
        headerTintColor: foregroundColor,
        headerTitleStyle: { fontWeight: "600", fontSize: 18 },
        headerRight: () => <ThemeToggle />,
        tabBarStyle: {
          elevation: 0,
          shadowOpacity: 0,
          borderTopWidth: 1,
          borderTopColor: isLight ? "#e1e1da" : "#3e3e38", // Add a subtle separator
          backgroundColor: backgroundColor, // Now strictly matches background
          height: 70,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        tabBarActiveTintColor: primaryColor, // Active icon/text in theme primary
        tabBarInactiveTintColor: inactiveColor, // Inactive in theme muted
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progresso",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trending-up" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

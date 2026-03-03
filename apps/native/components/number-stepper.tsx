import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useThemeColor } from "heroui-native";
import { Platform, Pressable, Text, View } from "react-native";

interface NumberStepperProps {
  label: string;
  unit: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  decimals?: number;
}

export function NumberStepper({
  label,
  unit,
  value,
  onChange,
  min,
  max,
  step,
  decimals = 0,
}: NumberStepperProps) {
  const foregroundColor = useThemeColor("foreground");
  const isMin = value <= min;
  const isMax = value >= max;

  function handlePress(delta: number) {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Round to avoid floating point drift
    const precision = decimals + 1;
    const factor = 10 ** precision;
    const newValue = Math.round((value + delta) * factor) / factor;
    onChange(Math.max(min, Math.min(max, newValue)));
  }

  return (
    <View className="items-center gap-2 py-3">
      <Text className="text-foreground text-lg font-medium">
        {label} ({unit})
      </Text>

      <View className="flex-row items-center gap-5">
        {/* Minus button */}
        <Pressable
          onPress={() => handlePress(-step)}
          disabled={isMin}
          className={`w-16 h-16 rounded-2xl bg-muted items-center justify-center active:opacity-60 ${isMin ? "opacity-30" : ""}`}
        >
          <Ionicons name="remove" size={32} color={foregroundColor} />
        </Pressable>

        {/* Value display */}
        <View className="items-center min-w-[120px]">
          <Text className="text-foreground text-5xl font-bold tabular-nums">
            {value.toFixed(decimals)}
          </Text>
        </View>

        {/* Plus button */}
        <Pressable
          onPress={() => handlePress(step)}
          disabled={isMax}
          className={`w-16 h-16 rounded-2xl bg-muted items-center justify-center active:opacity-60 ${isMax ? "opacity-30" : ""}`}
        >
          <Ionicons name="add" size={32} color={foregroundColor} />
        </Pressable>
      </View>
    </View>
  );
}

import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useThemeColor } from "heroui-native";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import { useState, useEffect } from "react";

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
  const accentColor = useThemeColor("accent");
  const isMin = value <= min;
  const isMax = value >= max;

  const [textValue, setTextValue] = useState(value.toFixed(decimals));

  useEffect(() => {
    setTextValue(value.toFixed(decimals));
  }, [value, decimals]);

  function handleBlur() {
    let parsed = parseFloat(textValue.replace(",", "."));
    if (isNaN(parsed)) parsed = min;
    parsed = Math.max(min, Math.min(max, parsed));
    onChange(parsed);
    setTextValue(parsed.toFixed(decimals));
  }

  function handlePress(delta: number) {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const precision = decimals + 1;
    const factor = 10 ** precision;
    const newValue = Math.max(
      min,
      Math.min(max, Math.round((value + delta) * factor) / factor),
    );
    onChange(newValue);
  }

  return (
    <View className="items-center gap-2 py-4">
      <Text className="text-muted-foreground text-base font-semibold tracking-wide uppercase">
        {label} ({unit})
      </Text>

      <View className="flex-row items-center gap-5">
        <Pressable
          onPress={() => handlePress(-step)}
          disabled={isMin}
          className={`w-16 h-16 rounded-2xl bg-secondary items-center justify-center active:scale-90 ${
            isMin ? "opacity-30" : ""
          }`}
        >
          <Ionicons name="remove" size={32} color={foregroundColor} />
        </Pressable>

        <TextInput
          value={textValue}
          onChangeText={setTextValue}
          onBlur={handleBlur}
          keyboardType="numeric"
          returnKeyType="done"
          className="text-foreground text-5xl font-bold tabular-nums text-center min-w-[130px]"
          style={{ color: foregroundColor }}
          selectionColor={accentColor}
        />

        <Pressable
          onPress={() => handlePress(step)}
          disabled={isMax}
          className={`w-16 h-16 rounded-2xl bg-secondary items-center justify-center active:scale-90 ${
            isMax ? "opacity-30" : ""
          }`}
        >
          <Ionicons name="add" size={32} color={foregroundColor} />
        </Pressable>
      </View>
    </View>
  );
}

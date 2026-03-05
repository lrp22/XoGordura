import { Text, View, useColorScheme } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { ringColors } from "@/constants/ring-colors";

interface MacroRingProps {
  label: string;
  emoji: string;
  consumed: number;
  goal: number;
  unit?: string;
  macroType: "protein" | "carbs" | "fat" | "sugar" | "fiber" | "netCarbs";
  size?: number;
  strokeWidth?: number;
  index?: number;
}

export function MacroRing({
  label,
  emoji,
  consumed,
  goal,
  unit = "g",
  macroType,
  size = 90,
  strokeWidth = 8,
  index = 0,
}: MacroRingProps) {
  const scheme = useColorScheme();
  const colors = ringColors[scheme === "dark" ? "dark" : "light"];

  const baseColor = colors[macroType];

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(consumed / Math.max(goal, 1), 1);
  const offset = circumference * (1 - progress);
  const isOver = consumed > goal;
  const remaining = goal - consumed;

  const ringColor = isOver ? colors.danger : baseColor;

  return (
    <Animated.View
      entering={FadeInUp.delay(400 + index * 100)
        .duration(500)
        .springify()}
      className="items-center"
    >
      <View
        style={{
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.track}
            strokeWidth={strokeWidth}
            fill="none"
            opacity={0.3}
          />
          {consumed > 0 && (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={ringColor}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${size / 2}, ${size / 2}`}
            />
          )}
        </Svg>

        <View style={{ position: "absolute", alignItems: "center" }}>
          <Text className="text-foreground text-lg font-bold tabular-nums">
            {Math.round(consumed)}
          </Text>
          <Text className="text-muted-foreground" style={{ fontSize: 12 }}>
            /{goal}
            {unit}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-1 mt-1.5">
        <Text style={{ fontSize: 12 }}>{emoji}</Text>
        <Text className="text-foreground text-xs font-semibold">{label}</Text>
      </View>

      <Text
        className={`font-bold mt-0.5 ${
          remaining >= 0 ? "text-primary" : "text-danger"
        }`}
        style={{ fontSize: 12 }}
      >
        {remaining >= 0
          ? `${Math.round(remaining)}${unit}`
          : `${Math.abs(Math.round(remaining))}${unit} extra`}
      </Text>
    </Animated.View>
  );
}

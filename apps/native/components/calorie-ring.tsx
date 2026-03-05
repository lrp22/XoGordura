import { Text, View } from "react-native";
import { useColorScheme } from "react-native";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { ringColors } from "@/constants/ring-colors";

interface CalorieRingProps {
  consumed: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
}

export function CalorieRing({
  consumed,
  goal,
  size = 220,
  strokeWidth = 18,
}: CalorieRingProps) {
  const scheme = useColorScheme();
  const colors = ringColors[scheme === "dark" ? "dark" : "light"];

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(consumed / Math.max(goal, 1), 1);
  const offset = circumference * (1 - progress);
  const isOver = consumed > goal;
  const remaining = goal - consumed;

  return (
    <Animated.View
      entering={ZoomIn.duration(600).springify()}
      className="items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.track}
          strokeWidth={strokeWidth}
          fill="none"
          opacity={0.3}
        />

        {/* Progress arc */}
        {consumed > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isOver ? colors.danger : colors.success}
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

      <Animated.View
        entering={FadeIn.delay(300).duration(400)}
        className="absolute items-center"
      >
        <Text className="text-foreground text-5xl font-bold tabular-nums">
          {consumed.toLocaleString("pt-BR")}
        </Text>
        <Text className="text-muted-foreground text-base mt-1">
          de {goal.toLocaleString("pt-BR")} kcal
        </Text>
        <Text
          className={`text-lg font-bold mt-2 ${
            remaining >= 0 ? "text-primary" : "text-danger"
          }`}
        >
          {remaining >= 0
            ? `Restam ${remaining.toLocaleString("pt-BR")}`
            : `${Math.abs(remaining).toLocaleString("pt-BR")} acima`}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

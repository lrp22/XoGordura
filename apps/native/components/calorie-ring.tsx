import { useThemeColor } from "heroui-native";
import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

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
  const mutedColor = useThemeColor("muted");

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(consumed / Math.max(goal, 1), 1);
  const offset = circumference * (1 - progress);
  const isOver = consumed > goal;
  const remaining = goal - consumed;

  const progressColor = isOver ? "#E53935" : "#4CAF50";

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={size} height={size}>
        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={mutedColor}
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
            stroke={progressColor}
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

      {/* Center text */}
      <View style={{ position: "absolute", alignItems: "center" }}>
        <Text className="text-foreground text-5xl font-bold tabular-nums">
          {consumed.toLocaleString("pt-BR")}
        </Text>
        <Text className="text-muted text-base mt-1">
          de {goal.toLocaleString("pt-BR")} kcal
        </Text>
        <Text
          className={`text-lg font-semibold mt-2 ${remaining >= 0 ? "text-success" : "text-danger"}`}
        >
          {remaining >= 0
            ? `Restam ${remaining.toLocaleString("pt-BR")}`
            : `${Math.abs(remaining).toLocaleString("pt-BR")} acima`}
        </Text>
      </View>
    </View>
  );
}

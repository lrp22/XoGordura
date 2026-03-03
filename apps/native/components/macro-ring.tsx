import { useThemeColor } from "heroui-native";
import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

interface MacroRingProps {
  label: string;
  emoji: string;
  consumed: number;
  goal: number;
  unit?: string;
  color: string;
  size?: number;
  strokeWidth?: number;
}

export function MacroRing({
  label,
  emoji,
  consumed,
  goal,
  unit = "g",
  color,
  size = 90,
  strokeWidth = 8,
}: MacroRingProps) {
  const mutedColor = useThemeColor("muted");

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(consumed / Math.max(goal, 1), 1);
  const offset = circumference * (1 - progress);
  const isOver = consumed > goal;
  const remaining = goal - consumed;

  const ringColor = isOver ? "#E53935" : color;

  return (
    <View className="items-center">
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
            opacity={0.25}
          />
          {/* Progress arc */}
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

        {/* Center content */}
        <View style={{ position: "absolute", alignItems: "center" }}>
          <Text className="text-foreground text-lg font-bold tabular-nums">
            {Math.round(consumed)}
          </Text>
          <Text className="text-muted" style={{ fontSize: 9 }}>
            /{goal}
            {unit}
          </Text>
        </View>
      </View>

      {/* Label below */}
      <View className="flex-row items-center gap-1 mt-1.5">
        <Text style={{ fontSize: 12 }}>{emoji}</Text>
        <Text className="text-muted text-xs font-medium">{label}</Text>
      </View>

      {/* Remaining / over */}
      <Text
        className={`text-xs font-semibold mt-0.5 ${remaining >= 0 ? "text-muted" : "text-danger"}`}
        style={{ fontSize: 10 }}
      >
        {remaining >= 0
          ? `${Math.round(remaining)}${unit} restam`
          : `${Math.abs(Math.round(remaining))}${unit} acima`}
      </Text>
    </View>
  );
}

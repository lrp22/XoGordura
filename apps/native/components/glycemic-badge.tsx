import { Text, View } from "react-native";

const GLYCEMIC_CONFIG: Record<
  string,
  { bg: string; text: string; label: string; emoji: string }
> = {
  low: {
    bg: "bg-success/20",
    text: "text-success",
    label: "IG Baixo",
    emoji: "🟢",
  },
  medium: {
    bg: "bg-warning/20",
    text: "text-warning",
    label: "IG Médio",
    emoji: "🟡",
  },
  high: {
    bg: "bg-danger/20",
    text: "text-danger",
    label: "IG Alto",
    emoji: "🔴",
  },
};

interface GlycemicBadgeProps {
  level: "low" | "medium" | "high";
  compact?: boolean;
}

export function GlycemicBadge({ level, compact = false }: GlycemicBadgeProps) {
  const config = GLYCEMIC_CONFIG[level] ?? GLYCEMIC_CONFIG.medium;

  if (compact) {
    return (
      <View
        className={`${config.bg} px-2 py-0.5 rounded flex-row items-center gap-1`}
      >
        <Text style={{ fontSize: 8 }}>{config.emoji}</Text>
        <Text
          className={`${config.text} font-semibold`}
          style={{ fontSize: 9 }}
        >
          {config.label}
        </Text>
      </View>
    );
  }

  return (
    <View
      className={`${config.bg} px-3 py-1 rounded-full flex-row items-center gap-1`}
    >
      <Text style={{ fontSize: 10 }}>{config.emoji}</Text>
      <Text className={`${config.text} text-xs font-semibold`}>
        {config.label}
      </Text>
    </View>
  );
}

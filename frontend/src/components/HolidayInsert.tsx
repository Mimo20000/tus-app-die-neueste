import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing, radius, font } from "@/src/theme";
import { Holiday } from "@/src/api";
import { formatDate } from "@/src/ui";

export default function HolidayInsert({ holiday }: { holiday: Holiday }) {
  const isFerien = holiday.kind === "ferien";
  const s = formatDate(holiday.date);
  const range = holiday.end
    ? `${s.day}. ${s.month} – ${formatDate(holiday.end).day}. ${formatDate(holiday.end).month}`
    : `${s.weekday}, ${s.day}. ${s.month} ${holiday.date.slice(0, 4)}`;
  return (
    <View style={styles.holidayRow} testID={`holiday-${holiday.name}`}>
      <View style={[styles.holidayIcon, isFerien ? styles.ferienIcon : styles.feiertagIcon]}>
        <Ionicons
          name={isFerien ? "sunny" : "flag"}
          size={15}
          color={isFerien ? "#B26A00" : colors.brand}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.holidayName}>
          {isFerien ? "Ferien · " : "Feiertag · "}
          {holiday.name}
        </Text>
        <Text style={styles.holidayRange}>{range}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  holidayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  holidayIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  feiertagIcon: { backgroundColor: colors.brandSecondary },
  ferienIcon: { backgroundColor: "#FFF3D6" },
  holidayName: { fontFamily: font.bold, fontSize: 14, color: colors.onSurface },
  holidayRange: { fontFamily: font.regular, fontSize: 12, color: colors.muted, marginTop: 2 },
});

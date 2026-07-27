import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";

import { colors, spacing, radius, font } from "@/src/theme";

export default function EmptyState() {
  return (
    <View style={styles.empty}>
      <Image
        source={{ uri: "https://images.unsplash.com/photo-1587384474964-3a06ce1ce699?crop=entropy&cs=srgb&fm=jpg&w=400&q=70" }}
        style={styles.emptyImg}
        contentFit="cover"
      />
      <Text style={styles.emptyTitle}>Keine anstehenden Termine</Text>
      <Text style={styles.emptyText}>Es sind aktuell keine Termine geplant.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: "center", paddingTop: spacing["3xl"] },
  emptyImg: { width: 120, height: 120, borderRadius: radius.lg, marginBottom: spacing.lg },
  emptyTitle: { fontFamily: font.bold, fontSize: 17, color: colors.onSurface },
  emptyText: { fontFamily: font.regular, fontSize: 14, color: colors.muted, marginTop: spacing.xs },
});

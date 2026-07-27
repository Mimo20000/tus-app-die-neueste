import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";

import { colors, spacing, radius, font } from "@/src/theme";
import { api, LeagueTable } from "@/src/api";
import { Header } from "@/src/ui";

export default function Liga() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<LeagueTable | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(false);
      setData(await api.leagueTable());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const rows = data?.rows ?? [];

  return (
    <View style={styles.container}>
      <Header title="Tabelle" subtitle={data?.tournament ?? "Live-Tabelle · handball.net"} />

      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: spacing["3xl"] }} />
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: insets.bottom + spacing["2xl"],
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />
          }
        >
          {error ? (
            <View style={styles.info} testID="liga-error">
              <Ionicons name="cloud-offline-outline" size={40} color={colors.muted} />
              <Text style={styles.infoTitle}>Tabelle nicht erreichbar</Text>
              <Text style={styles.infoText}>Bitte später erneut versuchen (Zum Aktualisieren ziehen).</Text>
            </View>
          ) : rows.length === 0 ? (
            <View style={styles.info} testID="liga-empty">
              <Ionicons name="hourglass-outline" size={40} color={colors.muted} />
              <Text style={styles.infoTitle}>Tabelle noch nicht verfügbar</Text>
              <Text style={styles.infoText}>
                Sobald die Saison startet, erscheint hier der aktuelle Tabellenstand automatisch von handball.net.
              </Text>
            </View>
          ) : (
            <View style={styles.table} testID="liga-table">
              <View style={styles.headRow}>
                <Text style={[styles.hCell, styles.cRank]}>#</Text>
                <Text style={[styles.hCell, styles.cTeam]}>Team</Text>
                <Text style={[styles.hCell, styles.cNum]}>Sp</Text>
                <Text style={[styles.hCell, styles.cDiff]}>Diff</Text>
                <Text style={[styles.hCell, styles.cPts]}>Pkt</Text>
              </View>
              {rows.map((r) => (
                <View
                  key={`${r.rank}-${r.team}`}
                  style={[styles.dataRow, r.is_own && styles.ownRow]}
                  testID={`liga-row-${r.rank}`}
                >
                  <Text style={[styles.cell, styles.cRank, styles.rankText]}>{r.rank}</Text>
                  <Text
                    style={[styles.cell, styles.cTeam, r.is_own && styles.ownText]}
                    numberOfLines={1}
                  >
                    {r.team}
                  </Text>
                  <Text style={[styles.cell, styles.cNum]}>{r.games}</Text>
                  <Text style={[styles.cell, styles.cDiff]}>
                    {r.goal_diff != null && r.goal_diff > 0 ? `+${r.goal_diff}` : r.goal_diff}
                  </Text>
                  <Text style={[styles.cell, styles.cPts, styles.ptsText, r.is_own && styles.ownText]}>
                    {r.points}
                  </Text>
                </View>
              ))}
              <Text style={styles.source}>Quelle: handball.net · Zum Aktualisieren ziehen</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceSecondary },
  table: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
  },
  hCell: { fontFamily: font.bold, fontSize: 12, color: colors.onSurfaceSecondary },
  dataRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ownRow: { backgroundColor: colors.brandSecondary },
  cell: { fontFamily: font.medium, fontSize: 13, color: colors.onSurface },
  cRank: { width: 26, textAlign: "center" },
  cTeam: { flex: 1, paddingHorizontal: spacing.sm },
  cNum: { width: 32, textAlign: "center" },
  cDiff: { width: 44, textAlign: "center" },
  cPts: { width: 50, textAlign: "right" },
  rankText: { fontFamily: font.extra, color: colors.onSurfaceSecondary },
  ptsText: { fontFamily: font.extra, color: colors.onSurface },
  ownText: { fontFamily: font.extra, color: colors.brand },
  source: {
    fontFamily: font.regular,
    fontSize: 11,
    color: colors.muted,
    textAlign: "center",
    paddingVertical: spacing.md,
  },
  info: { alignItems: "center", paddingTop: spacing["3xl"], paddingHorizontal: spacing.xl, gap: spacing.sm },
  infoTitle: { fontFamily: font.bold, fontSize: 17, color: colors.onSurface, marginTop: spacing.sm },
  infoText: { fontFamily: font.regular, fontSize: 14, color: colors.muted, textAlign: "center" },
});

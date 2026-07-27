import { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";
import * as Haptics from "expo-haptics";

import { colors, spacing, radius, font } from "@/src/theme";
import { api, Player, TeamEvent, Attendance } from "@/src/api";
import { Header, formatDate } from "@/src/ui";

const NAME_W = 128;
const CELL_W = 54;
const ROW_H = 46;
const HEAD_H = 60;

export default function Tabelle() {
  const insets = useSafeAreaInsets();
  const [players, setPlayers] = useState<Player[]>([]);
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [att, setAtt] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const leftRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    try {
      const [pl, ev, attList] = await Promise.all([
        api.players(),
        api.events(),
        api.attendance(),
      ]);
      setPlayers(pl);
      setEvents(ev);
      const map: Record<string, string> = {};
      attList.forEach((a: Attendance) => {
        map[`${a.player_id}|${a.event_id}`] = a.status;
      });
      setAtt(map);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const syncLeft = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    leftRef.current?.scrollTo({ y: e.nativeEvent.contentOffset.y, animated: false });
  };

  const statusOf = (pid: string, eid: string) => att[`${pid}|${eid}`];

  const buildCsv = () => {
    const head = ["Spieler", ...events.map((e) => {
      const d = formatDate(e.date);
      const label = e.type === "Spiel" ? `Spiel ${e.opponent}` : "Training";
      return `${d.day}.${d.month} ${label}`;
    })];
    const rows = players.map((p) => [
      p.name,
      ...events.map((e) => {
        const s = statusOf(p.id, e.id);
        return s === "zugesagt" ? "Zusage" : s === "abgesagt" ? "Absage" : "";
      }),
    ]);
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    return [head, ...rows].map((r) => r.map(esc).join(";")).join("\n");
  };

  const onExport = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const csv = "\uFEFF" + buildCsv();
      if (Platform.OS === "web" || !(await Sharing.isAvailableAsync())) {
        setToast("Teilen wird auf diesem Gerät nicht unterstützt.");
        setTimeout(() => setToast(null), 2500);
        return;
      }
      const file = new File(Paths.cache, "TuS_Anwesenheit.csv");
      if (file.exists) file.delete();
      file.create();
      file.write(csv);
      await Sharing.shareAsync(file.uri, {
        mimeType: "text/csv",
        dialogTitle: "Anwesenheitsliste teilen",
        UTI: "public.comma-separated-values-text",
      });
    } catch {
      setToast("Export fehlgeschlagen.");
      setTimeout(() => setToast(null), 2500);
    }
  };

  const legend = useMemo(
    () => (
      <View style={styles.legend}>
        <LegendItem color={colors.success} label="Zusage" icon="checkmark" />
        <LegendItem color={colors.error} label="Absage" icon="close" />
        <LegendItem color={colors.surfaceTertiary} label="Offen" textColor={colors.muted} />
      </View>
    ),
    []
  );

  return (
    <View style={styles.container}>
      <Header
        title="Tabelle"
        subtitle="Anwesenheit · Spieler × Termine"
        right={
          <Pressable testID="export-button" onPress={onExport} style={styles.exportBtn}>
            <Ionicons name="share-outline" size={20} color={colors.onBrand} />
          </Pressable>
        }
      />

      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: spacing["3xl"] }} />
      ) : (
        <>
          {legend}
          <View style={styles.gridWrap}>
            {/* Fixed left column */}
            <View style={{ width: NAME_W }}>
              <View style={[styles.corner, { height: HEAD_H }]}>
                <Text style={styles.cornerText}>Spieler</Text>
              </View>
              <ScrollView
                ref={leftRef}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              >
                {players.map((p, i) => (
                  <View
                    key={p.id}
                    style={[styles.nameCell, { height: ROW_H }, i % 2 === 1 && styles.altRow]}
                  >
                    <Text style={styles.nameText} numberOfLines={1}>{p.name}</Text>
                  </View>
                ))}
                <View style={{ height: insets.bottom + spacing["2xl"] }} />
              </ScrollView>
            </View>

            {/* Scrollable data area */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                {/* header */}
                <View style={{ flexDirection: "row" }}>
                  {events.map((e) => {
                    const d = formatDate(e.date);
                    return (
                      <View key={e.id} style={[styles.headCell, { height: HEAD_H }]}>
                        <Ionicons
                          name={e.type === "Spiel" ? "trophy" : "fitness"}
                          size={12}
                          color={e.type === "Spiel" ? colors.brand : colors.muted}
                        />
                        <Text style={styles.headDay}>{d.day}.{d.month}</Text>
                        <Text style={styles.headWd}>{d.weekday}</Text>
                      </View>
                    );
                  })}
                </View>
                {/* body */}
                <ScrollView
                  onScroll={syncLeft}
                  scrollEventThrottle={16}
                  showsVerticalScrollIndicator={false}
                >
                  {players.map((p, i) => (
                    <View key={p.id} style={{ flexDirection: "row" }}>
                      {events.map((e) => {
                        const s = statusOf(p.id, e.id);
                        return (
                          <View
                            key={e.id}
                            style={[
                              styles.dataCell,
                              { height: ROW_H },
                              i % 2 === 1 && styles.altRow,
                            ]}
                          >
                            {s === "zugesagt" ? (
                              <View style={[styles.badge, { backgroundColor: colors.success }]}>
                                <Ionicons name="checkmark" size={14} color={colors.onSuccess} />
                              </View>
                            ) : s === "abgesagt" ? (
                              <View style={[styles.badge, { backgroundColor: colors.error }]}>
                                <Ionicons name="close" size={14} color={colors.onError} />
                              </View>
                            ) : (
                              <Text style={styles.openMark}>–</Text>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  ))}
                  <View style={{ height: insets.bottom + spacing["2xl"] }} />
                </ScrollView>
              </View>
            </ScrollView>
          </View>

          {toast ? (
            <View style={[styles.toast, { bottom: insets.bottom + 80 }]} testID="toast">
              <Text style={styles.toastText}>{toast}</Text>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

function LegendItem({
  color,
  label,
  icon,
  textColor,
}: {
  color: string;
  label: string;
  icon?: any;
  textColor?: string;
}) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]}>
        {icon ? <Ionicons name={icon} size={11} color={colors.onBrand} /> : null}
      </View>
      <Text style={[styles.legendText, textColor && { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceSecondary },
  exportBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  legend: {
    flexDirection: "row",
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: {
    width: 18,
    height: 18,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  legendText: { fontFamily: font.medium, fontSize: 13, color: colors.onSurfaceSecondary },
  gridWrap: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  corner: {
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
    borderRightWidth: 1,
    borderRightColor: colors.borderStrong,
  },
  cornerText: { fontFamily: font.extra, fontSize: 13, color: colors.onSurface },
  nameCell: {
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderRightWidth: 1,
    borderRightColor: colors.borderStrong,
  },
  nameText: { fontFamily: font.medium, fontSize: 13, color: colors.onSurface },
  headCell: {
    width: CELL_W,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  headDay: { fontFamily: font.bold, fontSize: 11, color: colors.onSurface },
  headWd: { fontFamily: font.regular, fontSize: 10, color: colors.muted },
  dataCell: {
    width: CELL_W,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  altRow: { backgroundColor: colors.surfaceSecondary },
  badge: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  openMark: { fontFamily: font.bold, fontSize: 15, color: colors.muted },
  toast: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.surfaceInverse,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
  },
  toastText: { fontFamily: font.medium, color: colors.onSurfaceInverse, fontSize: 14 },
});

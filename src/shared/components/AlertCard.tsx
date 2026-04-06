// src/features/tenant/components/AlertCard.tsx

import React, { memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { IAlert } from "../types/alert";
import {
  ALERT_META,
  getAlertColor,
  getLevelBgColor,
  getLevelLabel,
  formatAlertTime,
  formatAlertValue,
} from "../utils/alertHelpers";

interface AlertCardProps {
  alert:       IAlert;
  onPress?:    (alert: IAlert) => void;
  onResolve?:  (alert: IAlert) => void;
  compact?:    boolean;
}

const AlertCard = memo(function AlertCard({
  alert,
  onPress,
  onResolve,
  compact = false,
}: AlertCardProps) {
  const meta      = ALERT_META[alert.metric];
  const color     = getAlertColor(alert);
  const bgColor   = getLevelBgColor(alert.level);
  const valueStr  = formatAlertValue(alert);
  const timeStr   = formatAlertTime(alert.ts);
  const isResolved = alert.resolved;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress?.(alert)}
      style={[
        styles.card,
        { backgroundColor: isResolved ? "#F5F5F5" : bgColor },
        isResolved && styles.cardResolved,
      ]}
    >
      {/* Level bar */}
      <View style={[styles.levelBar, { backgroundColor: isResolved ? "#C7C7CC" : color }]} />

      <View style={styles.content}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.iconLabel}>
            <Text style={styles.icon}>{meta?.icon ?? "⚠️"}</Text>
            <View style={styles.labelWrap}>
              <Text
                style={[styles.title, isResolved && styles.textMuted]}
                numberOfLines={2}
              >
                {alert.title}
              </Text>
              {alert.areaName && (
                <Text style={[styles.area, isResolved && styles.textMuted]}>
                  📍 {alert.areaName}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.rightCol}>
            {valueStr ? (
              <Text style={[styles.value, { color: isResolved ? "#8E8E93" : color }]}>
                {valueStr}
              </Text>
            ) : null}
            <View
              style={[
                styles.levelBadge,
                { backgroundColor: isResolved ? "#C7C7CC" : color },
              ]}
            >
              <Text style={styles.levelBadgeText}>
                {isResolved ? "Đã xử lý" : getLevelLabel(alert.level)}
              </Text>
            </View>
          </View>
        </View>

        {/* Detail — ẩn khi compact */}
        {!compact && alert.detail && (
          <Text style={[styles.detail, isResolved && styles.textMuted]} numberOfLines={2}>
            {alert.detail}
          </Text>
        )}

        {/* Footer row */}
        <View style={styles.footerRow}>
          <Text style={styles.time}>{timeStr}</Text>

          {!isResolved && onResolve && (
            <TouchableOpacity
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => onResolve(alert)}
              style={styles.resolveBtn}
            >
              <Text style={[styles.resolveBtnText, { color }]}>Đã xử lý</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default AlertCard;

const styles = StyleSheet.create({
  card: {
    flexDirection:   "row",
    borderRadius:    12,
    marginHorizontal: 16,
    marginVertical:   6,
    overflow:        "hidden",
    elevation:       2,
    shadowColor:     "#000",
    shadowOpacity:   0.06,
    shadowRadius:    8,
    shadowOffset:    { width: 0, height: 2 },
  },
  cardResolved: {
    opacity: 0.7,
  },
  levelBar: {
    width:  4,
    alignSelf: "stretch",
  },
  content: {
    flex:    1,
    padding: 12,
    gap:     6,
  },
  headerRow: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "flex-start",
    gap:            8,
  },
  iconLabel: {
    flexDirection: "row",
    alignItems:    "flex-start",
    flex:          1,
    gap:           8,
  },
  icon: {
    fontSize:  22,
    lineHeight: 28,
  },
  labelWrap: {
    flex: 1,
    gap:  2,
  },
  title: {
    fontSize:   14,
    fontWeight: "600",
    color:      "#1C1C1E",
    lineHeight: 20,
  },
  area: {
    fontSize: 12,
    color:    "#636366",
  },
  rightCol: {
    alignItems: "flex-end",
    gap:        4,
  },
  value: {
    fontSize:   15,
    fontWeight: "700",
  },
  levelBadge: {
    borderRadius:  6,
    paddingHorizontal: 8,
    paddingVertical:   3,
  },
  levelBadgeText: {
    fontSize:   11,
    fontWeight: "600",
    color:      "#FFFFFF",
  },
  detail: {
    fontSize:   13,
    color:      "#3C3C43",
    lineHeight: 18,
  },
  footerRow: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
    marginTop:      2,
  },
  time: {
    fontSize: 12,
    color:    "#8E8E93",
  },
  resolveBtn: {
    paddingVertical:   2,
  },
  resolveBtnText: {
    fontSize:   13,
    fontWeight: "500",
  },
  textMuted: {
    color: "#8E8E93",
  },
});
import { StyleSheet } from "react-native";

/**
 * Styles cho màn hình Thông báo.
 * Đồng bộ với hệ thống: nền #F5F7FA, card trắng, bo góc, shadow nhẹ.
 */
export const notificationStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 16,
  },
  /** Thanh danh mục (chưa nhiều mục nên để framework mở rộng). */
  sectionTabsRow: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sectionTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
  },
  sectionTabActive: {
    borderColor: "#2563EB",
    backgroundColor: "#DBEAFE",
  },
  sectionTabText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },
  sectionTabTextActive: {
    color: "#1D4ED8",
  },

  /** Date selector (7 ngày gần nhất). */
  dateRow: {
    paddingVertical: 8,
  },
  dateChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 10,
  },
  dateChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },

  /** Filter chips theo level. */
  filterRow: {
    paddingBottom: 10,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
    marginRight: 10,
  },
  filterChipActive: {
    borderWidth: 1,
  },
  filterCount: {
    fontSize: 18,
    fontWeight: "800",
  },
  filterLabel: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "700",
  },

  /** Hàng nút phân trang (1,2,3...). */
  paginationRow: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  pageBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
    marginRight: 10,
  },
  pageBtnActive: {
    borderColor: "#2563EB",
    backgroundColor: "#DBEAFE",
  },
  pageBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#334155",
  },
  pageBtnTextActive: {
    color: "#1D4ED8",
  },

  /** Card IoT alert. */
  alertCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderLeftWidth: 4,
  },
  alertBadge: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 10,
  },
  alertBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  alertBadgeStream: {
    fontSize: 11,
    fontWeight: "600",
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 6,
    lineHeight: 20,
  },
  alertDetail: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
    marginBottom: 10,
  },
  alertFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  areaBadge: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: "70%",
  },
  areaText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
  },
  alertTime: {
    fontSize: 11,
    color: "#94a3b8",
  },

  /** Mỗi item thông báo */
  itemCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  itemCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: "#3bb582",
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  iconWrapperTicket: {
    backgroundColor: "#E3F2FD",
  },
  iconWrapperElectric: {
    backgroundColor: "#E8F5E9",
  },
  iconWrapperWater: {
    backgroundColor: "#E0F7FA",
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  itemMessage: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
  },
  itemTime: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 6,
  },
  emptyWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 15,
    color: "#94a3b8",
    textAlign: "center",
  },
});

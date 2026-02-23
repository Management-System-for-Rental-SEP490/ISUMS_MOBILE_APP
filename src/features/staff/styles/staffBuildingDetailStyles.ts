import { StyleSheet } from "react-native";

/**
 * Styles cho màn hình Chi tiết nhà (BuildingDetail) của Staff.
 * Hiển thị thông tin nhà + danh sách thiết bị, nút Gán mã NFC cho thiết bị chưa có NFC.
 */
export const staffBuildingDetailStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  headerCard: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#2563EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  buildingName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 6,
  },
  buildingAddress: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  /** Dòng địa chỉ chi tiết: phường, quận, thành phố (từ API). */
  buildingAddressDetail: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 4,
    lineHeight: 18,
  },
  /** Badge trạng thái căn nhà (AVAILABLE, RENTED). */
  statusHouseBadge: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#E0E7FF",
  },
  statusHouseText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3730A3",
  },
  /** Mô tả căn nhà (từ API). */
  buildingDescription: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginHorizontal: 16,
    marginBottom: 10,
    marginTop: 8,
  },
  deviceCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  deviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  deviceName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  deviceLocation: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  deviceMeta: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  statusBadge: {
    alignSelf: "flex-start",
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  nfcBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: "#D1FAE5",
    alignSelf: "flex-start",
    marginTop: 4,
  },
  nfcBadgeEmpty: {
    backgroundColor: "#FEF3C7",
  },
  nfcBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#065F46",
  },
  nfcBadgeEmptyText: {
    color: "#92400E",
  },
  assignNfcBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#2563EB",
  },
  assignNfcBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyDevices: {
    padding: 24,
    alignItems: "center",
  },
  emptyDevicesText: {
    fontSize: 14,
    color: "#94a3b8",
  },
});

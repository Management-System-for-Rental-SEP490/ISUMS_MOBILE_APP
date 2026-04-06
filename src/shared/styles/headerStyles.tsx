import { StyleSheet } from "react-native";
import {
  brandDangerBg,
  brandDangerBorder,
  headerOnBrand,
  iotOfflineLabelColor,
  neutral,
} from "../theme/color";
import { appTypography } from "../utils/typography";

const headerStyles = StyleSheet.create({
  gradient: {
    width: "100%",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
  },
  container: {
    width: "100%",
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
    flexShrink: 1,
  },
  headerRowCentered: {
    justifyContent: "flex-start",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },
  logoRing: {
    backgroundColor: neutral.surface,
    padding: 3,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginRight: 8,
  },
  brandTitle: {
    ...appTypography.screenHeader,
    color: neutral.surface,
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: neutral.slate900,
    minWidth: 0,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: neutral.slate900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    flex: 1,
    minWidth: 0,
  },
  clearBtn: {
    marginLeft: 6,
    padding: 2,
    borderRadius: 10,
    backgroundColor: neutral.slate200,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: headerOnBrand.btnGlass,
    alignItems: "center",
    justifyContent: "center",
  },
  /** Trang Home: eyebrow + chào, chuông phải — canh trên để chuông không lệch khi khối trái cao (hóa đơn + nút). */
  homeHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
    gap: 6,
  },
  homeBrandPressable: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  homeBrandColumn: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    paddingRight: 4,
  },
  homeEyebrowInline: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: headerOnBrand.eyebrow,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  homeHelloInline: {
    fontSize: 18,
    fontWeight: "700",
    color: headerOnBrand.fg,
    marginTop: 2,
    lineHeight: 24,
    letterSpacing: -0.2,
    opacity: 0.98,
  },
  homeHelloInlineCompact: {
    fontSize: 16,
    lineHeight: 21,
  },
  notificationBtnHome: {
    width: 36,
    height: 36,
    borderRadius: 18,
    flexShrink: 0,
  },
  homeInvoiceStripLoading: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  homeInvoiceStripAllPaid: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "600",
    color: headerOnBrand.subtle,
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  homeInvoiceStripRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
  },
  /** Dải hóa đơn cần trả — chữ dạng liên kết (gạch dưới), bấm mở danh sách hóa đơn. */
  homeInvoiceStripPayableWrap: {
    marginTop: 8,
    width: "100%",
    alignSelf: "flex-start",
  },
  homeInvoiceStripPayableUnderline: {
    textDecorationLine: "underline",
    textDecorationColor: "rgba(255,255,255,0.85)",
  },
  homeInvoiceStripCaptionWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  /** Hóa đơn cần trả (chưa gấp) — chữ vàng trên nền gradient. */
  homeInvoiceStripPayableMild: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: -0.15,
    lineHeight: 18,
    color: "#FDE047",
  },
  /** Sắp đến hạn / quá hạn — chữ đỏ nhạt. */
  homeInvoiceStripPayableUrgent: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: -0.15,
    lineHeight: 18,
    color: "#FECACA",
  },
  homeInvoiceStripBubble: {
    flex: 1,
    minWidth: 0,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  homeInvoiceStripBubbleMild: {
    backgroundColor: headerOnBrand.bubbleMildBg,
    borderColor: headerOnBrand.bubbleMildBorder,
  },
  homeInvoiceStripBubbleUrgent: {
    backgroundColor: brandDangerBg,
    borderColor: brandDangerBorder,
  },
  homeInvoiceStripBubbleText: {
    fontSize: 13,
    fontWeight: "700",
    color: headerOnBrand.bubbleFg,
    letterSpacing: -0.15,
    lineHeight: 18,
  },
  homeInvoiceStripBubbleTextUrgent: {
    color: iotOfflineLabelColor,
  },
  homeInvoiceStripIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: headerOnBrand.btnGlass,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});

export default headerStyles;

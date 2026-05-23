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
  /** Chuông header: chỉ icon — vùng bấm gọn hơn (sát icon), không elevation. */
  notificationBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 0,
    borderColor: "transparent",
    minWidth: 34,
    minHeight: 34,
    padding: 2,
    elevation: 0,
  },
  /** Trang Home: bọc nội dung + chuông neo góc dưới phải (chuông không chiếm flex → chữ dùng hết ngang). */
  homeHeaderRowWrap: {
    position: "relative",
    width: "100%",
  },
  /** Lời chào + dải hóa đơn — full width; chữ có thể chồng lên vùng icon chuông (chuông nằm layer trên). */
  homeHeaderMainContent: {
    width: "100%",
  },
  homeBrandPressable: {
    width: "100%",
    minWidth: 0,
  },
  /** Bấm tên: full width để Text wrap theo đúng bề ngang header (kể cả chồng lên vùng chuông). */
  homeHeaderHelloPressable: {
    width: "100%",
    alignSelf: "stretch",
  },
  homeBrandColumn: {
    width: "100%",
    minWidth: 0,
    justifyContent: "center",
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
    width: "100%",
    fontSize: 18,
    fontWeight: "700",
    color: headerOnBrand.fg,
    marginTop: 0,
    lineHeight: 24,
    letterSpacing: -0.2,
    opacity: 0.98,
  },
  homeHelloInlineCompact: {
    fontSize: 16,
    lineHeight: 21,
  },
  notificationBtnHome: {
    flexShrink: 0,
    elevation: 0,
  },
  /** Chuông Home (không có dải hóa đơn): góc dưới phải, kéo lên gần greeting; zIndex khi chữ chồng lên. */
  notificationBtnHomeAbsolute: {
    position: "absolute",
    right: 0,
    bottom: 6,
    zIndex: 2,
    elevation: 0,
  },
  /** Hàng: dải hóa đơn + chuông cùng baseline/căn giữa theo chiều dọc — sát greeting hơn. */
  homeInvoiceStripOuterRow: {
    marginTop: 2,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  homeInvoiceStripInvoiceCol: {
    flex: 1,
    minWidth: 0,
  },
  /** Chuông cạnh dải hóa đơn — sát mép phải, neo theo hàng thông báo. */
  notificationBtnHomeBesideInvoice: {
    flexShrink: 0,
    marginRight: -2,
    zIndex: 2,
    elevation: 0,
  },
  homeInvoiceStripLoading: {
    alignSelf: "flex-start",
  },
  /** Một dòng: không còn hóa đơn cần trả. */
  homeInvoiceStripAllPaidLine: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    fontSize: 13,
    fontWeight: "600",
    color: headerOnBrand.subtle,
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  /** Một dòng cảnh báo có số (đậm) trong câu. */
  homeInvoiceStripPayableLine: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: -0.1,
    lineHeight: 20,
    color: "#FDE047",
  },
  homeInvoiceStripPayableLineUrgent: {
    color: "#FECACA",
  },
  homeInvoiceStripPayableLineCount: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  homeInvoiceStripPayableLineCountUrgent: {
    fontWeight: "900",
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
  /** Wrapper bọc icon chuông + badge — position relative để badge absolute neo đúng góc. */
  notifIconWrap: {
    position: "relative",
  },
  /** Chấm đỏ / số chưa đọc — neo góc trên-phải icon chuông. */
  notifBadge: {
    position: "absolute",
    top: -5,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  notifBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 13,
    letterSpacing: -0.3,
    includeFontPadding: false,
  },
});

export default headerStyles;

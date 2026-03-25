import { StyleSheet } from "react-native";
import {
  BRAND_DANGER,
  brandPrimary,
  brandSecondary,
  neutral,
} from "../../../../shared/theme/color";
import { appTypography } from "../../../../shared/utils/typography";

export const ticketStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: neutral.canvasMuted,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    ...appTypography.dialogButton,
    color: neutral.text,
  },
  title: {
    ...appTypography.ticketScreenTitle,
    marginBottom: 24,
    color: neutral.text,
  },
  deviceInfoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...appTypography.cardTitle,
    fontWeight: "600",
    marginBottom: 12,
    color: neutral.text,
  },
  deviceInfoCard: {
    backgroundColor: neutral.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: neutral.border,
  },
  deviceInfoLabel: {
    ...appTypography.labelRow,
    color: neutral.textSecondary,
    marginTop: 8,
    marginBottom: 4,
  },
  deviceInfoValue: {
    ...appTypography.modalListItem,
    fontWeight: "500",
    color: neutral.text,
    marginBottom: 4,
  },
  formSection: {
    backgroundColor: neutral.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: neutral.border,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    ...appTypography.dialogButton,
    fontWeight: "500",
    color: neutral.text,
    marginBottom: 8,
  },
  required: {
    color: BRAND_DANGER,
  },
  input: {
    borderWidth: 1,
    borderColor: neutral.inputBorder,
    borderRadius: 8,
    padding: 12,
    ...appTypography.dialogButton,
    fontWeight: "400",
    color: neutral.text,
    backgroundColor: neutral.surface,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  imagesSection: {
    marginBottom: 20,
  },
  imagesHint: {
    marginTop: 8,
    ...appTypography.labelRow,
    color: neutral.textMuted,
  },
  imageButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
    marginBottom: 12,
  },
  imageButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: neutral.inputBorder,
    backgroundColor: neutral.surface,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  imageButtonText: {
    ...appTypography.dialogButton,
    fontWeight: "600",
    color: neutral.textSecondary,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  imageThumb: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: neutral.borderMuted ?? neutral.border,
    backgroundColor: neutral.canvasMuted,
  },
  imageThumbInner: {
    flex: 1,
    width: "100%",
  },
  imageThumbImg: {
    width: "100%",
    height: "100%",
  },
  removeImageBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  removeImageBtnText: {
    color: neutral.surface,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 16,
  },
  priorityContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: neutral.inputBorder,
    backgroundColor: neutral.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  priorityButtonActive: {
    backgroundColor: brandSecondary,
    borderColor: brandSecondary,
  },
  priorityButtonText: {
    ...appTypography.body,
    fontWeight: "500",
    color: neutral.textSecondary,
    textAlign: "center",
  },
  priorityButtonTextActive: {
    color: neutral.surface,
    textAlign: "center",
  },
  submitButton: {
    backgroundColor: brandPrimary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: brandPrimary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5,
  },
  submitButtonText: {
    color: neutral.surface,
    ...appTypography.dialogButton,
  },
});

/** Hai loại ticket (REPAIR / QUESTION) — nút chọn trên form tạo ticket. */
export const ticketTypeSelectStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  chip: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: neutral.inputBorder,
    backgroundColor: neutral.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: brandPrimary,
    borderColor: brandPrimary,
  },
  chipText: {
    ...appTypography.dialogButton,
    fontWeight: "600",
    color: neutral.textSecondary,
    textAlign: "center",
  },
  chipTextActive: {
    color: neutral.surface,
  },
});

/** Chọn thiết bị (modal tìm kiếm) — dùng chung trên màn Ticket khi không có presetAsset. */
export const ticketAssetSelectStyles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: neutral.inputBorder,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: neutral.surface,
    gap: 10,
  },
  triggerText: {
    ...appTypography.dialogButton,
    fontWeight: "500",
    color: neutral.text,
    flex: 1,
  },
  triggerPlaceholder: {
    color: neutral.textMuted,
    fontWeight: "400",
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  sheet: {
    backgroundColor: neutral.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "88%",
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: neutral.border,
    borderBottomWidth: 0,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: neutral.border,
  },
  sheetTitle: {
    ...appTypography.cardTitle,
    fontWeight: "700",
    color: neutral.text,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: neutral.inputBorder,
    paddingHorizontal: 12,
    backgroundColor: neutral.canvasMuted,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    ...appTypography.dialogButton,
    color: neutral.text,
  },
  list: {
    flexGrow: 0,
    maxHeight: 360,
  },
  assetRow: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: neutral.border,
  },
  assetRowTitle: {
    ...appTypography.modalListItem,
    fontWeight: "600",
    color: neutral.text,
  },
  assetRowSub: {
    ...appTypography.labelRow,
    color: neutral.textMuted,
    marginTop: 4,
  },
  emptyText: {
    ...appTypography.body,
    color: neutral.textMuted,
    textAlign: "center",
    paddingVertical: 28,
    paddingHorizontal: 24,
  },
  loadingBox: {
    paddingVertical: 32,
    alignItems: "center",
  },
});

/** Bottom sheet menu (+) trên danh sách ticket. */
export const tenantTicketMenuStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: neutral.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: neutral.border,
    borderBottomWidth: 0,
  },
  grab: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: neutral.border,
    marginBottom: 16,
  },
  menuTitle: {
    ...appTypography.cardTitle,
    fontWeight: "700",
    color: neutral.text,
    marginBottom: 6,
  },
  menuSubtitle: {
    ...appTypography.body,
    color: neutral.textSecondary,
    marginBottom: 20,
    lineHeight: 22,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: brandSecondary,
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 10,
  },
  primaryBtnText: {
    ...appTypography.dialogButton,
    fontWeight: "700",
    color: neutral.surface,
  },
  ghostBtn: {
    alignItems: "center",
    paddingVertical: 14,
    marginBottom: 4,
  },
  ghostBtnText: {
    ...appTypography.dialogButton,
    fontWeight: "600",
    color: neutral.textSecondary,
  },
});

/** Màn danh sách ticket tenant (TenantTicketList) — UI card nhẹ, ít màu. */
export const tenantTicketListStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: neutral.canvasMuted,
  },
  pageHeading: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  pageTitle: {
    ...appTypography.ticketScreenTitle,
    fontSize: 22,
    color: neutral.heading,
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: neutral.textMuted,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 12,
  },
  listEmptyGrow: {
    flexGrow: 1,
    justifyContent: "center",
  },
  card: {
    backgroundColor: neutral.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: neutral.border,
    shadowColor: neutral.slate900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  /** Nhãn loại: hình chữ nhật bo góc, tông nhạt (REPAIR xanh rất nhạt, QUESTION xám). */
  typeTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginBottom: 12,
  },
  typeTagText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  typeRepair: {
    backgroundColor: "#E8F4FA",
  },
  typeRepairText: {
    color: "#4A6572",
  },
  typeQuestion: {
    backgroundColor: "#F1F5F9",
  },
  typeQuestionText: {
    color: "#64748B",
  },
  typeDefault: {
    backgroundColor: neutral.tileMuted,
  },
  typeDefaultText: {
    color: neutral.slate500,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: neutral.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
  },
  dateLine: {
    fontSize: 12,
    color: neutral.textMuted,
  },
  cardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  /** Trạng thái: pill + chấm màu nhạt. */
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    flexShrink: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 1,
  },
  statusCreated: {
    backgroundColor: "#F1F5F9",
  },
  statusCreatedDot: {
    backgroundColor: "#CBD5E1",
  },
  statusCreatedText: {
    color: "#64748B",
  },
  /** Nổi bật: Chờ người thuê duyệt */
  statusWaitingTenant: {
    backgroundColor: "#FFF7ED",
  },
  statusWaitingTenantDot: {
    backgroundColor: "#F59E0B",
  },
  statusWaitingTenantText: {
    color: "#92400E",
  },
  statusScheduled: {
    backgroundColor: "#EEF6FB",
  },
  statusScheduledDot: {
    backgroundColor: "#7EB8D8",
  },
  statusScheduledText: {
    color: "#52606D",
  },
  statusInProgress: {
    backgroundColor: "#E8F4FA",
  },
  statusInProgressDot: {
    backgroundColor: "#5BA3C6",
  },
  statusInProgressText: {
    color: "#4A6572",
  },
  statusDone: {
    backgroundColor: "#F0FDF4",
  },
  statusDoneDot: {
    backgroundColor: "#86EFAC",
  },
  statusDoneText: {
    color: "#4B5563",
  },
  statusCancelled: {
    backgroundColor: "#FEF2F2",
  },
  statusCancelledDot: {
    backgroundColor: "#FCA5A5",
  },
  statusCancelledText: {
    color: "#9CA3AF",
  },
  statusDefault: {
    backgroundColor: neutral.backgroundSubtle,
  },
  statusDefaultDot: {
    backgroundColor: neutral.slate300,
  },
  statusDefaultText: {
    color: neutral.textSecondary,
  },
  detailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },
  detailsText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3D8BA8",
  },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    backgroundColor: brandSecondary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: brandSecondary,
  },
  payText: {
    fontSize: 12,
    fontWeight: "800",
    color: neutral.surface,
    marginRight: 6,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  hint: {
    marginTop: 14,
    ...appTypography.body,
    color: neutral.textSecondary,
  },
  errorText: {
    ...appTypography.body,
    color: neutral.textSecondary,
    textAlign: "center",
    marginBottom: 18,
    lineHeight: 22,
  },
  retryBtn: {
    backgroundColor: brandSecondary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 160,
    alignItems: "center",
    shadowColor: brandSecondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  retryBtnText: {
    ...appTypography.dialogButton,
    color: neutral.surface,
    fontWeight: "600",
  },
  empty: {
    ...appTypography.body,
    color: neutral.textMuted,
    textAlign: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
    lineHeight: 22,
  },
});

/** Màn chi tiết ticket tenant — cùng tông với danh sách. */
export const tenantTicketDetailStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: neutral.canvasMuted,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 14,
  },
  heroCard: {
    backgroundColor: neutral.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: neutral.border,
    shadowColor: neutral.slate900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: neutral.text,
    lineHeight: 26,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  heroDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroDateText: {
    fontSize: 13,
    color: neutral.textMuted,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: neutral.textMuted,
    textTransform: "uppercase",
    marginBottom: 8,
    marginLeft: 2,
  },
  panel: {
    backgroundColor: neutral.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: neutral.border,
    shadowColor: neutral.slate900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  panelRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: neutral.borderMuted,
  },
  panelRowLast: {
    borderBottomWidth: 0,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: neutral.textMuted,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: "500",
    color: neutral.text,
    lineHeight: 22,
  },
  fieldValueMuted: {
    fontSize: 14,
    fontWeight: "400",
    color: neutral.textSecondary,
    fontStyle: "italic",
  },
  fieldValueMono: {
    fontSize: 12,
    fontWeight: "500",
    color: neutral.slate600,
    lineHeight: 18,
  },
  fieldValuePhone: {
    ...appTypography.modalListItem,
    fontWeight: "700",
    color: neutral.text,
    lineHeight: 22,
  },
  quoteItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: neutral.text,
    flex: 1,
  },
  quoteItemPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: neutral.text,
    textAlign: "right",
    marginLeft: 12,
  },
  quoteTotalRow: {
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quoteTotalLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: neutral.textMuted,
  },
  quoteTotalValue: {
    fontSize: 16,
    fontWeight: "800",
    color: brandPrimary,
  },
  confirmQuoteBtn: {
    marginTop: 12,
    backgroundColor: brandPrimary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: brandPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5,
  },
  confirmQuoteBtnText: {
    color: neutral.surface,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "800",
  },
  assetLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  descriptionBody: {
    fontSize: 15,
    lineHeight: 24,
    color: neutral.text,
    paddingVertical: 8,
  },
  ticketImagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  ticketImageThumb: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: neutral.borderMuted ?? neutral.border,
    backgroundColor: neutral.canvasMuted,
  },
  ticketImage: {
    width: "100%",
    height: "100%",
  },
  ticketImagesEmpty: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  imageModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  imageModalContent: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: neutral.borderMuted ?? neutral.border,
    backgroundColor: neutral.surface,
  },
  imageModalClose: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.75)",
  },
  imageModalCloseText: {
    color: neutral.surface,
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 20,
  },
  imageModalImage: {
    width: "100%",
    height: 320,
  },
});

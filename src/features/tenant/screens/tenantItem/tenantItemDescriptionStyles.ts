import { StyleSheet } from "react-native";

export const tenantItemDescriptionStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backBtn: { padding: 4, marginRight: 8 },
  topBarTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  scrollContent: { padding: 16, paddingTop: 12 },
  descriptionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  descriptionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  descriptionRowLast: { borderBottomWidth: 0 },
  descriptionLabel: {
    fontSize: 14,
    color: "#6b7280",
    flex: 0.35,
  },
  descriptionValue: {
    fontSize: 14,
    color: "#111827",
    flex: 0.65,
  },
  descriptionStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  descriptionStatusAvailable: { backgroundColor: "#d1fae5" },
  descriptionStatusInUse: { backgroundColor: "#dbeafe" },
  descriptionStatusDisposed: { backgroundColor: "#fee2e2" },
  descriptionStatusOther: { backgroundColor: "#f3f4f6" },
  descriptionEditBtn: {
    marginTop: 20,
    backgroundColor: "#0ea5e9",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  descriptionEditBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

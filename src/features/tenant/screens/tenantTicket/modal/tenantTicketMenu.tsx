import React from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import Icons from "../../../../../shared/theme/icon";
import { neutral } from "../../../../../shared/theme/color";
import { tenantTicketMenuStyles as styles } from "../ticketStyles";

export type TenantTicketMenuProps = {
  visible: boolean;
  onClose: () => void;
  onCreateTicket: () => void;
};

/**
 * Menu bottom sheet từ nút + trên danh sách ticket: chọn tạo ticket mới.
 */
export function TenantTicketMenu({ visible, onClose, onCreateTicket }: TenantTicketMenuProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.grab} />
          <Text style={styles.menuTitle}>{t("tenant_ticket_menu.title")}</Text>
          <Text style={styles.menuSubtitle}>{t("tenant_ticket_menu.subtitle")}</Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={onCreateTicket}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Icons.plus size={22} color={neutral.surface} />
            <Text style={styles.primaryBtnText}>{t("tenant_ticket_menu.create_ticket")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghostBtn} onPress={onClose} accessibilityRole="button">
            <Text style={styles.ghostBtnText}>{t("common.close")}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

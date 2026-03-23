import React, { useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CustomAlert as Alert } from "../../../../shared/components/alert";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../../shared/types";
import {
  ticketStyles,
  ticketTypeSelectStyles as typeStyles,
} from "./ticketStyles";
import { useTranslation } from "react-i18next";
import Icons from "../../../../shared/theme/icon";
import {
  StackScreenTitleBadge,
  StackScreenTitleBarBalance,
  StackScreenTitleHeaderStrip,
  stackScreenTitleBackBtnOnBrand,
  stackScreenTitleCenterSlotStyle,
  stackScreenTitleOnBrandIconColor,
  stackScreenTitleRowStyle,
  stackScreenTitleSideSlotStyle,
} from "../../../../shared/components/StackScreenTitleBadge";
import { createTenantTicket, type TenantTicketCreateType } from "../../../../shared/services/issuesApi";
import { TicketAssetSelect, type TicketAssetSelection } from "./TicketAssetSelect";

type TicketRouteProp = RouteProp<RootStackParamList, "Ticket">;
type TicketNavigationProp = NativeStackNavigationProp<RootStackParamList, "Ticket">;

const TicketScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const route = useRoute<TicketRouteProp>();
  const navigation = useNavigation<TicketNavigationProp>();
  const { houseId: rawHouseId, presetAsset } = route.params;
  const houseId = String(rawHouseId ?? "").trim();

  const needAssetPicker = !presetAsset;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ticketType, setTicketType] = useState<TenantTicketCreateType>("REPAIR");
  const [pickedAsset, setPickedAsset] = useState<TicketAssetSelection | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resolvedAsset = useMemo<TicketAssetSelection | null>(() => {
    if (presetAsset) return { id: presetAsset.id, displayName: presetAsset.displayName };
    return pickedAsset;
  }, [presetAsset, pickedAsset]);

  const handleSubmit = async () => {
    if (!houseId) {
      Alert.alert(t("ticket.validation_error_title"), t("ticket.house_missing"));
      return;
    }

    if (!title.trim()) {
      Alert.alert(t("ticket.validation_error_title"), t("ticket.title_required"));
      return;
    }

    if (!description.trim()) {
      Alert.alert(t("ticket.validation_error_title"), t("ticket.description_required"));
      return;
    }

    if (!resolvedAsset?.id) {
      Alert.alert(t("ticket.validation_error_title"), t("ticket.asset_required"));
      return;
    }

    setSubmitting(true);
    try {
      await createTenantTicket({
        houseId,
        assetId: resolvedAsset.id,
        title: title.trim(),
        description: description.trim(),
        type: ticketType,
      });
      Alert.alert(t("ticket.success_title"), t("ticket.success_message"), [
        { text: t("common.close"), onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      const msg = e instanceof Error && e.message ? e.message : t("ticket.submit_error");
      Alert.alert(t("ticket.validation_error_title"), msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={ticketStyles.container}>
      <StackScreenTitleHeaderStrip>
        <View style={stackScreenTitleRowStyle}>
          <View style={stackScreenTitleSideSlotStyle}>
            <TouchableOpacity
              style={stackScreenTitleBackBtnOnBrand}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Icons.chevronBack size={24} color={stackScreenTitleOnBrandIconColor} />
            </TouchableOpacity>
          </View>
          <View style={stackScreenTitleCenterSlotStyle}>
            <StackScreenTitleBadge numberOfLines={1}>{t("ticket.title")}</StackScreenTitleBadge>
          </View>
          <StackScreenTitleBarBalance />
        </View>
      </StackScreenTitleHeaderStrip>
      <ScrollView
        style={ticketStyles.content}
        contentContainerStyle={[
          ticketStyles.contentContainer,
          { paddingBottom: Math.max(insets.bottom, 20) + ticketStyles.contentContainer.paddingBottom },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={ticketStyles.deviceInfoSection}>
          <Text style={ticketStyles.sectionTitle}>{t("ticket.device_info_title")}</Text>
          <View style={ticketStyles.deviceInfoCard}>
            {needAssetPicker ? (
              <>
                <Text style={ticketStyles.deviceInfoLabel}>{t("ticket.asset_field_label")}</Text>
                <TicketAssetSelect houseId={houseId} value={pickedAsset} onChange={setPickedAsset} />
              </>
            ) : (
              <>
                <Text style={ticketStyles.deviceInfoLabel}>{t("device_detail.device_name")}</Text>
                <Text style={ticketStyles.deviceInfoValue}>{presetAsset!.displayName}</Text>
                <Text style={ticketStyles.deviceInfoLabel}>{t("device_detail.id")}</Text>
                <Text style={ticketStyles.deviceInfoValue} selectable>
                  {presetAsset!.id}
                </Text>
              </>
            )}
          </View>
        </View>

        <View style={ticketStyles.formSection}>
          <View style={ticketStyles.inputGroup}>
            <Text style={ticketStyles.label}>
              {t("ticket.title_label")} <Text style={ticketStyles.required}>*</Text>
            </Text>
            <TextInput
              style={ticketStyles.input}
              placeholder={t("ticket.title_placeholder")}
              placeholderTextColor="#9ca3af"
              value={title}
              onChangeText={setTitle}
              maxLength={200}
            />
          </View>

          <View style={ticketStyles.inputGroup}>
            <Text style={ticketStyles.label}>
              {t("ticket.description_label")} <Text style={ticketStyles.required}>*</Text>
            </Text>
            <TextInput
              style={[ticketStyles.input, ticketStyles.textArea]}
              placeholder={t("ticket.description_placeholder")}
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={2000}
            />
          </View>

          <View style={ticketStyles.inputGroup}>
            <Text style={ticketStyles.label}>
              {t("ticket.type_label")} <Text style={ticketStyles.required}>*</Text>
            </Text>
            <View style={typeStyles.row}>
              <TouchableOpacity
                style={[typeStyles.chip, ticketType === "REPAIR" && typeStyles.chipActive]}
                onPress={() => setTicketType("REPAIR")}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    typeStyles.chipText,
                    ticketType === "REPAIR" && typeStyles.chipTextActive,
                  ]}
                >
                  {t("tenant_ticket_list.type_REPAIR")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[typeStyles.chip, ticketType === "QUESTION" && typeStyles.chipActive]}
                onPress={() => setTicketType("QUESTION")}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    typeStyles.chipText,
                    ticketType === "QUESTION" && typeStyles.chipTextActive,
                  ]}
                >
                  {t("tenant_ticket_list.type_QUESTION")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[ticketStyles.submitButton, submitting && { opacity: 0.72 }]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.9}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={ticketStyles.submitButtonText}>{t("ticket.submit_button")}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default TicketScreen;

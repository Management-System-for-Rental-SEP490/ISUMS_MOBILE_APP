/**
 * Màn hình chỉnh sửa thiết bị (Staff), hiển thị dạng modal.
 * - Nhận `item` từ route params (AssetItemFromApi).
 * - Form pre-fill; PUT /api/asset/items/:id qua useUpdateAssetItem.
 * - Nút "Xóa thiết bị": Alert xác nhận → cập nhật status từ "AVAILABLE" → "DISPOSED" (xóa mềm) → goBack.
 */
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../../../shared/types";
import Icons from "../../../../shared/theme/icon";
import { useUpdateAssetItem, useHouses, useAssetCategories } from "../../../../shared/hooks";
import { itemScreenStyles } from "./itemScreenStyles";
import type { AssetCategoryFromApi, AssetItemFromApi } from "../../../../shared/types/api";
import type { HouseFromApi } from "../../../../shared/types/api";

type NavProp = NativeStackNavigationProp<RootStackParamList, "ItemEdit">;
type ItemEditRouteProp = RouteProp<RootStackParamList, "ItemEdit">;

const STATUS_OPTIONS = ["AVAILABLE", "DISPOSED"] as const;

export default function ItemEditScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<ItemEditRouteProp>();
  const item = route.params.item as AssetItemFromApi;

  const [houseId, setHouseId] = useState(item.houseId);
  const [categoryId, setCategoryId] = useState(item.categoryId);
  const [displayName, setDisplayName] = useState(item.displayName);
  const [serialNumber, setSerialNumber] = useState(item.serialNumber);
  const [nfcId, setNfcId] = useState(item.nfcId ?? "");
  const [conditionPercent, setConditionPercent] = useState(String(item.conditionPercent));
  const [status, setStatus] = useState<string>(item.status || STATUS_OPTIONS[0]);

  useEffect(() => {
    setHouseId(item.houseId);
    setCategoryId(item.categoryId);
    setDisplayName(item.displayName);
    setSerialNumber(item.serialNumber);
    setNfcId(item.nfcId ?? "");
    setConditionPercent(String(item.conditionPercent));
    setStatus(item.status || STATUS_OPTIONS[0]);
  }, [item.id]);

  const { data: housesData } = useHouses();
  const houses = housesData?.data ?? [];
  const { data: categoriesData } = useAssetCategories();
  const categories = categoriesData?.data ?? [];

  const updateMutation = useUpdateAssetItem();
  const isPending = updateMutation.isPending;
  const isSuccess = updateMutation.isSuccess;
  const error = updateMutation.error;

  const handleSubmit = () => {
    if (!houseId.trim() || !categoryId.trim() || !displayName.trim() || !serialNumber.trim()) {
      updateMutation.reset();
      return;
    }
    const percent = parseInt(conditionPercent, 10);
    if (Number.isNaN(percent) || percent < 0 || percent > 100) {
      updateMutation.reset();
      return;
    }
    updateMutation.mutate(
      {
        id: item.id,
        payload: {
          houseId: houseId.trim(),
          categoryId: categoryId.trim(),
          displayName: displayName.trim(),
          serialNumber: serialNumber.trim(),
          nfcId: nfcId.trim() || null,
          conditionPercent: percent,
          status: status || "AVAILABLE",
        },
      },
      { onSuccess: () => navigation.goBack() }
    );
  };

  const handleDeletePress = () => {
    Alert.alert(
      t("staff_item_edit.delete_confirm_title"),
      t("staff_item_edit.delete_confirm_message"),
      [
        { text: t("profile.cancel"), style: "cancel" },
        {
          text: t("staff_item_edit.delete_btn"),
          style: "destructive",
          onPress: () => {
            // Xóa mềm: chỉ cập nhật status sang DISPOSED, giữ lại mọi thông tin khác.
            const percent = parseInt(conditionPercent, 10);
            updateMutation.mutate(
              {
                id: item.id,
                payload: {
                  houseId: houseId.trim(),
                  categoryId: categoryId.trim(),
                  displayName: displayName.trim(),
                  serialNumber: serialNumber.trim(),
                  nfcId: nfcId.trim() || null,
                  conditionPercent: Number.isNaN(percent) ? item.conditionPercent : percent,
                  status: "DISPOSED",
                },
              },
              { onSuccess: () => navigation.goBack() }
            );
          },
        },
      ]
    );
  };

  const canSubmit =
    houseId.trim().length > 0 &&
    categoryId.trim().length > 0 &&
    displayName.trim().length > 0 &&
    serialNumber.trim().length > 0 &&
    conditionPercent.length > 0 &&
    !Number.isNaN(parseInt(conditionPercent, 10));

  // Chỉ cho phép "xóa" khi thiết bị chưa ở trạng thái DISPOSED.
  const canDelete = status !== "DISPOSED";

  const safeStyle = { paddingTop: insets.top, paddingBottom: insets.bottom };

  return (
    <View style={[itemScreenStyles.container, safeStyle]}>
      <View style={itemScreenStyles.topBar}>
        <TouchableOpacity
          style={itemScreenStyles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icons.chevronBack size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={itemScreenStyles.topBarTitle} numberOfLines={1}>
          {t("staff_item_edit.title")}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            itemScreenStyles.scrollContent,
            itemScreenStyles.scrollContentWithKeyboard,
            { paddingBottom: 40 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={itemScreenStyles.formCard}>
            <Text style={itemScreenStyles.label}>{t("staff_item_create.house_label")}</Text>
            <View style={itemScreenStyles.chipRow}>
              {houses.map((h: HouseFromApi) => (
                <TouchableOpacity
                  key={h.id}
                  onPress={() => setHouseId(h.id)}
                  style={[itemScreenStyles.chip, houseId === h.id && itemScreenStyles.chipSelected]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[itemScreenStyles.chipText, houseId === h.id && itemScreenStyles.chipTextSelected]}
                    numberOfLines={1}
                  >
                    {h.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={itemScreenStyles.fieldSpacer}>
              <Text style={itemScreenStyles.label}>{t("staff_item_create.category_label")}</Text>
              <View style={itemScreenStyles.chipRow}>
                {categories.map((c: AssetCategoryFromApi) => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setCategoryId(c.id)}
                    style={[itemScreenStyles.chip, categoryId === c.id && itemScreenStyles.chipSelected]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[itemScreenStyles.chipText, categoryId === c.id && itemScreenStyles.chipTextSelected]}
                      numberOfLines={1}
                    >
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={itemScreenStyles.fieldSpacer}>
              <Text style={itemScreenStyles.label}>{t("staff_item_create.display_name_label")}</Text>
              <TextInput
                style={itemScreenStyles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder={t("staff_item_create.display_name_placeholder")}
                placeholderTextColor="#9CA3AF"
                editable={!isPending}
              />
            </View>

            <View style={itemScreenStyles.fieldSpacer}>
              <Text style={itemScreenStyles.label}>{t("staff_item_create.serial_number_label")}</Text>
              <TextInput
                style={itemScreenStyles.input}
                value={serialNumber}
                onChangeText={setSerialNumber}
                placeholder={t("staff_item_create.serial_number_placeholder")}
                placeholderTextColor="#9CA3AF"
                editable={!isPending}
              />
            </View>

            <View style={itemScreenStyles.fieldSpacer}>
              <Text style={itemScreenStyles.label}>{t("staff_item_create.nfc_id_label")}</Text>
              <TextInput
                style={itemScreenStyles.input}
                value={nfcId}
                onChangeText={setNfcId}
                placeholder={t("staff_item_create.nfc_id_placeholder")}
                placeholderTextColor="#9CA3AF"
                editable={!isPending}
              />
            </View>

            <View style={itemScreenStyles.fieldSpacer}>
              <Text style={itemScreenStyles.label}>{t("staff_item_create.condition_label")}</Text>
              <TextInput
                style={itemScreenStyles.input}
                value={conditionPercent}
                onChangeText={setConditionPercent}
                placeholder="0-100"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={3}
                editable={!isPending}
              />
            </View>

            <View style={itemScreenStyles.fieldSpacer}>
              <Text style={itemScreenStyles.label}>{t("staff_item_create.status_label")}</Text>
              <View style={itemScreenStyles.statusRow}>
                {STATUS_OPTIONS.map((s: string) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setStatus(s)}
                    style={[
                      itemScreenStyles.statusBtn,
                      status === s && itemScreenStyles.statusBtnSelected,
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        itemScreenStyles.statusBtnText,
                        status === s && itemScreenStyles.statusBtnTextSelected,
                      ]}
                    >
                      {s === "AVAILABLE"
                        ? t("staff_item_create.status_available")
                        : t("staff_item_create.status_disposed")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[
                itemScreenStyles.submitBtn,
                (!canSubmit || isPending) && itemScreenStyles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!canSubmit || isPending}
              activeOpacity={0.8}
            >
              {isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={itemScreenStyles.submitBtnText}>{t("staff_item_edit.submit")}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                itemScreenStyles.deleteBtn,
                (!canDelete || isPending) && itemScreenStyles.deleteBtnDisabled,
              ]}
              onPress={handleDeletePress}
              disabled={!canDelete || isPending}
              activeOpacity={0.8}
            >
              {isPending && !canSubmit ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={itemScreenStyles.deleteBtnText}>{t("staff_item_edit.delete_btn")}</Text>
              )}
            </TouchableOpacity>

            {isSuccess && (
              <Text style={itemScreenStyles.successText}>{t("staff_item_edit.success_message")}</Text>
            )}
            {error && (
              <Text style={itemScreenStyles.errorText}>{t("staff_item_create.error_message")}</Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

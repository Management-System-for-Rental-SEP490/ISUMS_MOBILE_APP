import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useQueryClient } from "@tanstack/react-query";
import { CustomAlert as Alert } from "../../../../shared/components/alert";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../../shared/types";
import { ticketStyles } from "./ticketStyles";
import { useTranslation } from "react-i18next";
import Icons from "../../../../shared/theme/icon";
import { brandPrimary, brandSecondary, neutral } from "../../../../shared/theme/color";
import { RefreshLogoInline } from "@shared/components/RefreshLogoOverlay";
import { ImageCaptureModal } from "../../../modal/imageCapture/ImageCaptureModal";
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
import {
  createTenantTicket,
  type TenantTicketCreateType,
  uploadTenantTicketImages,
  type TicketImageToUpload,
} from "../../../../shared/services/issuesApi";
import { TicketAssetSelect, type TicketAssetSelection } from "./TicketAssetSelect";
import { useKeyboardBottomInset } from "../../../../shared/hooks/useKeyboardBottomInset";
import { TENANT_ISSUE_TICKET_KEYS } from "../../../../shared/hooks/useTenantIssueTickets";

type TicketRouteProp = RouteProp<RootStackParamList, "Ticket">;
type TicketNavigationProp = NativeStackNavigationProp<RootStackParamList, "Ticket">;

const MAX_TICKET_ATTACHMENT_IMAGES = 5;

/** Khoảng hở phía trên bàn phím (px), Android. */
const ANDROID_KEYBOARD_GAP = 16;
/** Nâng thêm ô "Tiêu đề" so với ô khác (px). */
const ANDROID_TITLE_EXTRA_LIFT = 56;

type AndroidScrollOpts = { extraLift?: number };

const TicketScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const route = useRoute<TicketRouteProp>();
  const navigation = useNavigation<TicketNavigationProp>();
  const { houseId: rawHouseId, presetAsset, presetTicketType } = route.params;
  const houseId = String(rawHouseId ?? "").trim();

  const needAssetPicker = !presetAsset;

  const initialTicketType: TenantTicketCreateType =
    presetTicketType === "QUESTION" || presetTicketType === "REPAIR" ? presetTicketType : "REPAIR";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ticketType, setTicketType] = useState<TenantTicketCreateType>(initialTicketType);
  const [pickedAsset, setPickedAsset] = useState<TicketAssetSelection | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<TicketImageToUpload[]>([]);
  const [imageCaptureVisible, setImageCaptureVisible] = useState(false);
  const [typeSwitchW, setTypeSwitchW] = useState(0);
  const typeSlideAnim = useRef(
    new Animated.Value(initialTicketType === "REPAIR" ? 0 : 1)
  ).current;
  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const titleInputRef = useRef<TextInput>(null);
  const descInputRef = useRef<TextInput>(null);
  const lastFocusedInputRef = useRef<React.RefObject<TextInput | null> | null>(null);
  const lastAndroidScrollOptsRef = useRef<AndroidScrollOpts>({});
  const keyboardInsetRef = useRef(0);
  const keyboardInset = useKeyboardBottomInset();
  const queryClient = useQueryClient();
  const androidScrollDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    keyboardInsetRef.current = keyboardInset;
  }, [keyboardInset]);

  const scrollAndroidFieldIntoView = (
    inputRef: React.RefObject<TextInput | null>,
    opts?: AndroidScrollOpts
  ) => {
    if (Platform.OS !== "android") return;
    const inset = keyboardInsetRef.current;
    if (inset <= 0) return;
    const winH = Dimensions.get("window").height;
    const extraLift = opts?.extraLift ?? 0;
    const visibleBottom = winH - inset - ANDROID_KEYBOARD_GAP;
    inputRef.current?.measureInWindow((x, y, w, h) => {
      const inputBottom = y + h;
      if (inputBottom > visibleBottom - extraLift) {
        const dy = inputBottom - visibleBottom + extraLift + 8;
        scrollRef.current?.scrollTo({ y: scrollYRef.current + dy, animated: true });
      }
    });
  };

  const scheduleAndroidScrollOnFocus = (
    inputRef: React.RefObject<TextInput | null>,
    opts?: AndroidScrollOpts
  ) => {
    if (Platform.OS !== "android") return;
    lastFocusedInputRef.current = inputRef;
    lastAndroidScrollOptsRef.current = opts ?? {};
    if (keyboardInsetRef.current > 0) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() =>
          scrollAndroidFieldIntoView(inputRef, lastAndroidScrollOptsRef.current)
        );
      });
    }
  };

  useEffect(() => {
    if (Platform.OS !== "android" || keyboardInset <= 0) return;
    if (androidScrollDebounceRef.current) clearTimeout(androidScrollDebounceRef.current);
    androidScrollDebounceRef.current = setTimeout(() => {
      androidScrollDebounceRef.current = null;
      const r = lastFocusedInputRef.current;
      if (r) {
        requestAnimationFrame(() => {
          scrollAndroidFieldIntoView(r, lastAndroidScrollOptsRef.current);
        });
      }
    }, 100);
    return () => {
      if (androidScrollDebounceRef.current) clearTimeout(androidScrollDebounceRef.current);
    };
  }, [keyboardInset]);

  const typeIndicatorTranslateX = useMemo(
    () =>
      typeSlideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.max(0, typeSwitchW) / 2],
      }),
    [typeSlideAnim, typeSwitchW]
  );

  const switchTicketType = (type: TenantTicketCreateType) => {
    if (type === ticketType) return;
    setTicketType(type);
    Animated.spring(typeSlideAnim, {
      toValue: type === "REPAIR" ? 0 : 1,
      useNativeDriver: true,
      tension: 68,
      friction: 12,
    }).start();
  };

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

    if (selectedImages.length === 0) {
      Alert.alert(t("ticket.validation_error_title"), t("ticket.images_required"));
      return;
    }

    setSubmitting(true);
    try {
      const createdTicket = await createTenantTicket({
        houseId,
        assetId: resolvedAsset.id,
        title: title.trim(),
        description: description.trim(),
        type: ticketType,
      });

      if (selectedImages.length > 0) {
        console.log("[TicketScreen] created ticket ok, uploading images", {
          ticketId: createdTicket.id,
          selectedImagesCount: selectedImages.length,
        });
        await uploadTenantTicketImages(createdTicket.id, selectedImages);
      } else {
        console.log("[TicketScreen] created ticket ok, no images to upload", {
          ticketId: createdTicket.id,
        });
      }

      void queryClient.invalidateQueries({ queryKey: TENANT_ISSUE_TICKET_KEYS.list() });

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

  const addPickedImages = (assets: ImagePicker.ImagePickerAsset[]) => {
    const normalized: TicketImageToUpload[] = assets
      .filter((a) => Boolean(a.uri))
      .map((a) => ({
        uri: a.uri,
        fileName: a.fileName ?? undefined,
        mimeType: a.mimeType ?? undefined,
      }));

    setSelectedImages((prev) => {
      const room = MAX_TICKET_ATTACHMENT_IMAGES - prev.length;
      if (room <= 0) {
        requestAnimationFrame(() =>
          Alert.alert(
            t("common.images_limit_title"),
            t("common.images_limit_max_message", { max: MAX_TICKET_ATTACHMENT_IMAGES })
          )
        );
        return prev;
      }
      const toAdd = normalized.slice(0, room);
      if (normalized.length > toAdd.length) {
        requestAnimationFrame(() =>
          Alert.alert(
            t("common.images_limit_title"),
            t("common.images_limit_truncated_message", {
              added: toAdd.length,
              max: MAX_TICKET_ATTACHMENT_IMAGES,
            })
          )
        );
      }
      return [...prev, ...toAdd];
    });
  };

  const handleTakePhoto = async () => {
    if (selectedImages.length >= MAX_TICKET_ATTACHMENT_IMAGES) {
      Alert.alert(
        t("common.images_limit_title"),
        t("common.images_limit_max_message", { max: MAX_TICKET_ATTACHMENT_IMAGES })
      );
      return;
    }
    setImageCaptureVisible(true);
  };

  const handlePickFromGallery = async () => {
    if (selectedImages.length >= MAX_TICKET_ATTACHMENT_IMAGES) {
      Alert.alert(
        t("common.images_limit_title"),
        t("common.images_limit_max_message", { max: MAX_TICKET_ATTACHMENT_IMAGES })
      );
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert(t("common.error"), t("ticket.library_permission_no_permission"), [
        { text: t("common.close") },
      ]);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"] as ImagePicker.MediaType[],
      allowsMultipleSelection: true,
      quality: 0.45,
    });
    if (result.canceled || !result.assets?.length) return;
    addPickedImages(result.assets);
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        enabled={Platform.OS === "ios"}
        keyboardVerticalOffset={insets.top + 56}
      >
      <ScrollView
        ref={scrollRef}
        style={ticketStyles.content}
        contentContainerStyle={[
          ticketStyles.contentContainer,
          {
            paddingBottom:
              Math.max(insets.bottom, 20) +
              ticketStyles.contentContainer.paddingBottom +
              (Platform.OS === "android" ? keyboardInset : 0),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        onScroll={(e) => {
          scrollYRef.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        <View style={ticketStyles.pageIntro}>
          <Text style={ticketStyles.pageIntroText}>{t("tenant_ticket_menu.subtitle")}</Text>
        </View>

        <View style={ticketStyles.sectionBlock}>
          <Text style={ticketStyles.sectionLabel}>{t("ticket.device_info_title")}</Text>
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
              </>
            )}
          </View>
        </View>

        <View style={ticketStyles.formSection}>
          <View style={ticketStyles.inputGroup}>
            <Text style={ticketStyles.label}>
              {t("ticket.type_label")} <Text style={ticketStyles.required}>*</Text>
            </Text>
            <View
              style={ticketStyles.typeSwitchTrack}
              onLayout={(e) => setTypeSwitchW(e.nativeEvent.layout.width)}
            >
              <Animated.View
                style={[
                  ticketStyles.typeSwitchIndicator,
                  {
                    width: "50%",
                    transform: [{ translateX: typeIndicatorTranslateX }],
                    backgroundColor:
                      ticketType === "REPAIR" ? brandPrimary : brandSecondary,
                  },
                ]}
              />
              <Pressable
                style={ticketStyles.typeSwitchTab}
                onPress={() => switchTicketType("REPAIR")}
              >
                <Icons.build
                  size={18}
                  color={ticketType === "REPAIR" ? "#fff" : neutral.textSecondary}
                />
                <Text
                  style={[
                    ticketStyles.typeSwitchTabText,
                    ticketType === "REPAIR" && ticketStyles.typeSwitchTabTextActive,
                  ]}
                >
                  {t("tenant_ticket_list.type_REPAIR")}
                </Text>
              </Pressable>
              <Pressable
                style={ticketStyles.typeSwitchTab}
                onPress={() => switchTicketType("QUESTION")}
              >
                <Icons.helpOutline
                  size={18}
                  color={ticketType === "QUESTION" ? "#fff" : neutral.textSecondary}
                />
                <Text
                  style={[
                    ticketStyles.typeSwitchTabText,
                    ticketType === "QUESTION" && ticketStyles.typeSwitchTabTextActive,
                  ]}
                >
                  {t("tenant_ticket_list.type_QUESTION")}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={ticketStyles.inputGroup}>
            <View style={ticketStyles.labelRow}>
              <Text style={ticketStyles.labelRowLeft}>
                {t("ticket.title_label")} <Text style={ticketStyles.required}>*</Text>
              </Text>
              <Text style={ticketStyles.charCount}>
                {title.length}/200
              </Text>
            </View>
            <TextInput
              ref={titleInputRef}
              style={ticketStyles.input}
              placeholder={t("ticket.title_placeholder")}
              placeholderTextColor={neutral.textMuted}
              value={title}
              onChangeText={setTitle}
              maxLength={200}
              onFocus={() =>
                scheduleAndroidScrollOnFocus(titleInputRef, {
                  extraLift: ANDROID_TITLE_EXTRA_LIFT,
                })
              }
            />
          </View>

          <View style={ticketStyles.inputGroup}>
            <View style={ticketStyles.labelRow}>
              <Text style={ticketStyles.labelRowLeft}>
                {t("ticket.description_label")} <Text style={ticketStyles.required}>*</Text>
              </Text>
              <Text style={ticketStyles.charCount}>
                {description.length}/2000
              </Text>
            </View>
            <TextInput
              ref={descInputRef}
              style={[ticketStyles.input, ticketStyles.textArea]}
              placeholder={t("ticket.description_placeholder")}
              placeholderTextColor={neutral.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={2000}
              onFocus={() => scheduleAndroidScrollOnFocus(descInputRef)}
            />
          </View>

          <View style={[ticketStyles.imagesSection, ticketStyles.inputGroupLast]}>
            <Text style={ticketStyles.label}>{t("ticket.images_label")}</Text>
            <View style={ticketStyles.attachmentDropzone}>
              <Text style={ticketStyles.imagesHint}>
                {t("ticket.images_hint", { max: MAX_TICKET_ATTACHMENT_IMAGES })}
              </Text>
              <View style={ticketStyles.imageButtonsRow}>
                <TouchableOpacity
                  style={[
                    ticketStyles.imageButton,
                    selectedImages.length >= MAX_TICKET_ATTACHMENT_IMAGES && { opacity: 0.5 },
                  ]}
                  onPress={handleTakePhoto}
                  activeOpacity={0.9}
                  disabled={selectedImages.length >= MAX_TICKET_ATTACHMENT_IMAGES}
                >
                  <Icons.photoCamera size={20} color={neutral.surface} />
                  <Text style={ticketStyles.imageButtonText}>{t("ticket.images_camera")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    ticketStyles.imageButton,
                    ticketStyles.imageButtonSecondary,
                    selectedImages.length >= MAX_TICKET_ATTACHMENT_IMAGES && { opacity: 0.5 },
                  ]}
                  onPress={handlePickFromGallery}
                  activeOpacity={0.9}
                  disabled={selectedImages.length >= MAX_TICKET_ATTACHMENT_IMAGES}
                >
                  <Icons.photoLibrary size={20} color={brandSecondary} />
                  <Text style={[ticketStyles.imageButtonText, ticketStyles.imageButtonTextSecondary]}>
                    {t("ticket.images_library")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {selectedImages.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={ticketStyles.ticketImagesScroll}
                contentContainerStyle={ticketStyles.ticketImagesStrip}
              >
                {selectedImages.map((img, idx) => (
                  <View
                    key={`${img.uri}-${idx}`}
                    style={[ticketStyles.imageThumb, ticketStyles.ticketImageThumbHorizontal]}
                  >
                    <View style={ticketStyles.imageThumbInner}>
                      <Image
                        source={{ uri: img.uri }}
                        style={ticketStyles.imageThumbImg}
                        resizeMode="cover"
                      />
                    </View>

                    <TouchableOpacity
                      style={ticketStyles.removeImageBtn}
                      onPress={() =>
                        setSelectedImages((prev) => prev.filter((_, i) => i !== idx))
                      }
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={t("ticket.images_remove")}
                    >
                      <Icons.close size={16} color={neutral.surface} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            ) : null}
          </View>

          <TouchableOpacity
            style={[ticketStyles.submitButton, submitting && { opacity: 0.72 }]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.9}
          >
            {submitting ? (
              <RefreshLogoInline logoPx={20} />
            ) : (
              <Text style={ticketStyles.submitButtonText}>{t("ticket.submit_button")}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      <ImageCaptureModal
        visible={imageCaptureVisible}
        onClose={() => setImageCaptureVisible(false)}
        onPicked={(assets) => {
          addPickedImages(assets);
        }}
        libraryLabel={t("ticket.images_library")}
        libraryPermissionErrorMessage={t("ticket.library_permission_no_permission")}
        cameraShotsRemaining={Math.max(0, MAX_TICKET_ATTACHMENT_IMAGES - selectedImages.length)}
        librarySelectionLimit={Math.max(0, MAX_TICKET_ATTACHMENT_IMAGES - selectedImages.length)}
        maxImagesForAlert={MAX_TICKET_ATTACHMENT_IMAGES}
      />
    </View>
  );
};

export default TicketScreen;

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Image, Modal, Platform, Text, TouchableOpacity, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";

import { CustomAlert as Alert } from "../../../shared/components/alert";
import { useCameraPinchZoom } from "../../../shared/hooks/useCameraPinchZoom";
import { neutral } from "../../../shared/theme/color";
import { RefreshLogoOverlay } from "@shared/components/RefreshLogoOverlay";

type Props = {
  visible: boolean;
  onClose: () => void;
  onPicked: (assets: ImagePicker.ImagePickerAsset[]) => void;
  libraryLabel?: string;
  libraryPermissionErrorMessage?: string;
  captureQuality?: number;
  cameraShotsRemaining?: number;
  librarySelectionLimit?: number;
  maxImagesForAlert?: number;
};

export function ImageCaptureModal({
  visible,
  onClose,
  onPicked,
  libraryLabel,
  libraryPermissionErrorMessage,
  captureQuality = 0.45,
  cameraShotsRemaining,
  librarySelectionLimit,
  maxImagesForAlert,
}: Props) {
  const saveCaptureToDeviceGallery = async (localUri: string) => {
    if (Platform.OS === "web") return;
    try {
      await MediaLibrary.saveToLibraryAsync(localUri);
    } catch {
      try {
        const { granted } = await MediaLibrary.requestPermissionsAsync(true);
        if (granted) {
          await MediaLibrary.saveToLibraryAsync(localUri);
        }
      } catch {
        /* bỏ qua */
      }
    }
  };

  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const { zoom, pinchGesture, resetZoom } = useCameraPinchZoom();
  const [lastPickedUri, setLastPickedUri] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<"back" | "front">("back");
  const cameraShotsRemainingRef = useRef(cameraShotsRemaining);
  const captureQueueRef = useRef(Promise.resolve());

  useEffect(() => {
    cameraShotsRemainingRef.current = cameraShotsRemaining;
  }, [cameraShotsRemaining]);

  useEffect(() => {
    if (!visible) return;
    if (!permission) return;
    if (!permission.granted) {
      requestPermission();
    }
  }, [visible, permission, requestPermission]);

  useEffect(() => {
    if (!visible) resetZoom();
  }, [visible, resetZoom]);

  useEffect(() => {
    if (!visible) captureQueueRef.current = Promise.resolve();
  }, [visible]);

  const resolvedLibraryLabel = useMemo(
    () => libraryLabel ?? t("ticket.images_library"),
    [libraryLabel, t]
  );

  const resolvedLibraryPermissionError = useMemo(
    () =>
      libraryPermissionErrorMessage ?? t("ticket.library_permission_no_permission"),
    [libraryPermissionErrorMessage, t]
  );

  const showLimitBanner =
    maxImagesForAlert != null &&
    maxImagesForAlert > 0 &&
    cameraShotsRemaining != null &&
    cameraShotsRemaining >= 0;

  const handleTakePhoto = () => {
    captureQueueRef.current = captureQueueRef.current.then(async () => {
      const rem = cameraShotsRemainingRef.current;
      if (rem !== undefined && rem <= 0) {
        Alert.alert(
          t("common.images_limit_title"),
          t("common.images_limit_max_message", { max: maxImagesForAlert ?? 5 }),
          [{ text: t("common.close") }]
        );
        return;
      }
      try {
        const photo = await cameraRef.current?.takePictureAsync({
          quality: captureQuality,
          shutterSound: false,
        });
        if (photo?.uri) {
          setLastPickedUri(photo.uri);
          void saveCaptureToDeviceGallery(photo.uri);
          onPicked([{ uri: photo.uri } as ImagePicker.ImagePickerAsset]);
        }
      } catch (e) {
        Alert.alert(t("common.error"), e instanceof Error ? e.message : String(e), [
          { text: t("common.close") },
        ]);
      }
    });
  };

  const handlePickFromLibrary = async () => {
    if (librarySelectionLimit !== undefined && librarySelectionLimit <= 0) {
      Alert.alert(
        t("common.images_limit_title"),
        t("common.images_limit_max_message", { max: maxImagesForAlert ?? 5 }),
        [{ text: t("common.close") }]
      );
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert(t("common.error"), resolvedLibraryPermissionError, [
        { text: t("common.close") },
      ]);
      return;
    }

    // Đóng modal camera trước khi mở thư viện → sau khi chọn xong user về thẳng màn trước, không thấy lại camera.
    onClose();

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"] as ImagePicker.MediaType[],
      allowsMultipleSelection: true,
      selectionLimit:
        librarySelectionLimit !== undefined ? Math.max(1, librarySelectionLimit) : 0,
      quality: captureQuality,
    });

    if (result.canceled) return;

    if (result.assets?.length) {
      let assets = result.assets;
      const cap =
        librarySelectionLimit !== undefined && librarySelectionLimit > 0
          ? librarySelectionLimit
          : null;
      if (cap != null && assets.length > cap) {
        assets = assets.slice(0, cap);
        Alert.alert(
          t("common.images_limit_title"),
          t("common.images_limit_truncated_message", {
            added: cap,
            max: maxImagesForAlert ?? cap,
          }),
          [{ text: t("common.close") }]
        );
      }
      onPicked(assets);
    }
  };

  const cameraAllowed = !!permission?.granted;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: neutral.black }}>
        {!cameraAllowed ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              padding: 16,
              position: "relative",
            }}
          >
            <RefreshLogoOverlay visible mode="page" />
            <TouchableOpacity
              onPress={onClose}
              style={{
                marginTop: 18,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: "#111827",
              }}
            >
              <Text style={{ color: neutral.surface, fontWeight: "700" }}>
                {t("common.close")}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <GestureDetector gesture={pinchGesture}>
              <View style={{ flex: 1 }}>
                <CameraView
                  ref={cameraRef}
                  style={{ flex: 1 }}
                  facing={cameraFacing}
                  zoom={zoom}
                />
              </View>
            </GestureDetector>

            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: insets.bottom,
                paddingHorizontal: 16,
                paddingBottom: 16,
                backgroundColor: "rgba(0,0,0,0.25)",
              }}
            >
              {showLimitBanner ? (
                <Text
                  style={{
                    textAlign: "center",
                    color: neutral.surface,
                    marginBottom: 10,
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  {t("common.images_count_of_max", {
                    current: Math.max(0, (maxImagesForAlert ?? 0) - cameraShotsRemaining!),
                    max: maxImagesForAlert,
                  })}
                </Text>
              ) : null}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                {/* Placeholder để giữ bố cục như camera app */}
                <View style={{ width: 56, height: 56 }} />

                {/* Nút chụp */}
                <TouchableOpacity
                  onPress={() => handleTakePhoto()}
                  accessibilityRole="button"
                  accessibilityLabel={t("ticket.images_camera")}
                  style={{
                    width: 78,
                    height: 78,
                    borderRadius: 39,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 4,
                    borderColor: neutral.surface,
                    backgroundColor: "rgba(255,255,255,0.10)",
                    opacity:
                      cameraShotsRemaining !== undefined && cameraShotsRemaining <= 0 ? 0.45 : 1,
                  }}
                >
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: neutral.surface,
                    }}
                  />
                </TouchableOpacity>

                {/* Thumbnail nút thư viện */}
                <TouchableOpacity
                  onPress={() => void handlePickFromLibrary()}
                  accessibilityRole="button"
                  accessibilityLabel={resolvedLibraryLabel}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: "rgba(15, 23, 42, 0.75)",
                    borderWidth: 1,
                    borderColor: "rgba(148, 163, 184, 0.35)",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    opacity:
                      librarySelectionLimit !== undefined && librarySelectionLimit <= 0 ? 0.45 : 1,
                  }}
                >
                  {lastPickedUri ? (
                    <Image
                      source={{ uri: lastPickedUri }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text
                      style={{
                        color: neutral.surface,
                        fontWeight: "800",
                        fontSize: 11,
                        paddingHorizontal: 6,
                        textAlign: "center",
                      }}
                    >
                      {resolvedLibraryLabel}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Nút đổi camera trước/sau */}
            <TouchableOpacity
              onPress={() =>
                setCameraFacing((f) => (f === "back" ? "front" : "back"))
              }
              accessibilityRole="button"
              accessibilityLabel={t("camera.switch_camera") ?? "Switch camera"}
              style={{
                position: "absolute",
                top: insets.top + 14,
                right: 16,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: "rgba(0,0,0,0.55)",
              }}
            >
              <MaterialIcons
                name="flip-camera-android"
                size={22}
                color={neutral.surface}
              />
            </TouchableOpacity>
          </>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}


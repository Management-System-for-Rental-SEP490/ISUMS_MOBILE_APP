import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import {
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Pressable,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CustomAlert as Alert } from "../../../shared/components/alert";
import { useEffect, useMemo, useState, useRef } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { cameraStyles } from "./cameraStyles";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../shared/types";
import NfcManager, { NfcTech, Ndef } from "react-native-nfc-manager";
import { ScanMode } from "../../../shared/types";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../../store/useAuthStore";
import { getAssetItemByNfcId } from "../../../shared/services/assetItemApi";
import { useTenantContext } from "../../../shared/hooks";
import { isTenantHandoverStatusPending } from "../../../shared/utils";
import Icons from "../../../shared/theme/icon";
import { brandPrimary, brandSecondary, neutral } from "../../../shared/theme/color";


const CameraScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "Camera">>();
  const currentHouseId = useAuthStore((s) => s.houseId);
  const initialScanMode = route.params?.initialScanMode;
  const { house } = useTenantContext();
  const handoverBlocked = useMemo(() => isTenantHandoverStatusPending(house), [house]);

  const [permission, requestPermission] = useCameraPermissions(); 
  const [scanned, setScanned] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>(() => initialScanMode ?? "qr");
  const [nfcScanning, setNfcScanning] = useState(false);
  const [modeSwitchW, setModeSwitchW] = useState(0);
  const nfcTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const modeSlideAnim = useRef(
    new Animated.Value((initialScanMode ?? "qr") === "qr" ? 0 : 1)
  ).current;
  const modeIndicatorTranslateX = useMemo(
    () =>
      modeSlideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.max(0, modeSwitchW) / 2],
      }),
    [modeSlideAnim, modeSwitchW]
  );

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  //[]: Chỉ chạy một lần khi mount.
  //[value]: Chạy lại khi value thay đổi.
  //Không có mảng: Chạy sau mỗi lần render.
  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  useEffect(() => {
    Animated.spring(modeSlideAnim, {
      toValue: scanMode === "qr" ? 0 : 1,
      useNativeDriver: true,
      tension: 68,
      friction: 12,
    }).start();
  }, [scanMode, modeSlideAnim]);

  useEffect(() => {
    // Khởi tạo NFC Manager khi component mount
    NfcManager.start().catch((err) => { // khởi tạo NFC và gọi start() để bắt đầu quét NFC(trả về 1 promise).
      console.log("NFC không được hỗ trợ:", err); // nếu không được hỗ trợ thì log lỗi.
    });

    return () => {// cleanup function: khi component unmount & trước khi effect chạy lại
      // Cleanup khi component unmount
      if (nfcTimeoutRef.current) {
        clearTimeout(nfcTimeoutRef.current); // huỷ timeout nếu có.
      }
      NfcManager.cancelTechnologyRequest().catch(() => {}); // huỷ yêu cầu technology request nếu có và bắt lỗi nhưng ko làm gì
    };
  }, []);
// → Tránh Alert hiện ra sau khi đã đóng màn hình
  useEffect(() => {
    // Chưa bàn giao: không cho dùng NFC (kể cả mở từ footer / deep link).
    if (handoverBlocked) {
      if (scanMode === "nfc") {
        setScanMode("qr");
        setScanned(false);
        void stopNfcScan();
      }
      return;
    }
    if (scanMode === "nfc" && !scanned && !nfcScanning) {
      startNfcScan();
    } else if (scanMode === "qr") {
      stopNfcScan();
    }
  }, [scanMode, handoverBlocked]);

  const startNfcScan = async () => {
    if (handoverBlocked) {
      Alert.alert(
        t("camera.nfc_handover_blocked_title"),
        t("camera.nfc_handover_blocked_body"),
        [{ text: t("common.close") }]
      );
      return;
    }
    if (nfcScanning || scanned) return;
    
    try {
      // Hủy request cũ nếu có để tránh lỗi "You can only issue one request at a time"
      await NfcManager.cancelTechnologyRequest().catch(() => {});
      
      setNfcScanning(true);
      // Thử dùng NfcA trước (cho NTAG213 - ISO14443 Type A)
      // Nếu không được thì thử Ndef
      let tag = null;
      // let là biến có thể gán lại giá trị.
      
      try {
        await NfcManager.requestTechnology(NfcTech.NfcA);
        tag = await NfcManager.getTag();
      } catch (nfcAError) {
        // Nếu NfcA không được, thử Ndef
        console.log("Thử NfcA không được, chuyển sang Ndef:", nfcAError);
        // Cần cancel request cũ trước khi request Ndef
        await NfcManager.cancelTechnologyRequest().catch(() => {});
        await NfcManager.requestTechnology(NfcTech.Ndef);
        tag = await NfcManager.getTag();//
      }
      
      // Đặt timeout để tránh scan quá lâu
      nfcTimeoutRef.current = setTimeout(() => {
        if (!isMounted.current) return;
        stopNfcScan();
        Alert.alert(
          t('camera.timeout_title'),
          t('camera.timeout_msg'),
          [
            {
              text: t('common.try_again'),
              onPress: () => startNfcScan(),
            },
            {
              text: t('common.close'),
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }, 10000); // 10 giây timeout
//setTimeout(callback, delay): tạo timeout, chạy callback sau delay ms.
      if (tag && !scanned) {
        handleNfcScanned(tag);
      }
    } catch (err: any) {
      if (!isMounted.current) return;
      console.log("Lỗi scan NFC:", err);
      if (err.message !== "User cancelled") { //Chỉ hiển thị Alert nếu không phải lỗi do người dùng hủy.
        Alert.alert(
          t('camera.error_title'),
          t('camera.read_error'),
          [
            {
              text: t('common.try_again'),
              onPress: () => startNfcScan(),
            },
            {
              text: t('common.close'),
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
      setNfcScanning(false);
    }
  };

  const stopNfcScan = async () => {
    if (nfcTimeoutRef.current) {
      clearTimeout(nfcTimeoutRef.current);
      nfcTimeoutRef.current = null;
    }
    try {
      await NfcManager.cancelTechnologyRequest(); // huỷ yêu cầu technology request nếu có và bắt lỗi nhưng ko làm gì
    } catch (err) {
      console.log("Lỗi dừng NFC:", err);
    }
    setNfcScanning(false);
  };

  // Luồng Tenant: quét NFC/QR → mở trang chi tiết thiết bị (TenantItemDetail) nếu thiết bị thuộc nhà mình
  const handleTagScanned = async (tagValue: string, type: "NFC" | "QR_CODE") => {
    console.log(`Scanned ${type}:`, tagValue);
    try {
      const assetItem = await getAssetItemByNfcId(tagValue);

      if (assetItem) {
        // Yêu cầu mới: Chỉ cho phép quét thiết bị thuộc CĂN NHÀ ĐANG CHỌN (currentHouseId).
        // Nếu assetItem.houseId trùng với currentHouseId thì mới cho phép.
        const isCurrentHouseDevice = currentHouseId && assetItem.houseId === currentHouseId;

        if (isCurrentHouseDevice) {
          navigation.replace("TenantItemDetail", { item: assetItem });
          return;
        }

        // Thiết bị không thuộc nhà đang chọn (dù có thể thuộc nhà khác của tenant)
        if (!isMounted.current) return;
        Alert.alert(
          t("camera.not_found_title"),
          t("camera.device_not_in_your_house"), // Có thể cần sửa lại câu thông báo cho chính xác hơn "Thiết bị không thuộc nhà đang chọn"
          [
            {
              text: t("camera.rescan"),
              onPress: () => {
                setScanned(false);
                if (type === "NFC") startNfcScan();
              },
            },
            { text: t("common.close"), onPress: () => navigation.goBack() },
          ]
        );
        return;
      }

      // Không tìm thấy thiết bị tương ứng với Tag vừa quét.
      if (!isMounted.current) return;
      Alert.alert(
        t("camera.not_found_title"),
        type === "QR_CODE"
          ? t("camera.not_found_qr", { id: tagValue })
          : t("camera.not_found_nfc", { id: tagValue }),
        [
          {
            text: t("camera.rescan"),
            onPress: () => {
              setScanned(false);
              if (type === "NFC") startNfcScan();
            },
          },
          {
            text: t("common.close"),
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.log("Lỗi tra cứu thiết bị cho tenant:", error);
      if (!isMounted.current) return;
      Alert.alert(
        t("camera.error_title"),
        t("camera.read_error"),
        [
          {
            text: t("camera.rescan"),
            onPress: () => {
              setScanned(false);
              if (type === "NFC") startNfcScan();
            },
          },
          {
            text: t("common.close"),
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  const handleNfcScanned = async (tag: any) => {
    if (scanned) return;
    setScanned(true);
    await stopNfcScan();

    let nfcId = "";
    // ... Parsing logic ...
    console.log("NFC Tag object:", JSON.stringify(tag, null, 2));
    
    if (tag.idBytes && Array.isArray(tag.idBytes)) {
      const uidBytes = tag.idBytes.slice(0, 7);
      nfcId = uidBytes
        .map((byte: number) => {
          if (typeof byte !== "number" || isNaN(byte) || byte < 0 || byte > 255) return null;
          return byte.toString(16).padStart(2, "0").toUpperCase();
        })
        .filter((hex: string | null) => hex !== null)
        .join(" ");
    } else if (tag.id) {
       if (typeof tag.id === "string") {
        let cleanedId = tag.id.replace(/[^0-9A-Fa-f]/g, "");
        if (tag.id.includes(":") || tag.id.includes(" ")) {
          cleanedId = tag.id.replace(/[^0-9A-Fa-f\s:]/gi, "");
          cleanedId = cleanedId.replace(/:/g, " ").replace(/\s+/g, " ").trim();
          nfcId = cleanedId.toUpperCase();
        } else {
          nfcId = cleanedId.match(/.{1,2}/g)?.slice(0, 7).join(" ").toUpperCase() || "";
        }
      } else if (Array.isArray(tag.id)) {
        const uidArray = tag.id.slice(0, 7);
        nfcId = uidArray
          .map((byte: unknown) => {
            const num = typeof byte === "number" ? byte : parseInt(String(byte), 10);
            if (isNaN(num) || num < 0 || num > 255) return null;
            return num.toString(16).padStart(2, "0").toUpperCase();
          })
          .filter((hex: string | null) => hex !== null)
          .join(" ");
      } else {
        try {
          const idArray = Array.from(tag.id as ArrayLike<unknown>);
          const uidArray = idArray.slice(0, 7);
          nfcId = uidArray
            .map((byte: unknown) => {
              const num = typeof byte === "number" ? byte : parseInt(String(byte), 10);
              if (isNaN(num) || num < 0 || num > 255) return null;
              return num.toString(16).padStart(2, "0").toUpperCase();
            })
            .filter((hex: string | null) => hex !== null)
            .join(" ");
        } catch (e) {
          console.log("Lỗi convert tag.id:", e);
        }
      }
    }

    console.log("NFC ID đã đọc:", nfcId);

    if (!nfcId || nfcId.length === 0) {
      Alert.alert(
        t('camera.error_title'),
        t('camera.id_error'),
        [
          {
            text: t('common.try_again'),
            onPress: () => {
              setScanned(false);
              startNfcScan();
            },
          },
          {
            text: t('common.close'),
            onPress: () => navigation.goBack(),
          },
        ]
      );
      return;
    }

    handleTagScanned(nfcId, "NFC");
  };

  // logic scan QR code
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned || scanMode !== "qr") return;
    setScanned(true);
    handleTagScanned(data, "QR_CODE");
  };

  if (!permission) { 
    return (
      <View style={cameraStyles.container}>
        <Text style={cameraStyles.text}>{t('camera.loading')}</Text>
      </View>
    );
  }

  if (!permission.granted) { 
    return (
      <View style={cameraStyles.container}>
        <Text style={cameraStyles.text}>{t('camera.no_permission')}</Text>
        <TouchableOpacity onPress={requestPermission} style={cameraStyles.button}>
          <Text style={cameraStyles.buttonText}>{t('camera.grant_permission')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View
        style={[
          cameraStyles.modeToggleContainer,
          { top: insets.top + 12 },
        ]}
      >
        <View
          style={cameraStyles.modeSwitchTrack}
          onLayout={(e) => setModeSwitchW(e.nativeEvent.layout.width)}
        >
          <Animated.View
            style={[
              cameraStyles.modeSwitchIndicator,
              {
                width: "50%",
                transform: [{ translateX: modeIndicatorTranslateX }],
                backgroundColor:
                  scanMode === "qr" ? brandPrimary : brandSecondary,
              },
            ]}
          />
          <Pressable
            style={cameraStyles.modeSwitchTab}
            onPress={() => {
              setScanMode("qr");
              setScanned(false);
            }}
          >
            <Icons.scanLookup
              size={18}
              color={scanMode === "qr" ? "#fff" : neutral.textSecondary}
            />
            <Text
              style={[
                cameraStyles.modeSwitchTabText,
                scanMode === "qr" && cameraStyles.modeSwitchTabTextActive,
              ]}
            >
              {t("camera.qr_mode")}
            </Text>
          </Pressable>
          <Pressable
            style={[
              cameraStyles.modeSwitchTab,
              handoverBlocked && { opacity: 0.45 },
            ]}
            disabled={handoverBlocked}
            onPress={() => {
              if (handoverBlocked) {
                Alert.alert(
                  t("camera.nfc_handover_blocked_title"),
                  t("camera.nfc_handover_blocked_body"),
                  [{ text: t("common.close") }]
                );
                return;
              }
              setScanMode("nfc");
              setScanned(false);
            }}
          >
            <Icons.nfc
              size={18}
              color={scanMode === "nfc" ? "#fff" : neutral.textSecondary}
            />
            <Text
              style={[
                cameraStyles.modeSwitchTabText,
                scanMode === "nfc" && cameraStyles.modeSwitchTabTextActive,
              ]}
            >
              {t("camera.nfc_mode")}
            </Text>
          </Pressable>
        </View>
      </View>

      {scanMode === "qr" ? (
        // Chế độ scan QR Code
        <>
          <CameraView
            style={{ flex: 1 }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned} //nếu đã scan → undefined (tắt), nếu chưa → handleBarCodeScanned
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
          />
          <View style={cameraStyles.overlay}>
            <View style={cameraStyles.unfocusedContainer}></View>
            <View style={cameraStyles.middleContainer}>
              <View style={cameraStyles.unfocusedContainer}></View>
              <View style={cameraStyles.focusedContainer}></View>
              <View style={cameraStyles.unfocusedContainer}></View>
            </View>
            <View style={cameraStyles.unfocusedContainer}></View>
          </View>
        </>
      ) : (
        // Chế độ scan NFC
        <View style={cameraStyles.nfcContainer}>
          <View style={cameraStyles.nfcIconContainer}>
            <Text style={cameraStyles.nfcIcon}>📱</Text>
          </View>
          <Text style={cameraStyles.nfcTitle}>
            {nfcScanning ? t("camera.nfc_scanning") : t("camera.nfc_instruction")}
          </Text>
          <Text style={cameraStyles.nfcDescription}>
            {nfcScanning ? t("camera.nfc_wait") : t("camera.nfc_start")}
          </Text>
          {!nfcScanning && !scanned && (
            <TouchableOpacity
              style={cameraStyles.nfcScanButton}
              onPress={startNfcScan}
            >
              <Text style={cameraStyles.nfcScanButtonText}>
                {t("camera.nfc_btn")}
              </Text>
            </TouchableOpacity>
          )}
          {nfcScanning && (
            <View style={cameraStyles.nfcScanningIndicator}>
              <Text style={cameraStyles.nfcScanningText}>
                {t("camera.nfc_scanning_indicator")}
              </Text>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity
        onPress={() => {
          stopNfcScan();
          navigation.goBack();
        }}
        style={[
          cameraStyles.closeButton,
          { bottom: insets.bottom + 28 },
        ]}
      >
        <Text style={cameraStyles.closeButtonText}>{t('common.close')}</Text>
      </TouchableOpacity>
    </View>
  );
};



export default CameraScreen;
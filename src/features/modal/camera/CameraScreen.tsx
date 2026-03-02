import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Text, TouchableOpacity, View, Alert, ActivityIndicator } from "react-native";
import { useEffect, useState, useRef } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { cameraStyles } from "./cameraStyles";
import { getDeviceById, getDeviceByNfcTag } from "../../../shared/services/deviceData";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../shared/types";
import NfcManager, { NfcTech, Ndef } from "react-native-nfc-manager";
import { ScanMode } from "../../../shared/types";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../../store/useAuthStore";
import { getAssetItemByNfcId } from "../../../shared/services/assetItemApi";
import { useAttachAssetTag } from "../../../shared/hooks";
import type { AssetItemFromApi } from "../../../shared/types/api";
import { AssignNfcModal } from "../../staff/modal/assignNFC/AssignNfcModal";


const CameraScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "Camera">>();
  const role = useAuthStore((s) => s.role);
  /** Từ BuildingDetail: gán NFC cho thiết bị đã chọn. */
  const assignForDevice = route.params?.assignForDevice;
  /** "assign" = từ menu + Gán NFC; "lookup" (hoặc undefined) = tra cứu. */
  const cameraMode = route.params?.mode;

  // Debug params
  useEffect(() => {
    console.log("CameraScreen params:", { mode: cameraMode, assignForDevice: assignForDevice?.id, role });
  }, [route.params]);

  const [permission, requestPermission] = useCameraPermissions(); 
  const [scanned, setScanned] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>(() => {
    if (assignForDevice || cameraMode === "assign") return "nfc";
    if (role === "technical") return "nfc";
    return "qr";
  });
  const [nfcScanning, setNfcScanning] = useState(false);
  const [scannedNfcId, setScannedNfcId] = useState<string | null>(null);
  /** Điều khiển hiển thị modal chọn thiết bị trống để gán NFC. */
  const [assignModalVisible, setAssignModalVisible] = useState(false);

  const nfcTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /** Gán NFC vào thiết bị qua POST /api/asset/tags (thay vì PUT item). */
  const { mutateAsync: attachAssetTag } = useAttachAssetTag();

  //[]: Chỉ chạy một lần khi mount.
  //[value]: Chạy lại khi value thay đổi.
  //Không có mảng: Chạy sau mỗi lần render.
  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

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
    // Khi chuyển sang chế độ NFC, tự động bắt đầu scan
    if (scanMode === "nfc" && !scanned && !nfcScanning) {
      startNfcScan();
    } else if (scanMode === "qr") {
      // Dừng NFC scan khi chuyển về QR
      stopNfcScan();
    }
  }, [scanMode]);

  const startNfcScan = async () => {
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

  const handleNfcScanned = async (tag: any) => {
    if (scanned) return;
    setScanned(true);
    await stopNfcScan();//await: chờ cho đến khi stopNfcScan hoàn thành.

    // Lấy ID của thẻ NFC
    // Format ID có thể khác nhau tùy loại thẻ, thử nhiều cách
    let nfcId = "";
    
    // Debug: log tag để xem cấu trúc
    console.log("NFC Tag object:", JSON.stringify(tag, null, 2)); //
    
    // Thử đọc từ idBytes trước (đây là cách đúng nhất cho NTAG213)
    if (tag.idBytes && Array.isArray(tag.idBytes)) {
      // Với NTAG213, UID thường là 7 bytes đầu tiên
      const uidBytes = tag.idBytes.slice(0, 7);//slice(start, end): lấy phần tử từ start đến end. lấy 7 phần tử đầu tiên.
      nfcId = uidBytes
        .map((byte: number) => {
          if (typeof byte !== "number" || isNaN(byte) || byte < 0 || byte > 255) { //isNaN: kiểm tra xem byte có phải là số không.
            return null;
          }
          return byte.toString(16).padStart(2, "0").toUpperCase(); //padStart(length, "0"): đệm 0 vào đầu string để đảm bảo độ dài là length.
        })
        .filter((hex: string | null) => hex !== null) //filter(callback): lọc các phần tử của mảng, chỉ lấy các phần tử không phải null.
        .join(" "); //join(" "): nối các phần tử của mảng thành một string, cách nhau bởi dấu cách.
    }
    // Nếu không có idBytes, thử đọc từ id (có thể là string hex hoặc array)
    else if (tag.id) {
      if (typeof tag.id === "string") {
        // Nếu id là string hex (ví dụ: "049C59A2B21990" hoặc "04:9C:59:A2:B2:19:90")
        // Loại bỏ tất cả ký tự không phải hex
        let cleanedId = tag.id.replace(/[^0-9A-Fa-f]/g, ""); //replace(pattern, replacement): thay thế tất cả ký tự không phải hex bằng "", tức là xóa hết. /g: global, thay thế tất cả ký tự không phải hex.
        // Nếu có dấu hai chấm hoặc khoảng trắng, giữ lại format
        if (tag.id.includes(":") || tag.id.includes(" ")) {
          cleanedId = tag.id.replace(/[^0-9A-Fa-f\s:]/gi, ""); //gi: global, case insensitive, thay thế tất cả ký tự(có viết hoa và viết thường) không phải hex bằng "", tức là xóa hết.
          // Chuyển đổi về format có khoảng trắng
          cleanedId = cleanedId.replace(/:/g, " ").replace(/\s+/g, " ").trim();///:/g: tìm tất cả dấu hai chấm.Thay bằng " " ,/\s+/g: khớp một hoặc nhiều khoảng trắng liên tiếp. Thay bằng " " ,trim(): xóa khoảng trắng ở đầu và cuối string.
          nfcId = cleanedId.toUpperCase();
        } else {
          // Chuyển đổi thành format "XX XX XX..."
          nfcId = cleanedId.match(/.{1,2}/g)?.slice(0, 7).join(" ").toUpperCase() || ""; //match(pattern): tìm tất cả ký tự phù hợp với pattern. slice(start, end): lấy phần tử từ start đến end. join(" "): nối các phần tử của mảng thành một string, cách nhau bởi dấu cách.
        }
//const cleanedId = "049C59A2B21990";
//cleanedId.match(/.{1,2}/g)?.slice(0, 7).join(" ").toUpperCase()
// Kết quả: ["04", "9C", "59", "A2", "B2", "19", "90"]
      } else if (Array.isArray(tag.id)) {
        // Nếu id là array, lấy 7 bytes đầu (UID của NTAG213)
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
        // Thử convert sang array
        try {
          const idArray = Array.from(tag.id as ArrayLike<unknown>);
          const uidArray = idArray.slice(0, 7);
          nfcId = uidArray
            .map((byte: unknown) => {
              const num = typeof byte === "number" ? byte : parseInt(String(byte), 10); // nếu byte là số thì lấy byte, nếu không thì convert byte thành số.
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

    // --- Luồng Staff: Gán NFC cho thiết bị đã chọn (từ màn BuildingDetail) ---
    if (assignForDevice) {
      // Đảm bảo 1 NFC chỉ gán cho 1 thiết bị: kiểm tra xem NFC này đã thuộc về thiết bị khác chưa.
      try {
        const existing = await getAssetItemByNfcId(nfcId);
        if (existing && existing.id !== assignForDevice.id) {
          Alert.alert(
            t("staff_nfc.duplicate_title"),
            t("staff_nfc.duplicate_message", { name: existing.displayName }),
            [
              {
                text: t("common.close"),
                onPress: () => {
                  setScanned(false);
                  startNfcScan();
                },
              },
            ]
          );
          return;
        }
      } catch (e) {
        console.log("Lỗi kiểm tra trùng NFC khi gán từ BuildingDetail:", e);
      }

      Alert.alert(
        t("staff_nfc.confirm_assign_title"),
        t("staff_nfc.confirm_assign_message", {
          nfcId,
          displayName: assignForDevice.displayName,
        }),
        [
          { text: t("common.cancel"), onPress: () => { setScanned(false); startNfcScan(); }, style: "cancel" as const },
          {
            text: t("common.save"),
            onPress: async () => {
              try {
                await attachAssetTag({
                  assetId: assignForDevice.id,
                  tagValue: nfcId,
                  tagType: "NFC",
                });
                Alert.alert(t("common.success"), t("staff_nfc.assign_success"), [
                  { text: t("common.close"), onPress: () => navigation.goBack() },
                ]);
              } catch {
                Alert.alert(t("camera.error_title"), t("staff_nfc.assign_error"), [
                  { text: t("common.close"), onPress: () => navigation.goBack() },
                ]);
              }
            },
          },
        ]
      );
      return;
    }

    // --- Luồng Staff: Quét NFC từ footer (chỉ tra cứu mã đã gán) ---
    if (role === "technical" && cameraMode !== "assign" && !assignForDevice) {
      try {
        const device = await getAssetItemByNfcId(nfcId);
        if (device) {
          navigation.replace("ItemDescription", { item: device });
          return;
        }
        Alert.alert(
          t("camera.not_found_title"),
          t("camera.lookup_no_device_nfc", { id: nfcId }),
          [
            { text: t("camera.rescan"), onPress: () => { setScanned(false); startNfcScan(); } },
            { text: t("common.close"), onPress: () => navigation.goBack() },
          ]
        );
      } catch {
        Alert.alert(
          t("camera.not_found_title"),
          t("camera.lookup_no_device_nfc", { id: nfcId }),
          [
            { text: t("camera.rescan"), onPress: () => { setScanned(false); startNfcScan(); } },
            { text: t("common.close"), onPress: () => navigation.goBack() },
          ]
        );
      }
      return;
    }

    // --- Luồng Staff: Từ menu "+" → Gán NFC: quét thẻ mới thì mở modal chọn thiết bị; thẻ đã gán thì báo lỗi ---
    if (role === "technical" && cameraMode === "assign") {
      try {
        const existing = await getAssetItemByNfcId(nfcId);
        if (existing) {
          Alert.alert(
            t("staff_nfc.duplicate_title"),
            t("staff_nfc.duplicate_message", { name: existing.displayName ?? existing.id }),
            [
              {
                text: t("common.close"),
                onPress: () => {
                  setScanned(false);
                  startNfcScan();
                },
              },
            ]
          );
          return;
        }
        setScannedNfcId(nfcId);
        setAssignModalVisible(true);
      } catch {
        Alert.alert(
          t("camera.not_found_title"),
          t("camera.not_found_nfc", { id: nfcId }),
          [
            { text: t("camera.rescan"), onPress: () => { setScanned(false); startNfcScan(); } },
            { text: t("common.close"), onPress: () => navigation.goBack() },
          ]
        );
      }
      return;
    }

    // --- Luồng Tenant: tra cứu thiết bị từ mock (getDeviceByNfcTag) ---
    const device = getDeviceByNfcTag(nfcId);

    if (device) {
      navigation.replace("DeviceDetail", { device });
    } else {
      Alert.alert(
        t('camera.not_found_title'),
        t('camera.not_found_nfc', { id: nfcId }),
        [
          {
            text: t('camera.rescan'),
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
    }
  };

// logic scan QR code

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned || scanMode !== "qr") return;
    setScanned(true);

    const device = getDeviceById(data);

    if (device) {
      navigation.replace("DeviceDetail", { device });
    } else {
      Alert.alert(
        t('camera.not_found_title'),
        t('camera.not_found_qr', { id: data }),
        [
          {
            text: t('camera.rescan'),
            onPress: () => setScanned(false),
          },
          {
            text: t('common.close'),
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
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
      {/* Toggle buttons để chuyển đổi giữa QR và NFC */}
      <View style={cameraStyles.modeToggleContainer}>
        <TouchableOpacity
          style={[
            cameraStyles.modeButton,
            scanMode === "qr" && cameraStyles.modeButtonActive,
          ]}
          onPress={() => {
            setScanMode("qr");
            setScanned(false);
          }}
        >
          <Text
            style={[
              cameraStyles.modeButtonText,
              scanMode === "qr" && cameraStyles.modeButtonTextActive,
            ]}
          >
            {t('camera.qr_mode')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            cameraStyles.modeButton,
            scanMode === "nfc" && cameraStyles.modeButtonActive,
          ]}
          onPress={() => {
            setScanMode("nfc");
            setScanned(false);
          }}
        >
          <Text
            style={[
              cameraStyles.modeButtonText,
              scanMode === "nfc" && cameraStyles.modeButtonTextActive,
            ]}
          >
            {t('camera.nfc_mode')}
          </Text>
        </TouchableOpacity>
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
        style={cameraStyles.closeButton}
      >
        <Text style={cameraStyles.closeButtonText}>{t('common.close')}</Text>
      </TouchableOpacity>

      {/* Modal chọn thiết bị trống để gán NFC (Staff) */}
      <AssignNfcModal
        visible={assignModalVisible}
        nfcId={scannedNfcId}
        onClose={() => {
          setAssignModalVisible(false);
          setScannedNfcId(null);
          setScanned(false);
        }}
        onSelectDevice={async (device: AssetItemFromApi) => {
          if (!scannedNfcId) return;
          Alert.alert(
            t("staff_nfc.confirm_assign_title"),
            t("staff_nfc.confirm_assign_message", {
              nfcId: scannedNfcId,
              displayName: device.displayName,
            }),
            [
              { text: t("common.cancel"), style: "cancel" as const },
              {
                text: t("common.save"),
            onPress: async () => {
              try {
                await attachAssetTag({
                  assetId: device.id,
                  tagValue: scannedNfcId,
                  tagType: "NFC",
                });
                setAssignModalVisible(false);
                Alert.alert(
                  t("common.success"),
                  t("staff_nfc.assign_success"),
                  [{ text: t("common.close"), onPress: () => navigation.goBack() }]
                );
              } catch (error: any) {
                // Lấy message lỗi từ BE nếu có
                const errorMessage = error?.response?.data?.message || t("staff_nfc.assign_error");
                Alert.alert(
                  t("camera.error_title"),
                  errorMessage,
                  [{ text: t("common.close") }]
                );
              }
            },
              },
            ]
          );
        }}
      />
    </View>
  );
};



export default CameraScreen;
import { useNavigation } from "@react-navigation/native";
import { Text, TouchableOpacity, View, Alert, StyleSheet } from "react-native";
import { useEffect, useState, useRef } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { cameraStyles } from "../../shared/styles/cameraStyles";
import { getDeviceById, getDeviceByNfcTag } from "../../shared/services/deviceData";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../shared/types";
import NfcManager, { NfcTech, Ndef } from "react-native-nfc-manager";

type ScanMode = "qr" | "nfc";

const CameraScreen = () => {
  const [permission, requestPermission] = useCameraPermissions(); 
  const [scanned, setScanned] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>("qr");
  const [nfcScanning, setNfcScanning] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>(); 
  const nfcTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  useEffect(() => {
    // Khởi tạo NFC Manager khi component mount
    NfcManager.start().catch((err) => {
      console.log("NFC không được hỗ trợ:", err);
    });

    return () => {
      // Cleanup khi component unmount
      if (nfcTimeoutRef.current) {
        clearTimeout(nfcTimeoutRef.current);
      }
      NfcManager.cancelTechnologyRequest().catch(() => {});
    };
  }, []);

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
      setNfcScanning(true);
      // Thử dùng NfcA trước (cho NTAG213 - ISO14443 Type A)
      // Nếu không được thì thử Ndef
      let tag = null;
      
      try {
        await NfcManager.requestTechnology(NfcTech.NfcA);
        tag = await NfcManager.getTag();
      } catch (nfcAError) {
        // Nếu NfcA không được, thử Ndef
        console.log("Thử NfcA không được, chuyển sang Ndef:", nfcAError);
        await NfcManager.requestTechnology(NfcTech.Ndef);
        tag = await NfcManager.getTag();
      }
      
      // Đặt timeout để tránh scan quá lâu
      nfcTimeoutRef.current = setTimeout(() => {
        stopNfcScan();
        Alert.alert(
          "Hết thời gian",
          "Không tìm thấy thẻ NFC. Vui lòng thử lại.",
          [
            {
              text: "Thử lại",
              onPress: () => startNfcScan(),
            },
            {
              text: "Đóng",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }, 10000); // 10 giây timeout

      if (tag && !scanned) {
        handleNfcScanned(tag);
      }
    } catch (err: any) {
      console.log("Lỗi scan NFC:", err);
      if (err.message !== "User cancelled") {
        Alert.alert(
          "Lỗi",
          "Không thể đọc thẻ NFC. Vui lòng thử lại.",
          [
            {
              text: "Thử lại",
              onPress: () => startNfcScan(),
            },
            {
              text: "Đóng",
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
      await NfcManager.cancelTechnologyRequest();
    } catch (err) {
      console.log("Lỗi dừng NFC:", err);
    }
    setNfcScanning(false);
  };

  const handleNfcScanned = async (tag: any) => {
    if (scanned) return;
    setScanned(true);
    await stopNfcScan();

    // Lấy ID của thẻ NFC
    // Format ID có thể khác nhau tùy loại thẻ, thử nhiều cách
    let nfcId = "";
    
    // Debug: log tag để xem cấu trúc
    console.log("NFC Tag object:", JSON.stringify(tag, null, 2));
    
    // Thử đọc từ idBytes trước (đây là cách đúng nhất cho NTAG213)
    if (tag.idBytes && Array.isArray(tag.idBytes)) {
      // Với NTAG213, UID thường là 7 bytes đầu tiên
      const uidBytes = tag.idBytes.slice(0, 7);
      nfcId = uidBytes
        .map((byte: number) => {
          if (typeof byte !== "number" || isNaN(byte) || byte < 0 || byte > 255) {
            return null;
          }
          return byte.toString(16).padStart(2, "0").toUpperCase();
        })
        .filter((hex: string | null) => hex !== null)
        .join(" ");
    }
    // Nếu không có idBytes, thử đọc từ id (có thể là string hex hoặc array)
    else if (tag.id) {
      if (typeof tag.id === "string") {
        // Nếu id là string hex (ví dụ: "049C59A2B21990" hoặc "04:9C:59:A2:B2:19:90")
        // Loại bỏ tất cả ký tự không phải hex
        let cleanedId = tag.id.replace(/[^0-9A-Fa-f]/g, "");
        // Nếu có dấu hai chấm hoặc khoảng trắng, giữ lại format
        if (tag.id.includes(":") || tag.id.includes(" ")) {
          cleanedId = tag.id.replace(/[^0-9A-Fa-f\s:]/gi, "");
          // Chuyển đổi về format có khoảng trắng
          cleanedId = cleanedId.replace(/:/g, " ").replace(/\s+/g, " ").trim();
          nfcId = cleanedId.toUpperCase();
        } else {
          // Chuyển đổi thành format "XX XX XX..."
          nfcId = cleanedId.match(/.{1,2}/g)?.slice(0, 7).join(" ").toUpperCase() || "";
        }
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
        "Lỗi",
        "Không thể đọc ID từ thẻ NFC.",
        [
          {
            text: "Thử lại",
            onPress: () => {
              setScanned(false);
              startNfcScan();
            },
          },
          {
            text: "Đóng",
            onPress: () => navigation.goBack(),
          },
        ]
      );
      return;
    }

    // Tìm thiết bị theo NFC tag ID
    const device = getDeviceByNfcTag(nfcId);

    if (device) {
      navigation.replace("DeviceDetail", { device });
    } else {
      Alert.alert(
        "Không tìm thấy",
        `Không tìm thấy thiết bị với NFC ID: ${nfcId}`,
        [
          {
            text: "Quét lại",
            onPress: () => {
              setScanned(false);
              startNfcScan();
            },
          },
          {
            text: "Đóng",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned || scanMode !== "qr") return;
    setScanned(true);

    const device = getDeviceById(data);

    if (device) {
      navigation.replace("DeviceDetail", { device });
    } else {
      Alert.alert(
        "Không tìm thấy",
        `Không tìm thấy thiết bị với mã: ${data}`,
        [
          {
            text: "Quét lại",
            onPress: () => setScanned(false),
          },
          {
            text: "Đóng",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  if (!permission) { 
    return (
      <View style={cameraStyles.container}>
        <Text style={cameraStyles.text}>Đang tải...</Text>
      </View>
    );
  }

  if (!permission.granted) { 
    return (
      <View style={cameraStyles.container}>
        <Text style={cameraStyles.text}>Không có quyền truy cập camera</Text>
        <TouchableOpacity onPress={requestPermission} style={cameraStyles.button}>
          <Text style={cameraStyles.buttonText}>Cấp quyền</Text>
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
            QR Code
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
            NFC
          </Text>
        </TouchableOpacity>
      </View>

      {scanMode === "qr" ? (
        // Chế độ scan QR Code
        <>
          <CameraView
            style={{ flex: 1 }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
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
            {nfcScanning ? "Đang quét NFC..." : "Đưa thẻ NFC vào điện thoại"}
          </Text>
          <Text style={cameraStyles.nfcDescription}>
            {nfcScanning
              ? "Vui lòng đợi trong khi hệ thống đọc thẻ NFC"
              : "Nhấn nút bên dưới để bắt đầu quét NFC"}
          </Text>
          {!nfcScanning && !scanned && (
            <TouchableOpacity
              style={cameraStyles.nfcScanButton}
              onPress={startNfcScan}
            >
              <Text style={cameraStyles.nfcScanButtonText}>Bắt đầu quét NFC</Text>
            </TouchableOpacity>
          )}
          {nfcScanning && (
            <View style={cameraStyles.nfcScanningIndicator}>
              <Text style={cameraStyles.nfcScanningText}>Đang quét...</Text>
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
        <Text style={cameraStyles.closeButtonText}>Đóng</Text>
      </TouchableOpacity>
    </View>
  );
};



export default CameraScreen;
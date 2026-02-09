import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  Animated,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useAuthStore } from "../../../store/useAuthStore";
import styles from "./onBoardingStyles";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window"); //lấy chiều rộng của màn hình.

const SLIDES = [
  {
    id: "1",
    title: "Quản lý thiết bị NFC",
    description:
      "Quét thẻ NFC trên thiết bị để xem thông tin chi tiết và gửi báo cáo hư hỏng ngay lập tức.",
    image: require("../../../../assets/logob.png"), 
  },
  {
    id: "2",
    title: "Thanh toán Dịch vụ",
    description:
      "Hỗ trợ thanh toán trực tuyến nhanh chóng sau khi quy trình bảo trì thiết bị hoàn tất thành công.",
    image: require("../../../../assets/logob.png"),
  },
  {
    id: "3",
    title: "Giám sát Điện & Nước",
    description:
      "Hệ thống IoT theo dõi chỉ số tiêu thụ theo thời gian thực và cảnh báo ngay nếu có bất thường.",
    image: require("../../../../assets/logob.png"),
  },
];

const OnBoarding = () => {
  const [currentIndex, setCurrentIndex] = useState(0); //currentIndex là biến để lưu trữ index của slide hiện tại.
  const scrollX = useRef(new Animated.Value(0)).current; //scrollX là biến để lưu trữ giá trị scroll của FlatList.
  const slidesRef = useRef<FlatList>(null); //slidesRef là biến để lưu trữ ref của FlatList.
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding); //completeOnboarding là hàm để hoàn thành onboarding.
  const insets = useSafeAreaInsets(); 
  //hàm dùng để nhận biết người dùng đang ở trang nào để cập nhật thanh hiển thị
  const viewableItemsChanged = useRef(({ viewableItems }: any) => { 
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index); //set giá trị của currentIndex về index của slide hiện tại.
    }
  }).current; // Hàm được tạo 1 lần, ghim chặt vào bộ nhớ, không bao giờ đổi.

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current; //Quy định cho FlatList biết "Khi nào thì được tính là đã chuyển sang trang mới?".
   //Xử lý logic khi người dùng bấm vào nút mũi tên hoặc nút "Tiếp tục".
  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    completeOnboarding();
  };
//vẽ ra dãy các dấu chấm ở dưới cùng màn hình
  const Paginator = ({ data, scrollX }: { data: any[]; scrollX: Animated.Value }) => {
    return (
      <View style={styles.paginationContainer}>
        {data.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width]; //Xác định 3 mốc vị trí của màn hình

          const dotWidth = scrollX.interpolate({ //tính toán chiều rộng của dấu chấm dựa vào vị trí của màn hình
            inputRange,
            outputRange: [10, 24, 10], //Khi bạn lướt từ từ, dấu chấm sẽ từ từ phình to ra từ 10 lên 24, rồi lại co về 10.
            extrapolate: "clamp", //giới hạn giá trị của dấu chấm ở giữa 2 mốc vị trí.
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3], // này là độ đậm nhạt
            extrapolate: "clamp",
          });
//Bắt buộc phải dùng thẻ này (thay vì View thường) thì mới hiểu được các giá trị động (dotWidth, opacity)
//  đang thay đổi liên tục 60 khung hình/giây.
          return (
            <Animated.View
              key={i.toString()}
              style={[
                styles.dot,
                { width: dotWidth, opacity },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={["#3bb582", "rgba(12, 106, 181, 0.7)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Thanh hiển thị trạng thái màn hình */}
      <StatusBar style="light" />

      {/* Nút Skip ở góc trên bên phải */}
      {currentIndex < SLIDES.length - 1 && (
        <TouchableOpacity 
          style={[styles.topSkipButton, { top: insets.top + 10 }]} 
          onPress={handleFinish}
        >
          <Text style={styles.skipText}>Bỏ qua</Text>
        </TouchableOpacity>
      )}
      
      {/* Phần Slide Content */}
      <View style={{ flex: 1 }}>
        <FlatList
          data={SLIDES}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <View style={styles.imageContainer}>
                <View style={styles.imageWrapper}>
                   <Image source={item.image} style={styles.image} />
                </View>
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
              </View>
            </View>
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={32}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          ref={slidesRef}
        />
      </View>

      {/* Phần Footer điều khiển */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Paginator data={SLIDES} scrollX={scrollX} />

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>
              {currentIndex === SLIDES.length - 1 ? "Bắt đầu ngay" : "Tiếp tục"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

export default OnBoarding;

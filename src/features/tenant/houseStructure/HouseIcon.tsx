/**
 * Icon tổng căn nhà: dùng hình PNG floor plan (assets/house.png).
 */
import React from "react";
import { Image, View } from "react-native";

interface HouseIconProps {
  /** Kích thước (width = height). */
  size?: number;
  /** Màu accent – không dùng để tint PNG, chỉ để giữ API tương thích. */
  color?: string;
}

const HouseIcon: React.FC<HouseIconProps> = ({ size = 180 }) => {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
      }}
    >
      <Image
        source={require("../../../../assets/house.png")}
        style={{ width: size, height: size, resizeMode: "contain" }}
      />
    </View>
  );
};

export default HouseIcon;

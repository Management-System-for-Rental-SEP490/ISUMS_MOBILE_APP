/**
 * Icon / khung mặt bằng căn nhà: Cover_Floor_Plan.png (giữ đúng tỉ lệ 945×831).
 */
import React from "react";
import { Image, View } from "react-native";
import { FLOOR_PLAN_IMAGE_ASPECT } from "./floorPlanPositions";

interface HouseIconProps {
  /** Kích thước (width = height). */
  size?: number;
  /** Màu accent – không dùng để tint PNG, chỉ để giữ API tương thích. */
  color?: string;
}

const HouseIcon: React.FC<HouseIconProps> = ({ size = 200 }) => {
  const width = size;
  const height = Math.round(size / FLOOR_PLAN_IMAGE_ASPECT);
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
      }}
    >
      <Image
        source={require("../../../../assets/Cover_Floor_Plan.png")}
        style={{
          width,
          height,
          resizeMode: "contain",
          borderRadius: 10,
        }}
      />
    </View>
  );
};

export default HouseIcon;

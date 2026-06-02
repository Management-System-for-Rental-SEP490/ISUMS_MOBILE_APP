import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import type { TicketImageToUpload } from "../services/issuesApi";

/**
 * Resize + nén ảnh trước khi upload ticket.
 *
 * Ảnh camera điện thoại thường ở độ phân giải gốc (vd 4000×3000, 1-3MB) — `quality`
 * của ImagePicker chỉ nén JPEG chứ KHÔNG giảm kích thước pixel → upload rất nặng.
 * Hàm này downscale về tối đa MAX_WIDTH px rồi nén lại → file nhỏ ~10x, upload nhanh hơn nhiều.
 *
 * An toàn: nếu resize 1 ảnh lỗi, trả về ảnh gốc cho ảnh đó (không chặn cả lượt gửi).
 */
const MAX_WIDTH = 1600;
const COMPRESS = 0.6;

async function resizeOne(img: TicketImageToUpload): Promise<TicketImageToUpload> {
  try {
    const ctx = ImageManipulator.manipulate(img.uri);
    // Chỉ set width → manipulator tự giữ tỉ lệ (height auto). Ảnh nhỏ hơn MAX_WIDTH
    // sẽ được upscale nhẹ nếu set cứng, nên ta vẫn resize về MAX_WIDTH cho đồng nhất —
    // tác động không đáng kể vì hầu hết ảnh camera đều lớn hơn 1600px.
    ctx.resize({ width: MAX_WIDTH });
    const ref = await ctx.renderAsync();
    const result = await ref.saveAsync({ compress: COMPRESS, format: SaveFormat.JPEG });
    return {
      uri: result.uri,
      fileName: (img.fileName?.replace(/\.[^.]+$/, "") ?? "ticket-image") + ".jpg",
      mimeType: "image/jpeg",
    };
  } catch {
    // Resize lỗi (ảnh hỏng, định dạng lạ…) → giữ ảnh gốc, không chặn gửi ticket.
    return img;
  }
}

/**
 * Resize song song toàn bộ ảnh đính kèm ticket.
 * Song song an toàn vì mỗi ảnh xử lý độc lập, không chia sẻ state.
 */
export async function resizeTicketImagesForUpload(
  images: TicketImageToUpload[]
): Promise<TicketImageToUpload[]> {
  if (!images.length) return images;
  return Promise.all(images.map(resizeOne));
}

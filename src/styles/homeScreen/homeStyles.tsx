import { StyleSheet } from "react-native";
export const homeStyles = StyleSheet.create({
    container: {
        flex: 1, // Cho phép view cha (container) chiếm toàn bộ không gian màn hình
        backgroundColor: 'white', // Đặt màu nền cho toàn bộ màn hình là màu trắng
    },
    footer: {
        position: 'absolute' as 'absolute', // Footer được đặt tuyệt đối để luôn dính ở dưới cùng màn hình
        left: 0, // Căn trái sát cạnh màn hình
        right: 0, // Căn phải sát cạnh màn hình
        bottom: 0, // Căn dưới sát mép màn hình
        backgroundColor: '#fff', // Màu nền trắng cho footer
        borderTopWidth: 1, // Đường viền phía trên của footer dày 1px
        borderTopColor: '#e0e0e0', // Màu viền phía trên là xám nhạt, tạo sự phân tách giữa footer và phần nội dung phía trên
        paddingBottom: 34, // Khoảng cách ở dưới cùng của footer (thường để tránh phần thiết bị như home indicator)
        paddingTop: 12, // Khoảng cách phía trên trong footer để nội dung không dính sát viền
        paddingHorizontal: 20, // Khoảng cách trái phải trong footer
        flexDirection: 'row', // Hiển thị icon theo hàng ngang
        alignItems: 'center', // Căn giữa các phần tử theo chiều ngang
        justifyContent: 'space-between', // Phân bố đều icon theo chiều ngang
        minHeight: 64, // Đảm bảo footer luôn có chiều cao tối thiểu là 64px
        
    },
    
});
export default homeStyles;
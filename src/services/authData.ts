// import { AuthPayload, UserRole } from "../shared/types";

// type MockUser = {
//   username: string;
//   password: string;
//   role: UserRole;
// };

// const mockUsers: MockUser[] = [
//   { username: "Tenant", password: "Tenant123", role: "Tenant" },
//   { username: "landlord", password: "landlord123", role: "landlord" },
//   { username: "manager", password: "manager123", role: "manager" },
//   { username: "staff", password: "staff123", role: "staff" },
// ];
// /*
// Dòng 15-17 trong file này:

// const createToken = (username: string) => `mock-token-${username}-${Date.now()}`;
// const createRefreshToken = (username: string) =>
//   `mock-refresh-${username}-${Math.floor(Math.random() * 1e6)}`;

// có chức năng tạo ra "token" và "refreshToken" giả lập (mock) cho quá trình đăng nhập. 
// - createToken sinh ra một chuỗi token mô phỏng dựa trên username và thời gian hiện tại (Date.now() tạo ra số mili giây).
// - createRefreshToken sinh ra chuỗi refreshToken mô phỏng, có thêm đoạn số random từ 0 đến gần 1 triệu.

// Hai hàm này dùng để giả lập việc nhận token và refreshToken từ server khi đăng nhập thành công, giúp quá trình phát triển, test chức năng đăng nhập mà không cần backend thực.
// */
// /*
// Giải thích từng dòng trong đoạn 28-46:

// const createToken = (username: string) => `mock-token-${username}-${Date.now()}`;
// - Đây là một arrow function (hàm mũi tên) nhận vào tham số username (kiểu string).
// - Hàm trả về một chuỗi kết hợp: "mock-token-" + username + dấu "-" + số mili giây hiện tại (Date.now()).
// - Mục đích là để sinh ra một "token" giả lập kiểu như server trả về khi đăng nhập, mỗi lần gọi sẽ khác nhau do thời gian.

// const createRefreshToken = (username: string) =>
//   `mock-refresh-${username}-${Math.floor(Math.random() * 1e6)}`;
// - Đây cũng là một hàm mũi tên nhận vào username (kiểu string).
// - Trả về chuỗi kiểu "mock-refresh-" + username + dấu "-" + số random từ 0 đến 999999.
// - Mục đích sinh ra "refreshToken" giả, giá trị ngẫu nhiên để mô phỏng thực tế.

// export const mockLogin = async (username: string, password: string): Promise<AuthPayload> => {
//   const user = mockUsers.find((item) => item.username === username && item.password === password);

//   if (!user) {
//     return Promise.reject(new Error("Thông tin đăng nhập không đúng. Vui lòng thử lại."));
//   }

//   return Promise.resolve({
//     username: user.username,
//     role: user.role,
//     token: createToken(user.username),
//     refreshToken: createRefreshToken(user.username),
//   });
// };
// - Định nghĩa hàm mockLogin dạng async, nhận vào username và password (kiểu string).
// - Hàm này trả về một Promise kiểu AuthPayload.
// - Dòng const user = ...: Tìm trong mảng mockUsers một user thỏa mãn username và password đều đúng với tham số truyền vào.
// - Nếu không tìm thấy user phù hợp, trả về Promise bị reject cùng lỗi tiếng Việt "Thông tin đăng nhập không đúng. Vui lòng thử lại."
// - Nếu tìm thấy user, trả về Promise resolve với object có dạng:
//     + username: tên đăng nhập của user,
//     + role: quyền ("Tenant", "landlord", "admin"),
//     + token: dùng hàm createToken ở trên để tạo mã token mới,
//     + refreshToken: dùng createRefreshToken để tạo refreshToken mới.
// - Hàm này nhằm mô phỏng như là gọi API đăng nhập lên backend thật, dùng cho việc phát triển, test giao diện hoặc logic frontend khi chưa có server thật.
// */
// /*
// Promise được dùng ở đây để mô phỏng hành vi gọi API bất đồng bộ như ngoài thực tế (ví dụ: khi đăng nhập sẽ phải chờ server xử lý và trả kết quả về). Trong thực tế, hàm đăng nhập sẽ gọi tới server backend, thao tác này tốn thời gian và luôn là bất đồng bộ (asynchronous) nên luôn trả về Promise.

// Nếu KHÔNG dùng Promise:
// - Hàm mockLogin sẽ trả về kết quả ngay lập tức (đồng bộ), không cho bạn mô phỏng/chờ trạng thái đang xử lý (loading) hoặc bắt lỗi giống như khi làm việc với API thực của backend.
// - Không thể sử dụng cú pháp async/await, .then hoặc .catch để xử lý thành công/thất bại.

// => Việc dùng Promise (hoặc async/await) ở đây giúp bạn:
// - Viết code phía frontend (giao diện, logic) đúng mô hình bất đồng bộ như làm việc thật với server.
// - Xử lý loading, error, success logic đúng như khi gọi API.
// - Giả lập gần đúng với quy trình thực tế (thay vì trả kết quả ngay).

// Nếu không dùng Promise thì code xử lý phía trên UI sẽ chạy theo luồng đồng bộ, không thể áp dụng các kỹ thuật xử lý asynchonous/await (ví dụ: hiện loading spinner khi đang chờ login).
// */


// const createToken = (username: string) => `mock-token-${username}-${Date.now()}`;
// const createRefreshToken = (username: string) =>
//   `mock-refresh-${username}-${Math.floor(Math.random() * 1e6)}`;

// export const mockLogin = async (username: string, password: string): Promise<AuthPayload> => {
//   const user = mockUsers.find((item) => item.username === username && item.password === password);

//   if (!user) {
//     return Promise.reject(new Error("Thông tin đăng nhập không đúng. Vui lòng thử lại."));
//   }

//   return Promise.resolve({
//     username: user.username,
//     role: user.role,
//     token: createToken(user.username),
//     refreshToken: createRefreshToken(user.username),
//   });
// };


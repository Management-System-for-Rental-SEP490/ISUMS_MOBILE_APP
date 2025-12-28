type Credentials = {
  username: string;
  password: string;
};
// Đúng rồi bạn! Ý bạn là:
// - Bạn định nghĩa một biến mockCredentials có kiểu Credentials, có thuộc tính username và password.
// - Sau đó bạn định nghĩa một hàm validateCredentials, nhận vào username và password từ phía component khác (như trang home).
// - Hàm này sẽ kiểm tra hai tham số truyền vào có trùng với username và password của mockCredentials không.
// Nếu trùng thì hàm trả về true, ngược lại trả về false.

// Code như vậy là đúng với ý bạn mô tả.


export const mockCredentials: Credentials = {
  username: "admin",
  password: "isums123",
};

export const validateCredentials = (username: string, password: string) =>
  username === mockCredentials.username && password === mockCredentials.password;


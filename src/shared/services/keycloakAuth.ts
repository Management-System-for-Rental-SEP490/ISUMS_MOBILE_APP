import { Linking, Platform } from "react-native";
import axios from "axios";
import { AuthPayload, UserRole } from "../types";

// Lấy IP address động hoặc dùng localhost
const getKeycloakBaseUrl = (): string => {
  if (Platform.OS === 'web') {
    return "http://localhost:8080";
  }
  const MOBILE_KEYCLOAK_IP = process.env.EXPO_PUBLIC_KEYCLOAK_IP || "192.168.137.1";
  return `http://${MOBILE_KEYCLOAK_IP}:8080`;
  // Nếu dùng chung cho mọi nền tảng
  //return "https://sso.isums.pro";
};

// Cấu hình Keycloak
const KEYCLOAK_CONFIG = {
  get baseUrl() {
    return getKeycloakBaseUrl();
  },
  realm: "isums-realm",
  clientId: "mobile-app",
  get redirectUri() {
    if (Platform.OS === 'web') {
      return "http://localhost/callback";
    }
    return "isums://callback";
  },
};

// Tạo URL authorization để chuyển hướng đến Keycloak login
//đoạn này chuẩn bị các tham số cần thiết để xây dựng URL chuyển hướng người dùng sang trang đăng nhập Keycloak, tuân thủ luồng Authorization Code của OAuth 2.0.
export const getKeycloakAuthUrl = (): string => {
  const params = new URLSearchParams({ //URLSearchParams là API của JavaScript để làm việc với URL.
    client_id: KEYCLOAK_CONFIG.clientId,
    redirect_uri: KEYCLOAK_CONFIG.redirectUri, //redirect_uri là URL chuyển hướng sau khi đăng nhập thành công.
    response_type: "code", //response_type là kiểu response từ Keycloak.
    scope: "openid email profile", //scope là các quyền của user.
  });
  // cấu hình đường url cho người dùng mở đúng url của keycloak
  return `${KEYCLOAK_CONFIG.baseUrl}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/auth?${params.toString()}`; //đoạn này tạo ra URL chuyển hướng người dùng sang trang đăng nhập Keycloak, tuân thủ luồng Authorization Code của OAuth 2.0.
};

// Trao đổi authorization code lấy access token
export const exchangeCodeForToken = async (code: string): Promise<AuthPayload> => {
  try {
    const tokenUrl = `${KEYCLOAK_CONFIG.baseUrl}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/token`;
    
    const response = await axios.post(
      tokenUrl,
      new URLSearchParams({
        grant_type: "authorization_code",
        client_id: KEYCLOAK_CONFIG.clientId,
        code: code,
        redirect_uri: KEYCLOAK_CONFIG.redirectUri,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, refresh_token } = response.data;
    const userInfo = await getUserInfo(access_token);
    const role = determineUserRole(userInfo, access_token);
    // sau có thể có thêm xác định group nhận attributes của user
    return {
      username: userInfo.preferred_username || userInfo.name || "user",
      role: role,
      token: access_token,
      refreshToken: refresh_token,
    };
  } catch (error: any) {
    const errorMessage = error.response?.data?.error_description 
      || error.response?.data?.error 
      || error.message 
      || "Không thể lấy token từ Keycloak";
    throw new Error(`Lỗi đăng nhập: ${errorMessage}`);
  }
};

// Lấy thông tin user từ Keycloak userinfo endpoint
//Giống API get user
const getUserInfo = async (accessToken: string) => {
  const userInfoUrl = `${KEYCLOAK_CONFIG.baseUrl}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/userinfo`;
  const response = await axios.get(userInfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
};

// Decode JWT token (không verify signature, chỉ để lấy claims)
const decodeJWT = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];//split là hàm để tách chuỗi thành một mảng các chuỗi con, dấu chấm là dấu phân tách.
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/'); //JWT gồm 3 phần tách bởi dấu chấm (header.payload.signature). Ta lấy phần giữa là payload.
    const jsonPayload = decodeURIComponent(
      atob(base64) //Chuyển đổi từ định dạng Base64Url (dùng trong URL) về Base64 chuẩn.
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};
// Chi tiết từng phần nhỏ:
// .map((c) => ...): Duyệt qua từng ký tự c trong chuỗi đã giải mã từ atob.
// c.charCodeAt(0): Lấy mã ASCII/Unicode của ký tự đó (số nguyên).
// .toString(16): Chuyển mã số đó sang hệ thập lục phân (hex). Vd: 65 -> "41".
// '00' + ...: Thêm số 0 vào đầu để đảm bảo luôn đủ độ dài (padding).
// .slice(-2): Cắt lấy 2 ký tự cuối cùng.
// Ví dụ: Nếu mã hex là a, nối thành 00a, cắt đuôi được 0a.
// Ví dụ: Nếu mã hex là 41, nối thành 0041, cắt đuôi được 41.
// => Đảm bảo luôn là chuỗi hex 2 ký tự (byte).
// '%' + ...: Thêm dấu % vào trước. Kết quả có dạng %41, %C3, %A9...
// Xác định role của user từ token hoặc userInfo
const determineUserRole = (userInfo: any, accessToken: string): UserRole => { //hàm bắt buộc phải trả về kiểu UserRole.
  const tokenClaims = decodeJWT(accessToken);
  
  if (tokenClaims) {
    // Kiểm tra realm_access.roles trong token
    const realmRoles = tokenClaims.realm_access?.roles || []; //roles là các quyền của user trong realm.
    if (realmRoles.includes("technical")) return "technical";
    // if (realmRoles.includes("landlord")) return "landlord";
    // if (realmRoles.includes("manager")) return "manager";
    if (realmRoles.includes("tenant")) return "tenant";
    
    // Kiểm tra resource_access nếu có
    const resourceRoles = tokenClaims.resource_access?.["mobile-app"]?.roles || [];
    if (resourceRoles.includes("technical")) return "technical";
    // if (resourceRoles.includes("landlord")) return "landlord";
    // if (resourceRoles.includes("manager")) return "manager";
    if (resourceRoles.includes("tenant")) return "tenant";
  }
  
  // Fallback: kiểm tra từ username
  const username = userInfo.preferred_username?.toLowerCase() || "";
  if (username.includes("technical") || username.includes("admin")) return "technical";
  // if (username.includes("landlord")) return "landlord";
  // if (username.includes("manager")) return "manager";
  
  return "tenant";
};

// Mở Keycloak login page trong browser
export const openKeycloakLogin = async (): Promise<void> => {
  try {
    const authUrl = getKeycloakAuthUrl();
    
    // Trên web, mở trong tab mới
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(authUrl, '_blank'); // '_blank' là tạo tab mới để tránh mất dữ liệu đang nhập.
      return;
    }
    
    // Trên mobile, dùng Linking.openURL để đảm bảo deep link hoạt động
    const canOpen = await Linking.canOpenURL(authUrl);
    if (canOpen) {
      await Linking.openURL(authUrl);
    } else {
      throw new Error("Không thể mở trình duyệt");
    }
  } catch (error: any) {
    throw new Error(`Không thể mở trang đăng nhập: ${error.message || error}`);
  }
};

// Xử lý callback URL từ Keycloak
export const handleKeycloakCallback = (url: string): string | null => {
  try {
    // Xử lý cả string và object
    let urlString = url;
    if (typeof url === 'object' && 'url' in url && typeof (url as any).url === 'string') {
      urlString = (url as any).url;
    }
    
    const parsedUrl = new URL(urlString);
    const code = parsedUrl.searchParams.get("code");
    const error = parsedUrl.searchParams.get("error");
    
    if (error) {
      return null;
    }
    
    return code || null;
  } catch (error) {
    return null;
  }
};
// mở tài khoản để đổi mật khẩu
export const openAccountManagement = async () => {
  try {
    const accountUrl = `${KEYCLOAK_CONFIG.baseUrl}/realms/${KEYCLOAK_CONFIG.realm}/account`;
    
    const canOpen = await Linking.canOpenURL(accountUrl);
    if (canOpen) {
      await Linking.openURL(accountUrl);
    } else {
      throw new Error("Không thể mở trình duyệt");
    }
  } catch (error: any) {
    throw new Error(`Không thể mở trang quản lý tài khoản: ${error.message || error}`);
  }
};

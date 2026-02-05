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
export const getKeycloakAuthUrl = (): string => {
  const params = new URLSearchParams({
    client_id: KEYCLOAK_CONFIG.clientId,
    redirect_uri: KEYCLOAK_CONFIG.redirectUri,
    response_type: "code", 
    scope: "openid email profile",
  });

  return `${KEYCLOAK_CONFIG.baseUrl}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/auth?${params.toString()}`;
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
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

// Xác định role của user từ token hoặc userInfo
const determineUserRole = (userInfo: any, accessToken: string): UserRole => {
  const tokenClaims = decodeJWT(accessToken);
  
  if (tokenClaims) {
    // Kiểm tra realm_access.roles trong token
    const realmRoles = tokenClaims.realm_access?.roles || [];
    if (realmRoles.includes("staff") || realmRoles.includes("admin")) return "staff";
    if (realmRoles.includes("landlord")) return "landlord";
    if (realmRoles.includes("manager")) return "manager";
    if (realmRoles.includes("tenant")) return "tenant";
    
    // Kiểm tra resource_access nếu có
    const resourceRoles = tokenClaims.resource_access?.["mobile-app"]?.roles || [];
    if (resourceRoles.includes("staff") || resourceRoles.includes("admin")) return "staff";
    if (resourceRoles.includes("landlord")) return "landlord";
    if (resourceRoles.includes("manager")) return "manager";
    if (resourceRoles.includes("tenant")) return "tenant";
  }
  
  // Fallback: kiểm tra từ username
  const username = userInfo.preferred_username?.toLowerCase() || "";
  if (username.includes("staff") || username.includes("admin")) return "staff";
  if (username.includes("landlord")) return "landlord";
  if (username.includes("manager")) return "manager";
  
  return "tenant";
};

// Mở Keycloak login page trong browser
export const openKeycloakLogin = async (): Promise<void> => {
  try {
    const authUrl = getKeycloakAuthUrl();
    
    // Trên web, mở trong tab mới
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(authUrl, '_blank');
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

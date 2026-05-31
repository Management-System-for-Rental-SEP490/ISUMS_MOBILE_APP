import { Platform } from "react-native";
import { authorize, refresh, AuthConfiguration, AuthorizeResult } from "react-native-app-auth";
import {
  KEYCLOAK_CONFIG,
  determineUserRole,
  getUserInfo,
} from "./keycloakAuth";
import type { AuthPayload } from "../types";

function normalizeLocale(locale?: string | null): "vi" | "en" | "ja" {
  const raw = locale != null ? String(locale).trim().toLowerCase() : "";
  if (!raw) return "vi";
  if (raw.startsWith("vi")) return "vi";
  if (raw.startsWith("ja")) return "ja";
  if (raw.startsWith("en")) return "en";
  return "vi";
}

function buildAppAuthConfig(locale?: string, idpHint?: string): AuthConfiguration {
  const lc = normalizeLocale(locale);
  const additionalParameters: Record<string, string> = {
    kc_locale: lc,
    ui_locales: lc,
  };
  if (idpHint) {
    additionalParameters.kc_idp_hint = idpHint;
  }
  return {
    issuer: `${KEYCLOAK_CONFIG.baseUrl}/realms/${KEYCLOAK_CONFIG.realm}`,
    clientId: KEYCLOAK_CONFIG.clientId,
    redirectUrl: KEYCLOAK_CONFIG.redirectUri,
    scopes: ["openid", "profile", "email"],
    additionalParameters,
    usePKCE: true,
    skipCodeExchange: false,
    dangerouslyAllowInsecureHttpRequests: false,
  };
}

/**
 * Đăng nhập Keycloak qua react-native-app-auth.
 * Android: Chrome Custom Tabs (PKCE handshake native, redirect intent-filter — KHÔNG bị dead-zone vì AppAuth-Android handle redirect ở native intent level).
 * iOS: ASWebAuthenticationSession (system-grade isolation, biometric autofill, share cookie với Safari).
 */
export async function signInWithAppAuth(locale?: string, idpHint?: string): Promise<AuthPayload> {
  if (Platform.OS === "web") {
    throw new Error("signInWithAppAuth không hỗ trợ web; dùng openKeycloakLogin redirect flow");
  }

  const result: AuthorizeResult = await authorize(buildAppAuthConfig(locale, idpHint));

  const userInfo = await getUserInfo(result.accessToken);
  const role = determineUserRole(userInfo, result.accessToken);

  let houseId: string | undefined;
  const rawHouseId = userInfo.attributes?.houseId || userInfo.houseId;
  if (Array.isArray(rawHouseId)) {
    houseId = rawHouseId[0];
  } else if (typeof rawHouseId === "string") {
    houseId = rawHouseId;
  }

  return {
    username: userInfo.preferred_username || userInfo.name || "user",
    role,
    token: result.accessToken,
    refreshToken: result.refreshToken ?? undefined,
    idToken: result.idToken ?? undefined,
    houseId,
  };
}

/** Refresh access token bằng refresh_token đã lưu. Keycloak có thể rotate refresh token. */
export async function refreshAppAuthToken(
  refreshToken: string,
  locale?: string,
): Promise<{ accessToken: string; refreshToken?: string; idToken?: string; accessTokenExpirationDate: string }> {
  const r = await refresh(buildAppAuthConfig(locale), { refreshToken });
  return {
    accessToken: r.accessToken,
    refreshToken: r.refreshToken ?? refreshToken,
    idToken: r.idToken ?? undefined,
    accessTokenExpirationDate: r.accessTokenExpirationDate,
  };
}

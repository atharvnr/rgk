import { Platform } from "react-native";
import * as AuthSession from "expo-auth-session";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

const AUTH0_DOMAIN = process.env.EXPO_PUBLIC_AUTH0_DOMAIN || "";
const AUTH0_CLIENT_ID = process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID || "";

const discovery = {
  authorizationEndpoint: `https://${AUTH0_DOMAIN}/authorize`,
  tokenEndpoint: `https://${AUTH0_DOMAIN}/oauth/token`,
  revocationEndpoint: `https://${AUTH0_DOMAIN}/v2/logout`,
};

const redirectUri = AuthSession.makeRedirectUri({ scheme: "rentgrandkids", path: "callback" });

const TOKEN_KEY = "rgk_access_token";
const REFRESH_KEY = "rgk_refresh_token";

const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export async function getStoredToken(): Promise<string | null> {
  return storage.getItem(TOKEN_KEY);
}

export async function getStoredRefreshToken(): Promise<string | null> {
  return storage.getItem(REFRESH_KEY);
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getStoredRefreshToken();
  if (!refreshToken) {
    console.warn("[Auth] No refresh token stored — cannot refresh");
    return null;
  }

  try {
    console.log("[Auth] Attempting silent token refresh…");
    const response = await AuthSession.refreshAsync(
      { clientId: AUTH0_CLIENT_ID, refreshToken },
      discovery
    );
    await storeTokens(response.accessToken, response.refreshToken ?? undefined);
    console.log("[Auth] Token refresh succeeded");
    return response.accessToken;
  } catch (err) {
    console.error("[Auth] Token refresh failed:", err);
    return null;
  }
}

export async function storeTokens(
  accessToken: string,
  refreshToken?: string
): Promise<void> {
  await storage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) {
    await storage.setItem(REFRESH_KEY, refreshToken);
  }
}

export async function clearTokens(): Promise<void> {
  await storage.deleteItem(TOKEN_KEY);
  await storage.deleteItem(REFRESH_KEY);
}

export function useAuth0Config() {
  const [request, result, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: AUTH0_CLIENT_ID,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      scopes: ["openid", "profile", "email", "offline_access"],
      extraParams: {
        audience: process.env.EXPO_PUBLIC_AUTH0_AUDIENCE || "",
      },
    },
    discovery
  );

  return { request, result, promptAsync };
}

export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<{ accessToken: string; refreshToken?: string }> {
  const response = await AuthSession.exchangeCodeAsync(
    {
      clientId: AUTH0_CLIENT_ID,
      code,
      redirectUri,
      extraParams: {
        code_verifier: codeVerifier,
      },
    },
    discovery
  );

  return {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken ?? undefined,
  };
}

export { redirectUri, discovery };

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

const redirectUri = AuthSession.makeRedirectUri({ scheme: "rentgrandkids" });

const TOKEN_KEY = "rgk_access_token";
const REFRESH_KEY = "rgk_refresh_token";

export async function getStoredToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function storeTokens(
  accessToken: string,
  refreshToken?: string
): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
  if (refreshToken) {
    await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
  }
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
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
  code: string
): Promise<{ accessToken: string; refreshToken?: string }> {
  const response = await AuthSession.exchangeCodeAsync(
    {
      clientId: AUTH0_CLIENT_ID,
      code,
      redirectUri,
      extraParams: {
        code_verifier: "",
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

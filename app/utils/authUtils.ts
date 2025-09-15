interface AtlassianAuthData {
  user: {
    account_id: string;
    name: string;
    email: string;
    picture: string;
  };
  sites: Array<{
    id: string;
    name: string;
    url: string;
    scopes: string[];
    avatarUrl: string;
  }>;
  tokens: {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  };
  timestamp: number;
}

const ATLASSIAN_AUTH_KEY = "atlassian_auth_data";

export const getStoredAuth = (): AtlassianAuthData | null => {
  try {
    if (typeof window === "undefined") return null;

    const storedAuth = localStorage.getItem(ATLASSIAN_AUTH_KEY);
    if (!storedAuth) return null;

    const authData: AtlassianAuthData = JSON.parse(storedAuth);

    // Check if token is still valid
    const tokenExpiry = authData.timestamp + authData.tokens.expires_in * 1000;
    const isExpired = Date.now() > tokenExpiry - 60000; // 1 minute buffer

    if (isExpired) {
      localStorage.removeItem(ATLASSIAN_AUTH_KEY);
      return null;
    }

    return authData;
  } catch (error) {
    console.error("Error getting stored auth:", error);
    localStorage.removeItem(ATLASSIAN_AUTH_KEY);
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  return getStoredAuth() !== null;
};

export const clearAuth = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ATLASSIAN_AUTH_KEY);
  }
};

export const getAuthHeaders = (): HeadersInit => {
  const authData = getStoredAuth();
  if (!authData) {
    throw new Error("No authentication data found");
  }

  return {
    Authorization: `Bearer ${authData.tokens.access_token}`,
    "Content-Type": "application/json",
  };
};

export const getAuthPayload = () => {
  const authData = getStoredAuth();
  if (!authData) {
    throw new Error("No authentication data found");
  }

  const primarySite = authData.sites[0];
  if (!primarySite) {
    throw new Error("No accessible sites found");
  }

  return {
    siteUrl: primarySite.url,
    email: authData.user.email,
    accessToken: authData.tokens.access_token,
    atlassianAccountId: authData.user.account_id,
    isOAuth: true, // Flag to indicate OAuth authentication
  };
};

interface AuthRequest {
  siteUrl: string;
  email: string;
  apiToken?: string;
  accessToken?: string;
  isOAuth?: boolean;
}

export function getAuthHeaders(authData: AuthRequest): Record<string, string> {
  const { siteUrl, email, apiToken, accessToken, isOAuth } = authData;

  if (!siteUrl || !email) {
    throw new Error("Missing required parameters: siteUrl and email");
  }

  if (isOAuth && accessToken) {
    // OAuth authentication
    return {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    };
  } else if (apiToken) {
    // Basic authentication (fallback)
    const credentials = Buffer.from(`${email}:${apiToken}`).toString("base64");
    return {
      Authorization: `Basic ${credentials}`,
      Accept: "application/json",
    };
  } else {
    throw new Error("Missing authentication credentials");
  }
}

export async function authenticatedFetch(
  url: string,
  authData: AuthRequest,
  options: RequestInit = {}
): Promise<Response> {
  const authHeaders = getAuthHeaders(authData);

  return fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  });
}

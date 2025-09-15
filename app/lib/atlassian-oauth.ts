// OAuth configuration and utilities for Atlassian
export interface AtlassianTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface AtlassianUser {
  account_id: string;
  name: string;
  email: string;
  picture: string;
}

export interface AtlassianSite {
  id: string;
  name: string;
  url: string;
  scopes: string[];
  avatarUrl: string;
}

export class AtlassianOAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private baseUrl: string;

  constructor() {
    this.clientId = process.env.NEXT_PUBLIC_ATLASSIAN_CLIENT_ID || "";
    this.clientSecret = process.env.ATLASSIAN_CLIENT_SECRET || "";
    this.redirectUri =
      process.env.NEXT_PUBLIC_REDIRECT_URI ||
      "http://localhost:3000/auth/callback";
    this.baseUrl = "https://auth.atlassian.com";
  }

  // Generate authorization URL
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      audience: "api.atlassian.com",
      client_id: this.clientId,
      scope:
        "read:jira-work write:jira-work read:jira-user read:me offline_access",
      redirect_uri: this.redirectUri,
      state: state || this.generateState(),
      response_type: "code",
      prompt: "consent",
    });

    return `${this.baseUrl}/authorize?${params.toString()}`;
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code: string): Promise<AtlassianTokens> {
    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    return response.json();
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<AtlassianTokens> {
    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "refresh_token",
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed: ${error}`);
    }

    return response.json();
  }

  // Get user information
  async getUserInfo(accessToken: string): Promise<AtlassianUser> {
    const response = await fetch("https://api.atlassian.com/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get user info: ${error}`);
    }

    return response.json();
  }

  // Get accessible resources (sites)
  async getAccessibleResources(accessToken: string): Promise<AtlassianSite[]> {
    const response = await fetch(
      "https://api.atlassian.com/oauth/token/accessible-resources",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get accessible resources: ${error}`);
    }

    return response.json();
  }

  // Generate a random state parameter for security
  private generateState(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  // Revoke access token
  async revokeToken(accessToken: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/oauth/revoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        token: accessToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token revocation failed: ${error}`);
    }
  }
}

// Singleton instance
export const atlassianOAuth = new AtlassianOAuth();

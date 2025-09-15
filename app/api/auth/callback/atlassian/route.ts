import { NextRequest, NextResponse } from "next/server";
import {
  atlassianOAuth,
  AtlassianTokens,
  AtlassianUser,
  AtlassianSite,
} from "../../../../lib/atlassian-oauth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle OAuth error
    if (error) {
      console.error("OAuth error:", error);
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    // Handle missing code
    if (!code) {
      return NextResponse.redirect(
        new URL("/?error=missing_code", request.url)
      );
    }

    // Exchange code for tokens
    const tokens: AtlassianTokens = await atlassianOAuth.exchangeCodeForTokens(
      code
    );

    // Get user information
    const user: AtlassianUser = await atlassianOAuth.getUserInfo(
      tokens.access_token
    );

    // Get accessible sites
    const sites: AtlassianSite[] = await atlassianOAuth.getAccessibleResources(
      tokens.access_token
    );

    // Store authentication data
    const authData = {
      user,
      sites,
      tokens: {
        access_token: tokens.access_token,
        expires_in: tokens.expires_in,
        refresh_token: tokens.refresh_token,
      },
      timestamp: Date.now(),
    };

    // Create response with redirect - include auth data in URL for client-side storage
    const authDataEncoded = encodeURIComponent(JSON.stringify(authData));
    const response = NextResponse.redirect(
      new URL(`/?auth=success&data=${authDataEncoded}`, request.url)
    );

    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL(
        `/?error=${encodeURIComponent("authentication_failed")}`,
        request.url
      )
    );
  }
}

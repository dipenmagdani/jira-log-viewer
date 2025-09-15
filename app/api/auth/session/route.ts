import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("atlassian_auth");

    console.log("Session check - cookie exists:", !!authCookie);
    console.log(
      "All cookies:",
      cookieStore.getAll().map((c) => c.name)
    );

    if (!authCookie) {
      return NextResponse.json({ authenticated: false });
    }

    console.log("Parsing auth data from cookie...");
    const authData = JSON.parse(authCookie.value);
    console.log("Auth data parsed successfully:", {
      hasUser: !!authData.user,
      hasSites: !!authData.sites,
    });

    // Check if token is expired (add some buffer time)
    const tokenExpiry = authData.timestamp + authData.tokens.expires_in * 1000;
    const isExpired = Date.now() > tokenExpiry - 60000; // 1 minute buffer

    console.log("Token expiry check:", {
      tokenExpiry,
      now: Date.now(),
      isExpired,
    });

    if (isExpired) {
      return NextResponse.json({ authenticated: false, expired: true });
    }

    // Return user info and sites (without sensitive tokens)
    return NextResponse.json({
      authenticated: true,
      user: authData.user,
      sites: authData.sites,
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json({ authenticated: false });
  }
}

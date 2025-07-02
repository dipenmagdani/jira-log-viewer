import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { siteUrl, email, apiToken } = await request.json();

    if (!siteUrl || !email || !apiToken) {
      return NextResponse.json(
        { message: "Missing required authentication parameters" },
        { status: 400 }
      );
    }

    // Create base64 encoded credentials
    const credentials = Buffer.from(`${email}:${apiToken}`).toString("base64");

    // Validate credentials by fetching user profile
    const response = await fetch(`${siteUrl}/rest/api/3/myself`, {
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Authentication failed:", errorText);
      return NextResponse.json(
        { message: "Invalid credentials or unable to authenticate with JIRA" },
        { status: 401 }
      );
    }

    const userData = await response.json();

    return NextResponse.json({
      success: true,
      message: "Authentication successful",
      user: {
        accountId: userData.accountId,
        displayName: userData.displayName,
        emailAddress: userData.emailAddress,
        avatarUrls: userData.avatarUrls,
        locale: userData.locale,
        timeZone: userData.timeZone,
      },
      credentials: {
        siteUrl,
        email,
        // Don't return the actual token for security
        hasToken: true,
      },
    });
  } catch (error) {
    console.error("Authentication error:", error);
    return NextResponse.json(
      { message: "Authentication failed due to server error" },
      { status: 500 }
    );
  }
}

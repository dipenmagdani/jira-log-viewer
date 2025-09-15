import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteUrl, email, apiToken, accessToken, isOAuth } = body;

    if (!siteUrl || !email) {
      return NextResponse.json(
        { message: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Set up authorization headers based on auth type
    let authHeaders: Record<string, string>;

    if (isOAuth && accessToken) {
      // OAuth authentication
      authHeaders = {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      };
    } else if (apiToken) {
      // Basic authentication (fallback)
      const credentials = Buffer.from(`${email}:${apiToken}`).toString(
        "base64"
      );
      authHeaders = {
        Authorization: `Basic ${credentials}`,
        Accept: "application/json",
      };
    } else {
      return NextResponse.json(
        { message: "Missing authentication credentials" },
        { status: 400 }
      );
    }

    // Get user info
    const userResponse = await fetch(`${siteUrl}/rest/api/3/myself`, {
      headers: authHeaders,
    });

    if (!userResponse.ok) {
      return NextResponse.json(
        { message: "Failed to authenticate with JIRA" },
        { status: 401 }
      );
    }

    const userData = await userResponse.json();

    // Get user's groups
    const groupsResponse = await fetch(
      `${siteUrl}/rest/api/3/user/groups?accountId=${userData.accountId}`,
      {
        headers: authHeaders,
      }
    );

    const groupsData = groupsResponse.ok
      ? await groupsResponse.json()
      : { values: [] };

    // Get user's permissions
    const permissionsResponse = await fetch(
      `${siteUrl}/rest/api/3/mypermissions`,
      {
        headers: authHeaders,
      }
    );

    const permissionsData = permissionsResponse.ok
      ? await permissionsResponse.json()
      : { permissions: {} };

    return NextResponse.json({
      user: {
        accountId: userData.accountId,
        displayName: userData.displayName,
        emailAddress: userData.emailAddress,
        accountType: userData.accountType,
        active: userData.active,
        timeZone: userData.timeZone,
        locale: userData.locale,
        avatarUrls: userData.avatarUrls,
        groups: groupsData.values || [],
        permissions: permissionsData.permissions || {},
      },
      serverInfo: {
        baseUrl: siteUrl,
        version: userData.version || "Unknown",
      },
    });
  } catch (error) {
    console.error("Failed to fetch user information:", error);
    return NextResponse.json(
      { message: "Internal server error while fetching user information" },
      { status: 500 }
    );
  }
}

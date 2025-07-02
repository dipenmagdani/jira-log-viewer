import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { siteUrl, email, apiToken } = await request.json();

    if (!siteUrl || !email || !apiToken) {
      return NextResponse.json(
        { message: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Create base64 encoded credentials
    const credentials = Buffer.from(`${email}:${apiToken}`).toString("base64");

    // Get user info
    const userResponse = await fetch(`${siteUrl}/rest/api/3/myself`, {
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: "application/json",
      },
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
        headers: {
          Authorization: `Basic ${credentials}`,
          Accept: "application/json",
        },
      }
    );

    const groupsData = groupsResponse.ok
      ? await groupsResponse.json()
      : { values: [] };

    // Get user's permissions
    const permissionsResponse = await fetch(
      `${siteUrl}/rest/api/3/mypermissions`,
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          Accept: "application/json",
        },
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

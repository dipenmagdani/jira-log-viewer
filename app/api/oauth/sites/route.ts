import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token is required" },
        { status: 400 }
      );
    }

    // Get accessible resources (Jira sites)
    const resourcesResponse = await fetch(
      "https://api.atlassian.com/oauth/token/accessible-resources",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    );

    if (!resourcesResponse.ok) {
      throw new Error("Failed to fetch accessible resources");
    }

    const resources = await resourcesResponse.json();

    // Find Jira sites
    const jiraSites = resources.filter((resource: any) =>
      resource.scopes.includes("read:jira-work")
    );

    return NextResponse.json({ sites: jiraSites });
  } catch (error) {
    console.error("Error fetching Jira sites:", error);
    return NextResponse.json(
      { error: "Failed to fetch Jira sites" },
      { status: 500 }
    );
  }
}

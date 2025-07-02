import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { siteUrl, email, apiToken, worklogId, issueKey } =
      await request.json();

    if (!siteUrl || !email || !apiToken || !worklogId) {
      return NextResponse.json(
        { message: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Create base64 encoded credentials
    const credentials = Buffer.from(`${email}:${apiToken}`).toString("base64");

    // If issueKey is not provided, try to get it first
    let targetIssueKey = issueKey;
    if (!targetIssueKey) {
      // Search for the worklog to get the issue key
      const searchResponse = await fetch(
        `${siteUrl}/rest/api/3/worklog/${worklogId}`,
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            Accept: "application/json",
          },
        }
      );

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.error("Failed to find worklog:", errorText);
        return NextResponse.json(
          { message: "Failed to find worklog in JIRA" },
          { status: 500 }
        );
      }

      const worklogData = await searchResponse.json();
      targetIssueKey = worklogData.issueId;
    }

    // Delete the worklog
    const deleteResponse = await fetch(
      `${siteUrl}/rest/api/3/issue/${targetIssueKey}/worklog/${worklogId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Basic ${credentials}`,
          Accept: "application/json",
        },
      }
    );

    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text();
      console.error("Failed to delete worklog:", errorText);
      return NextResponse.json(
        { message: "Failed to delete worklog from JIRA", error: errorText },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Worklog deleted successfully",
    });
  } catch (error) {
    console.error("Delete worklog API error:", error);
    return NextResponse.json(
      { message: "Internal server error", success: false },
      { status: 500 }
    );
  }
}

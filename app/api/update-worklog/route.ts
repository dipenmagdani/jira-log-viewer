import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { siteUrl, email, apiToken, worklog } = await request.json();

    if (
      !siteUrl ||
      !email ||
      !apiToken ||
      !worklog ||
      !worklog.id ||
      !worklog.issueKey
    ) {
      return NextResponse.json(
        { message: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Create base64 encoded credentials
    const credentials = Buffer.from(`${email}:${apiToken}`).toString("base64");

    // Update the worklog
    const worklogResponse = await fetch(
      `${siteUrl}/rest/api/3/issue/${worklog.issueKey}/worklog/${worklog.id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Basic ${credentials}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeSpent: worklog.timeSpent,
          comment: {
            type: "doc",
            version: 1,
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: worklog.comment || "",
                  },
                ],
              },
            ],
          },
          started:
            typeof worklog.started === "string"
              ? worklog.started
              : new Date(worklog.started)
                  .toISOString()
                  .replace("Z", ".000+0000"),
        }),
      }
    );

    if (!worklogResponse.ok) {
      const errorText = await worklogResponse.text();
      console.error("Failed to update worklog:", errorText);
      return NextResponse.json(
        { message: "Failed to update worklog in JIRA", error: errorText },
        { status: 500 }
      );
    }

    const worklogData = await worklogResponse.json();

    return NextResponse.json({
      success: true,
      message: "Worklog updated successfully",
      worklog: worklogData,
    });
  } catch (error) {
    console.error("Update worklog API error:", error);
    return NextResponse.json(
      { message: "Internal server error", success: false },
      { status: 500 }
    );
  }
}

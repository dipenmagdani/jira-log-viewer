import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { siteUrl, email, apiToken, worklog } = await request.json();

    if (
      !siteUrl ||
      !email ||
      !apiToken ||
      !worklog ||
      !worklog.issueKey ||
      !worklog.timeSpent
    ) {
      return NextResponse.json(
        { message: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Create base64 encoded credentials
    const credentials = Buffer.from(`${email}:${apiToken}`).toString("base64");

    // Add the worklog to the issue
    const worklogResponse = await fetch(
      `${siteUrl}/rest/api/3/issue/${worklog.issueKey}/worklog`,
      {
        method: "POST",
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
      console.error("Failed to add worklog:", errorText);
      return NextResponse.json(
        { message: "Failed to add worklog to JIRA", error: errorText },
        { status: 500 }
      );
    }

    const worklogData = await worklogResponse.json();

    return NextResponse.json({
      success: true,
      message: "Worklog added successfully",
      worklog: worklogData,
    });
  } catch (error) {
    console.error("Add worklog API error:", error);
    return NextResponse.json(
      { message: "Internal server error", success: false },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteUrl, email, apiToken, issueKey } = body;

    if (!siteUrl || !email || !apiToken || !issueKey) {
      return NextResponse.json(
        { message: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Create Basic Auth credentials
    const credentials = Buffer.from(`${email}:${apiToken}`).toString("base64");

    // First, fetch the issue details with all needed fields
    const issueResponse = await fetch(
      `${siteUrl}/rest/api/3/issue/${issueKey}?fields=summary,description,issuetype,priority,status,project,worklog,created,updated,assignee,reporter,duedate,fixVersions,components,labels,timetracking,subtasks,parent`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${credentials}`,
          Accept: "application/json",
        },
      }
    );

    if (!issueResponse.ok) {
      return NextResponse.json(
        { message: "Failed to fetch issue details" },
        { status: issueResponse.status }
      );
    }

    const issueData = await issueResponse.json();

    // Get the worklog
    const worklogResponse = await fetch(
      `${siteUrl}/rest/api/3/issue/${issueKey}/worklog`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${credentials}`,
          Accept: "application/json",
        },
      }
    );

    if (!worklogResponse.ok) {
      return NextResponse.json(
        { message: "Failed to fetch worklog data" },
        { status: worklogResponse.status }
      );
    }

    const worklogData = await worklogResponse.json();

    // Find the most recent worklog (we're displaying details for a specific worklog)
    // Ideally, we should pass the worklog ID as well for more precise data
    const recentWorklog =
      worklogData.worklogs && worklogData.worklogs.length > 0
        ? worklogData.worklogs[0]
        : {};

    // Format the data in the expected structure with all fields
    const worklog = {
      id: issueData.id,
      key: issueData.key,
      issueKey: issueKey,
      summary: issueData.fields.summary,
      description: issueData.fields.description || "",
      issueType: {
        id: issueData.fields.issuetype?.id || "",
        name: issueData.fields.issuetype?.name || "",
        iconUrl: issueData.fields.issuetype?.iconUrl || "",
        subtask: issueData.fields.issuetype?.subtask || false,
      },
      priority: {
        id: issueData.fields.priority?.id || "",
        name: issueData.fields.priority?.name || "",
        iconUrl: issueData.fields.priority?.iconUrl || "",
      },
      status: {
        id: issueData.fields.status?.id || "",
        name: issueData.fields.status?.name || "",
        statusCategory: {
          id: issueData.fields.status?.statusCategory?.id || 0,
          name: issueData.fields.status?.statusCategory?.name || "",
          key: issueData.fields.status?.statusCategory?.key || "",
          colorName: issueData.fields.status?.statusCategory?.colorName || "",
        },
      },
      project: {
        id: issueData.fields.project?.id || "",
        key: issueData.fields.project?.key || "",
        name: issueData.fields.project?.name || "",
        avatarUrls: issueData.fields.project?.avatarUrls || {},
      },
      assignee: issueData.fields.assignee
        ? {
            accountId: issueData.fields.assignee.accountId,
            displayName: issueData.fields.assignee.displayName,
            avatarUrls: issueData.fields.assignee.avatarUrls,
          }
        : null,
      reporter: issueData.fields.reporter
        ? {
            accountId: issueData.fields.reporter.accountId,
            displayName: issueData.fields.reporter.displayName,
            avatarUrls: issueData.fields.reporter.avatarUrls,
          }
        : null,
      created: issueData.fields.created,
      updated: issueData.fields.updated,
      duedate: issueData.fields.duedate,
      fixVersions: issueData.fields.fixVersions || [],
      components: issueData.fields.components || [],
      labels: issueData.fields.labels || [],
      timeTracking: {
        originalEstimate: issueData.fields.timetracking?.originalEstimate || "",
        remainingEstimate:
          issueData.fields.timetracking?.remainingEstimate || "",
        timeSpent: issueData.fields.timetracking?.timeSpent || "",
        originalEstimateSeconds:
          issueData.fields.timetracking?.originalEstimateSeconds || 0,
        remainingEstimateSeconds:
          issueData.fields.timetracking?.remainingEstimateSeconds || 0,
        timeSpentSeconds: issueData.fields.timetracking?.timeSpentSeconds || 0,
      },
      subtasks: issueData.fields.subtasks || [],
      parent: issueData.fields.parent || null,
      worklogCount: worklogData.total || 0,
      timeSpent: recentWorklog?.timeSpent || "0h",
      timeSpentSeconds: recentWorklog?.timeSpentSeconds || 0,
      comment: recentWorklog?.comment || "",
      started: recentWorklog?.started || issueData.fields.created,
      author: {
        accountId: recentWorklog?.author?.accountId || "",
        displayName: recentWorklog?.author?.displayName || "Unknown",
        emailAddress: recentWorklog?.author?.emailAddress || "",
        avatarUrls: recentWorklog?.author?.avatarUrls || {},
      },
    };

    return NextResponse.json({ worklog });
  } catch (error) {
    console.error("Error in worklog-details route:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

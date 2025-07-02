import { NextRequest, NextResponse } from "next/server";

interface JiraWorklog {
  id: string;
  issueKey: string;
  summary: string;
  issueType: {
    name: string;
    iconUrl: string;
  };
  priority: {
    name: string;
    iconUrl: string;
  };
  status: {
    name: string;
    statusCategory: {
      name: string;
      colorName: string;
    };
  };
  project: {
    key: string;
    name: string;
    avatarUrls: {
      "16x16": string;
      "24x24": string;
      "32x32": string;
      "48x48": string;
    };
  };
  timeSpent: string;
  timeSpentSeconds: number;
  comment: string;
  created: string;
  started: string;
  author: {
    accountId: string;
    displayName: string;
    emailAddress: string;
    avatarUrls: {
      "16x16": string;
      "24x24": string;
      "32x32": string;
      "48x48": string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const { siteUrl, email, apiToken, startDate, endDate } =
      await request.json();

    if (!siteUrl || !email || !apiToken || !startDate || !endDate) {
      return NextResponse.json(
        { message: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Create base64 encoded credentials
    const credentials = Buffer.from(`${email}:${apiToken}`).toString("base64");

    // First, get the current user's account ID
    const userResponse = await fetch(`${siteUrl}/rest/api/3/myself`, {
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: "application/json",
      },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error("Failed to get user information:", errorText);
      return NextResponse.json(
        { message: "Failed to authenticate with JIRA" },
        { status: 401 }
      );
    }

    const userData = await userResponse.json();
    const accountId = userData.accountId;

    // Search for worklogs using JQL with expanded fields
    const jqlQuery = `worklogAuthor = "${accountId}" AND worklogDate >= "${startDate}" AND worklogDate <= "${endDate}"`;

    const searchResponse = await fetch(`${siteUrl}/rest/api/3/search`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jql: jqlQuery,
        fields: [
          "summary",
          "worklog",
          "issuetype",
          "priority",
          "status",
          "project",
          "assignee",
          "reporter",
          "description",
        ],
        expand: ["worklog"],
        maxResults: 500,
      }),
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error("Failed to search for issues:", errorText);
      return NextResponse.json(
        { message: "Failed to fetch worklogs from JIRA" },
        { status: 500 }
      );
    }

    const searchData = await searchResponse.json();
    const worklogs: JiraWorklog[] = [];

    // Extract worklogs from each issue
    for (const issue of searchData.issues) {
      if (issue.fields.worklog && issue.fields.worklog.worklogs) {
        for (const worklog of issue.fields.worklog.worklogs) {
          // Only include worklogs by the current user within the date range
          if (worklog.author.accountId === accountId) {
            const worklogDate = new Date(worklog.started)
              .toISOString()
              .split("T")[0];
            if (worklogDate >= startDate && worklogDate <= endDate) {
              worklogs.push({
                id: worklog.id,
                issueKey: issue.key,
                summary: issue.fields.summary,
                issueType: {
                  name: issue.fields.issuetype?.name || "Unknown",
                  iconUrl: issue.fields.issuetype?.iconUrl || "",
                },
                priority: {
                  name: issue.fields.priority?.name || "Medium",
                  iconUrl: issue.fields.priority?.iconUrl || "",
                },
                status: {
                  name: issue.fields.status?.name || "Unknown",
                  statusCategory: {
                    name: issue.fields.status?.statusCategory?.name || "To Do",
                    colorName:
                      issue.fields.status?.statusCategory?.colorName ||
                      "blue-gray",
                  },
                },
                project: {
                  key: issue.fields.project?.key || "",
                  name: issue.fields.project?.name || "",
                  avatarUrls: issue.fields.project?.avatarUrls || {
                    "16x16": "",
                    "24x24": "",
                    "32x32": "",
                    "48x48": "",
                  },
                },
                timeSpent: worklog.timeSpent,
                timeSpentSeconds: worklog.timeSpentSeconds,
                comment:
                  typeof worklog.comment === "string"
                    ? worklog.comment
                    : worklog.comment?.content?.[0]?.content?.[0]?.text || "",
                created: worklog.created,
                started: worklog.started,
                author: {
                  accountId: worklog.author.accountId,
                  displayName: worklog.author.displayName,
                  emailAddress: worklog.author.emailAddress,
                  avatarUrls: worklog.author.avatarUrls || {
                    "16x16": "",
                    "24x24": "",
                    "32x32": "",
                    "48x48": "",
                  },
                },
              });
            }
          }
        }
      }
    }

    // Sort worklogs by start time (most recent first)
    worklogs.sort(
      (a, b) => new Date(b.started).getTime() - new Date(a.started).getTime()
    );

    // Calculate summary statistics
    const totalTimeSpent = worklogs.reduce(
      (sum, log) => sum + log.timeSpentSeconds,
      0
    );
    const totalHours = (totalTimeSpent / 3600).toFixed(2);
    const uniqueIssues = new Set(worklogs.map((log) => log.issueKey)).size;
    const uniqueProjects = new Set(worklogs.map((log) => log.project.key)).size;

    // Group by date for better organization
    const worklogsByDate: { [key: string]: JiraWorklog[] } = {};
    worklogs.forEach((log) => {
      const dateKey = new Date(log.started).toISOString().split("T")[0];
      if (!worklogsByDate[dateKey]) {
        worklogsByDate[dateKey] = [];
      }
      worklogsByDate[dateKey].push(log);
    });

    return NextResponse.json({
      worklogs,
      worklogsByDate,
      summary: {
        totalWorklogs: worklogs.length,
        totalHours: parseFloat(totalHours),
        totalTimeSpent,
        uniqueIssues,
        uniqueProjects,
        dateRange: {
          start: startDate,
          end: endDate,
        },
      },
      user: {
        accountId: userData.accountId,
        displayName: userData.displayName,
        emailAddress: userData.emailAddress,
        avatarUrls: userData.avatarUrls,
      },
    });
  } catch (error) {
    console.error("Failed to fetch worklogs:", error);
    return NextResponse.json(
      { message: "Internal server error while fetching worklogs" },
      { status: 500 }
    );
  }
}

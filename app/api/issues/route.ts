import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const issueId = searchParams.get("issueId");
    const siteUrl = searchParams.get("siteUrl");
    const email = searchParams.get("email");
    const apiToken = searchParams.get("apiToken");

    if (!siteUrl || !email || !apiToken || !issueId) {
      return NextResponse.json(
        { message: "Missing required parameters for GET request" },
        { status: 400 }
      );
    }

    const credentials = Buffer.from(`${email}:${apiToken}`).toString("base64");

    const searchResponse = await fetch(
      `${siteUrl}/rest/api/3/issue/${issueId}?fields=summary,description,issuetype,priority,status,project,assignee,reporter,created,updated,duedate,fixVersions,components,labels,worklog,timetracking,subtasks,parent&expand=worklog,changelog`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${credentials}`,
          Accept: "application/json",
        },
      }
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error("Failed to fetch issue by ID:", errorText);
      return NextResponse.json(
        { message: "Failed to fetch issue from JIRA by ID" },
        { status: 500 }
      );
    }

    const issueData = await searchResponse.json();
    let subtasks = [];

    if (issueData.fields.subtasks && issueData.fields.subtasks.length > 0) {
      const subtaskJQL = `parent = "${issueId}"`;
      const subtaskSearchResponse = await fetch(
        `${siteUrl}/rest/api/3/search`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${credentials}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jql: subtaskJQL,
            fields: ["summary", "issuetype", "project"],
            maxResults: 100,
          }),
        }
      );

      if (subtaskSearchResponse.ok) {
        const subtaskSearchData = await subtaskSearchResponse.json();
        subtasks = subtaskSearchData.issues;
      }
    }

    const formattedIssue = {
      id: issueData.id,
      key: issueData.key,
      summary: issueData.fields.summary,
      description: issueData.fields.description || "",
      issueType: {
        id: issueData.fields.issuetype.id,
        name: issueData.fields.issuetype.name,
        iconUrl: issueData.fields.issuetype.iconUrl,
        subtask: issueData.fields.issuetype.subtask,
      },
      priority: issueData.fields.priority
        ? {
            id: issueData.fields.priority.id,
            name: issueData.fields.priority.name,
            iconUrl: issueData.fields.priority.iconUrl,
          }
        : null,
      status: {
        id: issueData.fields.status.id,
        name: issueData.fields.status.name,
        statusCategory: {
          id: issueData.fields.status.statusCategory.id,
          name: issueData.fields.status.statusCategory.name,
          key: issueData.fields.status.statusCategory.key,
          colorName: issueData.fields.status.statusCategory.colorName,
        },
      },
      project: {
        id: issueData.fields.project.id,
        key: issueData.fields.project.key,
        name: issueData.fields.project.name,
        avatarUrls: issueData.fields.project.avatarUrls,
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
        originalEstimate: issueData.fields.timetracking?.originalEstimate,
        remainingEstimate: issueData.fields.timetracking?.remainingEstimate,
        timeSpent: issueData.fields.timetracking?.timeSpent,
        originalEstimateSeconds:
          issueData.fields.timetracking?.originalEstimateSeconds,
        remainingEstimateSeconds:
          issueData.fields.timetracking?.remainingEstimateSeconds,
        timeSpentSeconds: issueData.fields.timetracking?.timeSpentSeconds,
      },
      subtasks: subtasks,
      parent: issueData.fields.parent || null,
      worklogCount: issueData.fields.worklog?.total || 0,
    };

    return NextResponse.json({
      issues: [formattedIssue],
      pagination: {
        total: 1,
        startAt: 0,
        maxResults: 1,
        isLast: true,
      },
      summary: {},
      filters: {},
      user: {},
    });
  } catch (error) {
    console.error("Failed to fetch issue by ID:", error);
    return NextResponse.json(
      { message: "Internal server error while fetching issue by ID" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { siteUrl, email, apiToken, filters } = await request.json();

    if (!siteUrl || !email || !apiToken) {
      return NextResponse.json(
        { message: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Create base64 encoded credentials
    const credentials = Buffer.from(`${email}:${apiToken}`).toString("base64");

    // Get user info first
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
    const accountId = userData.accountId;
    const { searchParams } = new URL(request.url);
    const issueId = searchParams.get("issueId");

    // Build JQL query based on filters
    let jql = `assignee = "${accountId}"`;

    if (issueId) {
      jql = `issue = "${issueId}"`;
    } else if (filters?.parent) {
      // Handle subtask search when parent key is provided
      jql = `parent = "${filters.parent}"`;
    } else if (filters?.status && filters.status !== "all") {
      jql += ` AND status = "${filters.status}"`;
    }

    if (filters?.project && filters.project !== "all") {
      jql += ` AND project = "${filters.project}"`;
    }

    if (filters?.issueType && filters.issueType !== "all") {
      jql += ` AND issuetype = "${filters.issueType}"`;
    }

    // Add date filter if provided
    if (filters?.updatedSince) {
      jql += ` AND updated >= "${filters.updatedSince}"`;
    }

    // Order by updated date (most recent first)
    jql += " ORDER BY updated DESC";

    let searchResponse;
    if (issueId) {
      // Fetch the specific issue
      searchResponse = await fetch(
        `${siteUrl}/rest/api/3/issue/${issueId}?fields=summary,description,issuetype,priority,status,project,assignee,reporter,created,updated,duedate,fixVersions,components,labels,worklog,timetracking,subtasks,parent&expand=worklog,changelog`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${credentials}`,
            Accept: "application/json",
          },
        }
      );
    } else {
      searchResponse = await fetch(`${siteUrl}/rest/api/3/search`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jql: jql,
          fields: [
            "summary",
            "description",
            "issuetype",
            "priority",
            "status",
            "project",
            "assignee",
            "reporter",
            "created",
            "updated",
            "duedate",
            "fixVersions",
            "components",
            "labels",
            "worklog",
            "timetracking",
            "subtasks",
            "parent",
          ],
          expand: ["worklog", "changelog"],
          maxResults: filters?.maxResults || 100,
          startAt: filters?.startAt || 0,
        }),
      });
    }

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error("Failed to search for issues:", errorText);
      return NextResponse.json(
        { message: "Failed to fetch issues from JIRA" },
        { status: 500 }
      );
    }

    let searchData;
    if (issueId) {
      const issueData = await searchResponse.json();
      searchData = { issues: [issueData], total: 1, startAt: 0, maxResults: 1 };

      // If the issue has subtasks, fetch them explicitly
      if (issueData.fields.subtasks && issueData.fields.subtasks.length > 0) {
        const subtaskJQL = `parent = "${issueId}"`;
        const subtaskSearchResponse = await fetch(
          `${siteUrl}/rest/api/3/search`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${credentials}`,
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              jql: subtaskJQL,
              fields: ["summary", "issuetype", "project"],
              maxResults: 100,
            }),
          }
        );

        if (subtaskSearchResponse.ok) {
          const subtaskSearchData = await subtaskSearchResponse.json();
          issueData.fields.subtasks = subtaskSearchData.issues;
        }
      }
    } else {
      searchData = await searchResponse.json();
    }

    // Format issues data
    const issues = searchData.issues.map((issue: any) => ({
      id: issue.id,
      key: issue.key,
      summary: issue.fields.summary,
      description: issue.fields.description || "",
      issueType: {
        id: issue.fields.issuetype.id,
        name: issue.fields.issuetype.name,
        iconUrl: issue.fields.issuetype.iconUrl,
        subtask: issue.fields.issuetype.subtask,
      },
      priority: issue.fields.priority
        ? {
            id: issue.fields.priority.id,
            name: issue.fields.priority.name,
            iconUrl: issue.fields.priority.iconUrl,
          }
        : null,
      status: {
        id: issue.fields.status.id,
        name: issue.fields.status.name,
        statusCategory: {
          id: issue.fields.status.statusCategory.id,
          name: issue.fields.status.statusCategory.name,
          key: issue.fields.status.statusCategory.key,
          colorName: issue.fields.status.statusCategory.colorName,
        },
      },
      project: {
        id: issue.fields.project.id,
        key: issue.fields.project.key,
        name: issue.fields.project.name,
        avatarUrls: issue.fields.project.avatarUrls,
      },
      assignee: issue.fields.assignee
        ? {
            accountId: issue.fields.assignee.accountId,
            displayName: issue.fields.assignee.displayName,
            avatarUrls: issue.fields.assignee.avatarUrls,
          }
        : null,
      reporter: issue.fields.reporter
        ? {
            accountId: issue.fields.reporter.accountId,
            displayName: issue.fields.reporter.displayName,
            avatarUrls: issue.fields.reporter.avatarUrls,
          }
        : null,
      created: issue.fields.created,
      updated: issue.fields.updated,
      duedate: issue.fields.duedate,
      fixVersions: issue.fields.fixVersions || [],
      components: issue.fields.components || [],
      labels: issue.fields.labels || [],
      timeTracking: {
        originalEstimate: issue.fields.timetracking?.originalEstimate,
        remainingEstimate: issue.fields.timetracking?.remainingEstimate,
        timeSpent: issue.fields.timetracking?.timeSpent,
        originalEstimateSeconds:
          issue.fields.timetracking?.originalEstimateSeconds,
        remainingEstimateSeconds:
          issue.fields.timetracking?.remainingEstimateSeconds,
        timeSpentSeconds: issue.fields.timetracking?.timeSpentSeconds,
      },
      subtasks: issue.fields.subtasks || [],
      parent: issue.fields.parent || null,
      worklogCount: issue.fields.worklog?.total || 0,
    }));

    // Calculate summary statistics
    const totalIssues = searchData.total;
    const statusCounts = issues.reduce((acc: any, issue: any) => {
      const statusName = issue.status.name;
      acc[statusName] = (acc[statusName] || 0) + 1;
      return acc;
    }, {});

    const priorityCounts = issues.reduce((acc: any, issue: any) => {
      const priorityName = issue.priority?.name || "None";
      acc[priorityName] = (acc[priorityName] || 0) + 1;
      return acc;
    }, {});

    const projectCounts = issues.reduce((acc: any, issue: any) => {
      const projectKey = issue.project.key;
      acc[projectKey] = (acc[projectKey] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      issues,
      pagination: {
        total: totalIssues,
        startAt: searchData.startAt,
        maxResults: searchData.maxResults,
        isLast: searchData.startAt + searchData.issues.length >= totalIssues,
      },
      summary: {
        totalIssues,
        statusCounts,
        priorityCounts,
        projectCounts,
      },
      filters: filters || {},
      user: {
        accountId: userData.accountId,
        displayName: userData.displayName,
        emailAddress: userData.emailAddress,
      },
    });
  } catch (error) {
    console.error("Failed to fetch issues:", error);
    return NextResponse.json(
      { message: "Internal server error while fetching issues" },
      { status: 500 }
    );
  }
}

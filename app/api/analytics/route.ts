import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { siteUrl, email, apiToken, dateRange } = await request.json();

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

    // Set default date range to last 30 days if not provided
    const endDate = dateRange?.end || new Date().toISOString().split("T")[0];
    const startDate =
      dateRange?.start ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

    // Fetch worklogs for analytics
    const worklogJql = `worklogAuthor = "${accountId}" AND worklogDate >= "${startDate}" AND worklogDate <= "${endDate}"`;

    const worklogsResponse = await fetch(`${siteUrl}/rest/api/3/search`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jql: worklogJql,
        fields: [
          "summary",
          "worklog",
          "issuetype",
          "priority",
          "status",
          "project",
          "timetracking",
        ],
        expand: ["worklog"],
        maxResults: 1000,
      }),
    });

    // Fetch assigned issues for current status
    const issuesJql = `assignee = "${accountId}" AND updated >= "${startDate}"`;

    const issuesResponse = await fetch(`${siteUrl}/rest/api/3/search`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jql: issuesJql,
        fields: [
          "issuetype",
          "priority",
          "status",
          "project",
          "created",
          "updated",
          "resolution",
          "timetracking",
        ],
        maxResults: 1000,
      }),
    });

    const worklogsData = worklogsResponse.ok
      ? await worklogsResponse.json()
      : { issues: [] };
    const issuesData = issuesResponse.ok
      ? await issuesResponse.json()
      : { issues: [] };

    // Process worklog data
    const worklogs: any[] = [];
    const worklogsByDate: { [key: string]: any[] } = {};
    const worklogsByProject: { [key: string]: any[] } = {};
    let totalTimeSpentSeconds = 0;

    worklogsData.issues.forEach((issue: any) => {
      if (issue.fields.worklog && issue.fields.worklog.worklogs) {
        issue.fields.worklog.worklogs.forEach((worklog: any) => {
          if (worklog.author.accountId === accountId) {
            const worklogDate = new Date(worklog.started)
              .toISOString()
              .split("T")[0];
            if (worklogDate >= startDate && worklogDate <= endDate) {
              const processedWorklog = {
                id: worklog.id,
                issueKey: issue.key,
                summary: issue.fields.summary,
                timeSpentSeconds: worklog.timeSpentSeconds,
                timeSpent: worklog.timeSpent,
                started: worklog.started,
                comment: worklog.comment || "",
                project: issue.fields.project,
                issueType: issue.fields.issuetype,
                priority: issue.fields.priority,
                status: issue.fields.status,
              };

              worklogs.push(processedWorklog);
              totalTimeSpentSeconds += worklog.timeSpentSeconds;

              // Group by date
              if (!worklogsByDate[worklogDate]) {
                worklogsByDate[worklogDate] = [];
              }
              worklogsByDate[worklogDate].push(processedWorklog);

              // Group by project
              const projectKey = issue.fields.project.key;
              if (!worklogsByProject[projectKey]) {
                worklogsByProject[projectKey] = [];
              }
              worklogsByProject[projectKey].push(processedWorklog);
            }
          }
        });
      }
    });

    // Process issues data
    const issuesByStatus: { [key: string]: number } = {};
    const issuesByPriority: { [key: string]: number } = {};
    const issuesByProject: { [key: string]: number } = {};
    const issuesByType: { [key: string]: number } = {};
    let resolvedIssues = 0;
    let createdIssues = 0;

    issuesData.issues.forEach((issue: any) => {
      // Count by status
      const statusName = issue.fields.status.name;
      issuesByStatus[statusName] = (issuesByStatus[statusName] || 0) + 1;

      // Count by priority
      const priorityName = issue.fields.priority?.name || "None";
      issuesByPriority[priorityName] =
        (issuesByPriority[priorityName] || 0) + 1;

      // Count by project
      const projectKey = issue.fields.project.key;
      issuesByProject[projectKey] = (issuesByProject[projectKey] || 0) + 1;

      // Count by issue type
      const issueTypeName = issue.fields.issuetype.name;
      issuesByType[issueTypeName] = (issuesByType[issueTypeName] || 0) + 1;

      // Count resolved issues
      if (issue.fields.resolution) {
        resolvedIssues++;
      }

      // Count created issues in date range
      const createdDate = new Date(issue.fields.created)
        .toISOString()
        .split("T")[0];
      if (createdDate >= startDate && createdDate <= endDate) {
        createdIssues++;
      }
    });

    // Calculate daily work patterns
    const dailyStats: { [key: string]: { hours: number; entries: number } } =
      {};
    Object.entries(worklogsByDate).forEach(([date, logs]) => {
      const totalSeconds = logs.reduce(
        (sum, log) => sum + log.timeSpentSeconds,
        0
      );
      dailyStats[date] = {
        hours: Math.round((totalSeconds / 3600) * 100) / 100,
        entries: logs.length,
      };
    });

    // Calculate project time distribution
    const projectTimeStats = Object.entries(worklogsByProject)
      .map(([projectKey, logs]) => {
        const totalSeconds = logs.reduce(
          (sum, log) => sum + log.timeSpentSeconds,
          0
        );
        const projectName = logs[0]?.project?.name || projectKey;
        return {
          projectKey,
          projectName,
          totalHours: Math.round((totalSeconds / 3600) * 100) / 100,
          totalEntries: logs.length,
          percentage: Math.round((totalSeconds / totalTimeSpentSeconds) * 100),
        };
      })
      .sort((a, b) => b.totalHours - a.totalHours);

    // Calculate productivity metrics
    const totalHours = Math.round((totalTimeSpentSeconds / 3600) * 100) / 100;
    const averageHoursPerDay = totalHours / Object.keys(dailyStats).length || 0;
    const mostProductiveDay = Object.entries(dailyStats).reduce(
      (max, [date, stats]) =>
        stats.hours > max.hours ? { date, ...stats } : max,
      { date: "", hours: 0, entries: 0 }
    );

    return NextResponse.json({
      analytics: {
        dateRange: { start: startDate, end: endDate },
        worklogSummary: {
          totalWorklogs: worklogs.length,
          totalHours,
          totalTimeSpentSeconds,
          averageHoursPerDay: Math.round(averageHoursPerDay * 100) / 100,
          uniqueProjects: Object.keys(worklogsByProject).length,
          uniqueIssues: new Set(worklogs.map((w) => w.issueKey)).size,
        },
        issueSummary: {
          totalIssues: issuesData.issues.length,
          resolvedIssues,
          createdIssues,
          resolutionRate:
            issuesData.issues.length > 0
              ? Math.round((resolvedIssues / issuesData.issues.length) * 100)
              : 0,
        },
        distributions: {
          issuesByStatus,
          issuesByPriority,
          issuesByProject,
          issuesByType,
          projectTimeStats,
        },
        trends: {
          dailyStats,
          mostProductiveDay,
        },
      },
      user: {
        accountId: userData.accountId,
        displayName: userData.displayName,
        emailAddress: userData.emailAddress,
      },
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json(
      { message: "Internal server error while fetching analytics" },
      { status: 500 }
    );
  }
}

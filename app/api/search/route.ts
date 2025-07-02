import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const {
      siteUrl,
      email,
      apiToken,
      query,
      projectKey,
      startDate,
      endDate,
      searchFields,
      issueType,
      status,
      priority,
      timeRange,
      sortBy,
    } = await request.json();

    if (!siteUrl || !email || !apiToken) {
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

    // Construct JQL query
    let jqlParts = [`worklogAuthor = "${accountId}"`];

    // Add date range
    if (startDate && endDate) {
      jqlParts.push(
        `worklogDate >= "${startDate}" AND worklogDate <= "${endDate}"`
      );
    }

    // Add project filter
    if (projectKey) {
      jqlParts.push(`project = "${projectKey}"`);
    }

    // Add issue type filter
    if (issueType) {
      jqlParts.push(`issuetype = "${issueType}"`);
    }

    // Add status filter
    if (status) {
      jqlParts.push(`status = "${status}"`);
    }

    // Add priority filter
    if (priority) {
      jqlParts.push(`priority = "${priority}"`);
    }

    // Add text search
    if (query) {
      const searchTerms = [];
      if (searchFields?.includes("issueKey")) {
        searchTerms.push(`issuekey ~ "${query}*"`);
      }
      if (searchFields?.includes("summary")) {
        searchTerms.push(`summary ~ "${query}*"`);
      }
      if (searchFields?.includes("description")) {
        searchTerms.push(`description ~ "${query}*"`);
      }
      if (searchFields?.includes("comment")) {
        searchTerms.push(`comment ~ "${query}*"`);
      }

      if (searchTerms.length > 0) {
        jqlParts.push(`(${searchTerms.join(" OR ")})`);
      }
    }

    const jqlQuery = jqlParts.join(" AND ");

    // Determine sort order
    let orderBy = "worklogDate DESC";
    if (sortBy) {
      switch (sortBy) {
        case "date_asc":
          orderBy = "worklogDate ASC";
          break;
        case "date_desc":
          orderBy = "worklogDate DESC";
          break;
        case "issue_key":
          orderBy = "key ASC";
          break;
        case "time_asc":
          orderBy = "timeSpent ASC";
          break;
        case "time_desc":
          orderBy = "timeSpent DESC";
          break;
      }
    }

    const finalJql = `${jqlQuery} ORDER BY ${orderBy}`;

    const searchResponse = await fetch(`${siteUrl}/rest/api/3/search`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jql: finalJql,
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
    const worklogs = [];

    // Extract worklogs from each issue
    for (const issue of searchData.issues) {
      if (issue.fields.worklog && issue.fields.worklog.worklogs) {
        for (const worklog of issue.fields.worklog.worklogs) {
          // Only include worklogs by the current user
          if (worklog.author.accountId === accountId) {
            const worklogDate = new Date(worklog.started)
              .toISOString()
              .split("T")[0];

            // Apply time range filter if specified
            if (timeRange) {
              const timeSpentHours = worklog.timeSpentSeconds / 3600;

              if (
                (timeRange === "lt_1h" && timeSpentHours >= 1) ||
                (timeRange === "1h_to_4h" &&
                  (timeSpentHours < 1 || timeSpentHours > 4)) ||
                (timeRange === "4h_to_8h" &&
                  (timeSpentHours < 4 || timeSpentHours > 8)) ||
                (timeRange === "gt_8h" && timeSpentHours <= 8)
              ) {
                continue; // Skip this worklog as it doesn't match the time filter
              }
            }

            // Include worklog in results
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

    return NextResponse.json({
      worklogs,
      total: worklogs.length,
      query: finalJql,
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

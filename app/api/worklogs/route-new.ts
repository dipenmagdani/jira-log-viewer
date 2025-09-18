/**
 * Worklogs API Route - Jira REST API v3
 *
 * Implements the Jira Worklogs REST API v3 endpoints:
 * - GET /rest/api/3/worklog/list
 * - GET /rest/api/3/worklog/updated
 * - GET /rest/api/3/issue/{issueIdOrKey}/worklog
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthPayload } from "../../utils/authUtils";

interface JiraWorklog {
  self: string;
  author: {
    self: string;
    accountId: string;
    displayName: string;
    active: boolean;
    timeZone: string;
    avatarUrls: Record<string, string>;
  };
  updateAuthor?: {
    self: string;
    accountId: string;
    displayName: string;
    active: boolean;
    timeZone: string;
    avatarUrls: Record<string, string>;
  };
  comment?: {
    type: string;
    version: number;
    content: any[];
  };
  created: string;
  updated: string;
  visibility?: {
    type: string;
    value: string;
  };
  started: string;
  timeSpent: string;
  timeSpentSeconds: number;
  id: string;
  issueId: string;
}

interface WorklogListResponse {
  self: string;
  nextPage?: string;
  maxResults: number;
  startAt: number;
  total: number;
  isLast: boolean;
  values: JiraWorklog[];
}

interface WorklogIdsResponse {
  self: string;
  nextPage?: string;
  maxResults: number;
  startAt: number;
  total: number;
  isLast: boolean;
  values: number[];
}

/**
 * GET /api/worklogs - Get worklogs using Jira REST API v3
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since"); // Unix timestamp in milliseconds
    const expand = searchParams.getAll("expand");
    const maxResults = parseInt(searchParams.get("maxResults") || "1000");
    const startAt = parseInt(searchParams.get("startAt") || "0");

    // Get authentication data
    const authData = getAuthPayload();
    if (!authData.isOAuth && !authData.apiToken) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    let baseUrl: string;
    let headers: Record<string, string>;

    if (authData.isOAuth && authData.accessToken) {
      if (!authData.siteUrl) {
        return NextResponse.json(
          { success: false, error: "Site URL required for OAuth" },
          { status: 400 }
        );
      }

      baseUrl = authData.siteUrl;
      headers = {
        Authorization: `Bearer ${authData.accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      };
    } else {
      if (!authData.siteUrl || !authData.email || !authData.apiToken) {
        return NextResponse.json(
          { success: false, error: "Missing authentication credentials" },
          { status: 400 }
        );
      }

      baseUrl = authData.siteUrl;
      const credentials = Buffer.from(
        `${authData.email}:${authData.apiToken}`
      ).toString("base64");
      headers = {
        Authorization: `Basic ${credentials}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      };
    }

    let jiraUrl: URL;

    if (since) {
      // Use updated worklogs endpoint for time-based filtering
      jiraUrl = new URL(`${baseUrl}/rest/api/3/worklog/updated`);
      jiraUrl.searchParams.set("since", since);
    } else {
      // Use list endpoint for general worklog listing
      jiraUrl = new URL(`${baseUrl}/rest/api/3/worklog/list`);
    }

    // Add common parameters
    if (expand.length > 0) jiraUrl.searchParams.set("expand", expand.join(","));

    console.log("Fetching worklogs from:", jiraUrl.toString());

    let worklogIds: number[] = [];

    if (since) {
      // First get worklog IDs that were updated since the timestamp
      const idsResponse = await fetch(jiraUrl.toString(), {
        method: "GET",
        headers,
      });

      if (!idsResponse.ok) {
        const errorText = await idsResponse.text();
        console.error("Jira API error (IDs):", idsResponse.status, errorText);
        return NextResponse.json(
          {
            success: false,
            error: `Jira API error: ${idsResponse.status} ${idsResponse.statusText}`,
            details: errorText,
          },
          { status: idsResponse.status }
        );
      }

      const idsData: WorklogIdsResponse = await idsResponse.json();
      worklogIds = idsData.values;

      // Apply pagination to worklog IDs
      const paginatedIds = worklogIds.slice(startAt, startAt + maxResults);

      if (paginatedIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: {
            startAt,
            maxResults,
            total: worklogIds.length,
            isLast: true,
          },
        });
      }

      // Now get the actual worklog details
      const detailsUrl = new URL(`${baseUrl}/rest/api/3/worklog/list`);
      const response = await fetch(detailsUrl.toString(), {
        method: "POST",
        headers,
        body: JSON.stringify({
          ids: paginatedIds,
          expand: expand.length > 0 ? expand : undefined,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Jira API error (details):", response.status, errorText);
        return NextResponse.json(
          {
            success: false,
            error: `Jira API error: ${response.status} ${response.statusText}`,
            details: errorText,
          },
          { status: response.status }
        );
      }

      const data: JiraWorklog[] = await response.json();

      return NextResponse.json({
        success: true,
        data,
        pagination: {
          startAt,
          maxResults,
          total: worklogIds.length,
          isLast: startAt + maxResults >= worklogIds.length,
        },
      });
    } else {
      // For general listing, we need to use a different approach since the list endpoint requires IDs
      // We'll search for recent issues and get their worklogs
      const searchUrl = new URL(`${baseUrl}/rest/api/3/search`);
      searchUrl.searchParams.set(
        "jql",
        "worklogDate >= -30d ORDER BY updated DESC"
      );
      searchUrl.searchParams.set("fields", "worklog");
      searchUrl.searchParams.set("maxResults", "50");

      const searchResponse = await fetch(searchUrl.toString(), {
        method: "GET",
        headers,
      });

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.error(
          "Jira search API error:",
          searchResponse.status,
          errorText
        );
        return NextResponse.json(
          {
            success: false,
            error: `Jira search API error: ${searchResponse.status} ${searchResponse.statusText}`,
            details: errorText,
          },
          { status: searchResponse.status }
        );
      }

      const searchData = await searchResponse.json();
      const allWorklogs: JiraWorklog[] = [];

      // Extract worklogs from all issues
      for (const issue of searchData.issues) {
        if (issue.fields.worklog && issue.fields.worklog.worklogs) {
          for (const worklog of issue.fields.worklog.worklogs) {
            allWorklogs.push({
              ...worklog,
              issueId: issue.id,
              issueKey: issue.key,
            });
          }
        }
      }

      // Sort by updated date (most recent first)
      allWorklogs.sort(
        (a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime()
      );

      // Apply pagination
      const paginatedWorklogs = allWorklogs.slice(
        startAt,
        startAt + maxResults
      );

      return NextResponse.json({
        success: true,
        data: paginatedWorklogs,
        pagination: {
          startAt,
          maxResults,
          total: allWorklogs.length,
          isLast: startAt + maxResults >= allWorklogs.length,
        },
      });
    }
  } catch (error) {
    console.error("Worklogs API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/worklogs - Legacy endpoint for compatibility
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { since, expand, maxResults, startAt } = body;

    // Convert POST to GET request
    const searchParams = new URLSearchParams();
    if (since) searchParams.set("since", since.toString());
    if (expand)
      searchParams.set(
        "expand",
        Array.isArray(expand) ? expand.join(",") : expand
      );
    if (maxResults) searchParams.set("maxResults", maxResults.toString());
    if (startAt) searchParams.set("startAt", startAt.toString());

    const getRequest = new NextRequest(
      `${request.nextUrl.origin}${request.nextUrl.pathname}?${searchParams.toString()}`,
      { method: "GET", headers: request.headers }
    );

    return GET(getRequest);
  } catch (error) {
    console.error("Worklogs POST API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

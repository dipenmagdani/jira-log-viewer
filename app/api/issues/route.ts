/**
 * Issues API Route - Jira REST API v3
 * 
 * Implements the Jira Issues REST API v3 endpoints:
 * - GET /rest/api/3/search - Search for issues
 * - GET /rest/api/3/issue/{issueIdOrKey} - Get issue details
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthPayload } from "../../utils/authUtils";

interface JiraIssue {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    description?: any;
    status: {
      self: string;
      description: string;
      iconUrl: string;
      name: string;
      id: string;
      statusCategory: {
        self: string;
        id: number;
        key: string;
        colorName: string;
        name: string;
      };
    };
    priority?: {
      self: string;
      iconUrl: string;
      name: string;
      id: string;
    };
    assignee?: {
      self: string;
      accountId: string;
      displayName: string;
      active: boolean;
      timeZone: string;
      avatarUrls: Record<string, string>;
    };
    reporter?: {
      self: string;
      accountId: string;
      displayName: string;
      active: boolean;
      timeZone: string;
      avatarUrls: Record<string, string>;
    };
    created: string;
    updated: string;
    project: {
      self: string;
      id: string;
      key: string;
      name: string;
      projectTypeKey: string;
      avatarUrls: Record<string, string>;
    };
    issuetype: {
      self: string;
      id: string;
      description: string;
      iconUrl: string;
      name: string;
      subtask: boolean;
    };
    worklog?: {
      startAt: number;
      maxResults: number;
      total: number;
      worklogs: any[];
    };
    timetracking?: {
      originalEstimate?: string;
      remainingEstimate?: string;
      timeSpent?: string;
      originalEstimateSeconds?: number;
      remainingEstimateSeconds?: number;
      timeSpentSeconds?: number;
    };
  };
}

interface SearchResponse {
  expand: string;
  startAt: number;
  maxResults: number;
  total: number;
  issues: JiraIssue[];
  warningMessages?: string[];
}

/**
 * GET /api/issues - Search for issues or get specific issue details
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const issueKey = searchParams.get('key');
    const jql = searchParams.get('jql');
    const projectKey = searchParams.get('projectKey');
    const assignee = searchParams.get('assignee');
    const status = searchParams.get('status');
    const issueType = searchParams.get('issueType');
    const fields = searchParams.get('fields');
    const expand = searchParams.get('expand');
    const maxResults = parseInt(searchParams.get('maxResults') || '50');
    const startAt = parseInt(searchParams.get('startAt') || '0');

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
        'Authorization': `Bearer ${authData.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };
    } else {
      if (!authData.siteUrl || !authData.email || !authData.apiToken) {
        return NextResponse.json(
          { success: false, error: "Missing authentication credentials" },
          { status: 400 }
        );
      }

      baseUrl = authData.siteUrl;
      const credentials = Buffer.from(`${authData.email}:${authData.apiToken}`).toString('base64');
      headers = {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };
    }

    // If specific issue key is requested, get issue details
    if (issueKey) {
      const issueUrl = new URL(`${baseUrl}/rest/api/3/issue/${issueKey}`);
      
      // Add optional parameters
      if (fields) issueUrl.searchParams.set('fields', fields);
      if (expand) issueUrl.searchParams.set('expand', expand);

      console.log('Fetching issue details from:', issueUrl.toString());

      const response = await fetch(issueUrl.toString(), {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Jira API error (issue details):', response.status, errorText);
        return NextResponse.json(
          { 
            success: false, 
            error: `Jira API error: ${response.status} ${response.statusText}`,
            details: errorText
          },
          { status: response.status }
        );
      }

      const issueData: JiraIssue = await response.json();

      return NextResponse.json({
        success: true,
        data: issueData,
      });
    }

    // Otherwise, search for issues
    const searchUrl = new URL(`${baseUrl}/rest/api/3/search`);

    // Build JQL query
    let searchJql = jql || '';
    
    if (!searchJql) {
      const jqlParts: string[] = [];
      
      if (projectKey) jqlParts.push(`project = "${projectKey}"`);
      if (assignee) {
        if (assignee === 'currentUser()') {
          jqlParts.push(`assignee = currentUser()`);
        } else {
          jqlParts.push(`assignee = "${assignee}"`);
        }
      }
      if (status) jqlParts.push(`status = "${status}"`);
      if (issueType) jqlParts.push(`issuetype = "${issueType}"`);
      
      searchJql = jqlParts.length > 0 ? jqlParts.join(' AND ') : 'order by updated DESC';
    }

    // Add search parameters
    searchUrl.searchParams.set('jql', searchJql);
    searchUrl.searchParams.set('maxResults', maxResults.toString());
    searchUrl.searchParams.set('startAt', startAt.toString());
    
    if (fields) {
      searchUrl.searchParams.set('fields', fields);
    } else {
      // Default fields for issues
      searchUrl.searchParams.set('fields', 'summary,status,priority,assignee,reporter,created,updated,project,issuetype,timetracking');
    }
    
    if (expand) searchUrl.searchParams.set('expand', expand);

    console.log('Searching issues with JQL:', searchJql);
    console.log('Search URL:', searchUrl.toString());

    const response = await fetch(searchUrl.toString(), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Jira search API error:', response.status, errorText);
      return NextResponse.json(
        { 
          success: false, 
          error: `Jira search API error: ${response.status} ${response.statusText}`,
          details: errorText
        },
        { status: response.status }
      );
    }

    const searchData: SearchResponse = await response.json();

    return NextResponse.json({
      success: true,
      data: searchData.issues,
      pagination: {
        startAt: searchData.startAt,
        maxResults: searchData.maxResults,
        total: searchData.total,
        isLast: searchData.startAt + searchData.maxResults >= searchData.total,
      },
      warningMessages: searchData.warningMessages,
    });

  } catch (error) {
    console.error('Issues API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

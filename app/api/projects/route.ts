import { NextRequest, NextResponse } from "next/server";
import {
  extractServerAuth,
  buildJiraHeaders,
  authErrorResponse,
} from "../_utils/serverAuth";

// GET /api/projects -> proxies to Jira project search
export async function GET(request: NextRequest) {
  try {
    const auth = await extractServerAuth(request);
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || undefined;
    const startAt = searchParams.get("startAt") || "0";
    const maxResults = searchParams.get("maxResults") || "50";

    const jiraUrl = new URL(`${auth.siteUrl}/rest/api/3/project/search`);
    jiraUrl.searchParams.set("startAt", startAt);
    jiraUrl.searchParams.set("maxResults", maxResults);
    if (query) jiraUrl.searchParams.set("query", query);

    const headers = buildJiraHeaders(auth);

    const resp = await fetch(jiraUrl.toString(), { headers });
    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json(
        {
          success: false,
          error: "Jira API error",
          status: resp.status,
          details: text,
        },
        { status: resp.status }
      );
    }

    const data = await resp.json();
    return NextResponse.json({ success: true, data });
  } catch (e) {
    const body = authErrorResponse(e);
    const status = (e as any)?.status || 500;
    return NextResponse.json(body, { status });
  }
}

// POST compatibility -> delegates to GET with body params
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const params = new URLSearchParams();
    if (body.q) params.set("q", body.q);
    if (body.startAt) params.set("startAt", String(body.startAt));
    if (body.maxResults) params.set("maxResults", String(body.maxResults));
    const url = `${request.nextUrl.origin}${request.nextUrl.pathname}${params.toString() ? "?" + params.toString() : ""}`;
    return GET(new NextRequest(url, { headers: request.headers }));
  } catch (e) {
    const body = authErrorResponse(e);
    const status = (e as any)?.status || 500;
    return NextResponse.json(body, { status });
  }
}

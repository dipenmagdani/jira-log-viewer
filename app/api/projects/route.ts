import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { siteUrl, email, apiToken } = await request.json();

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

    // Fetch projects the user has access to
    const projectsResponse = await fetch(
      `${siteUrl}/rest/api/3/project/search?expand=description,lead,url,projectKeys,permissions,insight`,
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          Accept: "application/json",
        },
      }
    );

    if (!projectsResponse.ok) {
      return NextResponse.json(
        { message: "Failed to fetch projects" },
        { status: 500 }
      );
    }

    const projectsData = await projectsResponse.json();

    // Filter and format projects
    const projects = projectsData.values.map((project: any) => ({
      id: project.id,
      key: project.key,
      name: project.name,
      description: project.description || "",
      projectTypeKey: project.projectTypeKey,
      simplified: project.simplified,
      style: project.style,
      isPrivate: project.isPrivate,
      lead: {
        accountId: project.lead?.accountId || "",
        displayName: project.lead?.displayName || "",
        avatarUrls: project.lead?.avatarUrls || {},
      },
      avatarUrls: project.avatarUrls || {},
      url: project.url || "",
      issueTypes: project.issueTypes || [],
    }));

    return NextResponse.json({
      projects,
      user: userData,
      total: projects.length,
    });
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json(
      { message: "Internal server error while fetching projects" },
      { status: 500 }
    );
  }
}

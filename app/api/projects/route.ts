import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteUrl, email, apiToken, accessToken, isOAuth } = body;

    console.log("Projects API - Received request:", {
      siteUrl,
      email,
      hasAccessToken: !!accessToken,
      hasApiToken: !!apiToken,
      isOAuth,
      accessTokenPrefix: accessToken
        ? accessToken.substring(0, 20) + "..."
        : "none",
    });

    if (!siteUrl || !email) {
      return NextResponse.json(
        { message: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Set up authorization headers based on auth type
    let authHeaders: Record<string, string>;

    if (isOAuth && accessToken) {
      // OAuth authentication - need to use Atlassian's cloud resource discovery
      console.log("Using OAuth authentication");

      // First get accessible resources to find the cloud ID
      const resourcesResponse = await fetch(
        "https://api.atlassian.com/oauth/token/accessible-resources",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        }
      );

      if (!resourcesResponse.ok) {
        const errorText = await resourcesResponse.text();
        console.error("Failed to get accessible resources:", errorText);
        return NextResponse.json(
          { message: `Failed to get accessible resources: ${errorText}` },
          { status: 401 }
        );
      }

      const resources = await resourcesResponse.json();
      console.log("Accessible resources:", resources);

      // Find the resource that matches the siteUrl
      const matchingResource = resources.find(
        (resource: any) =>
          resource.url === siteUrl || siteUrl.includes(resource.id)
      );

      if (!matchingResource) {
        console.error("No matching resource found for siteUrl:", siteUrl);
        return NextResponse.json(
          { message: `No access to site: ${siteUrl}` },
          { status: 403 }
        );
      }

      console.log("Using cloud ID:", matchingResource.id);

      // Use the cloud ID for API calls
      authHeaders = {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      };

      // Update the API endpoint to use the cloud ID
      const cloudId = matchingResource.id;
      const baseApiUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3`;

      console.log("Making request to:", `${baseApiUrl}/myself`);

      // Get user info using the cloud API
      const userResponse = await fetch(`${baseApiUrl}/myself`, {
        headers: authHeaders,
      });

      console.log("User response status:", userResponse.status);

      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error("Authentication failed:", {
          status: userResponse.status,
          statusText: userResponse.statusText,
          error: errorText,
        });
        return NextResponse.json(
          { message: `Failed to authenticate with JIRA: ${errorText}` },
          { status: 401 }
        );
      }

      const userData = await userResponse.json();

      // Fetch projects using the cloud API
      const projectsResponse = await fetch(
        `${baseApiUrl}/project/search?expand=description,lead,url,projectKeys,permissions,insight`,
        {
          headers: authHeaders,
        }
      );

      if (!projectsResponse.ok) {
        const errorText = await projectsResponse.text();
        console.error("Failed to fetch projects:", errorText);
        return NextResponse.json(
          { message: `Failed to fetch projects: ${errorText}` },
          { status: 500 }
        );
      }

      const projectsData = await projectsResponse.json();

      // Process and return the projects data as before
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
        permissions: project.permissions || {},
        insight: project.insight || {},
      }));

      return NextResponse.json({
        projects,
        user: userData,
        meta: {
          total: projectsData.total || projects.length,
          maxResults: projectsData.maxResults || 50,
          cloudId: cloudId,
          baseUrl: matchingResource.url,
        },
      });
    } else if (apiToken) {
      // Basic authentication (fallback)
      console.log("Using Basic authentication");
      const credentials = Buffer.from(`${email}:${apiToken}`).toString(
        "base64"
      );
      authHeaders = {
        Authorization: `Basic ${credentials}`,
        Accept: "application/json",
      };

      console.log("Making request to:", `${siteUrl}/rest/api/3/myself`);

      // Get user info first
      const userResponse = await fetch(`${siteUrl}/rest/api/3/myself`, {
        headers: authHeaders,
      });

      console.log("User response status:", userResponse.status);

      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error("Authentication failed:", {
          status: userResponse.status,
          statusText: userResponse.statusText,
          error: errorText,
        });
        return NextResponse.json(
          { message: `Failed to authenticate with JIRA: ${errorText}` },
          { status: 401 }
        );
      }

      const userData = await userResponse.json();

      // Fetch projects the user has access to
      const projectsResponse = await fetch(
        `${siteUrl}/rest/api/3/project/search?expand=description,lead,url,projectKeys,permissions,insight`,
        {
          headers: authHeaders,
        }
      );

      if (!projectsResponse.ok) {
        const errorText = await projectsResponse.text();
        console.error("Failed to fetch projects:", errorText);
        return NextResponse.json(
          { message: `Failed to fetch projects: ${errorText}` },
          { status: 500 }
        );
      }

      const projectsData = await projectsResponse.json();

      // Process and return the projects data
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
        permissions: project.permissions || {},
        insight: project.insight || {},
      }));

      return NextResponse.json({
        projects,
        user: userData,
        meta: {
          total: projectsData.total || projects.length,
          maxResults: projectsData.maxResults || 50,
          baseUrl: siteUrl,
        },
      });
    }
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json(
      { message: "Internal server error while fetching projects" },
      { status: 500 }
    );
  }
}

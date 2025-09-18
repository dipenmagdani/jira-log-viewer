/**
 * Server Auth Utilities
 *
 * Provides a unified way for API route handlers to extract Atlassian auth
 * information from incoming requests without relying on browser localStorage.
 *
 * Supported authentication:
 *  - OAuth:   Authorization: Bearer <access_token>
 *  - Basic:   Authorization: Basic <base64(email:apiToken)>
 *
 * Required context header (sent by client):
 *  - X-Site-Url: https://your-domain.atlassian.net
 *
 * Optional:
 *  - X-Cloud-Id: <cloudId> (if already known)
 */

import { NextRequest } from "next/server";

export interface ServerAuthContext {
  siteUrl: string;
  accessToken?: string; // OAuth token
  basic?: { email: string; apiToken: string }; // Basic credentials decoded
  cloudId?: string;
  rawAuthorization?: string;
  authType: "oauth" | "basic";
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number = 401) {
    super(message);
    this.status = status;
  }
}

/**
 * Decode a Basic auth header value into email + apiToken.
 */
function decodeBasicAuth(
  authValue: string
): { email: string; apiToken: string } | null {
  try {
    const base64 = authValue.replace(/^Basic\s+/i, "");
    const decoded = Buffer.from(base64, "base64").toString("utf8");
    const [email, apiToken] = decoded.split(":");
    if (!email || !apiToken) return null;
    return { email, apiToken };
  } catch {
    return null;
  }
}

/**
 * Extract authentication + context from a NextRequest.
 */
export async function extractServerAuth(
  request: NextRequest
): Promise<ServerAuthContext> {
  const authHeader =
    request.headers.get("authorization") ||
    request.headers.get("Authorization");
  const siteUrl =
    request.headers.get("x-site-url") || request.headers.get("X-Site-Url");
  const cloudId =
    request.headers.get("x-cloud-id") ||
    request.headers.get("X-Cloud-Id") ||
    undefined;

  if (!authHeader) {
    throw new AuthError("Missing Authorization header", 401);
  }

  if (!siteUrl) {
    throw new AuthError("Missing X-Site-Url header", 400);
  }

  if (/^Bearer\s+/i.test(authHeader)) {
    const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!accessToken) throw new AuthError("Empty bearer token", 401);
    return {
      siteUrl: siteUrl.replace(/\/?$/, ""),
      accessToken,
      cloudId,
      rawAuthorization: authHeader,
      authType: "oauth",
    };
  }

  if (/^Basic\s+/i.test(authHeader)) {
    const basic = decodeBasicAuth(authHeader);
    if (!basic) throw new AuthError("Invalid Basic auth header", 401);
    return {
      siteUrl: siteUrl.replace(/\/?$/, ""),
      basic,
      cloudId,
      rawAuthorization: authHeader,
      authType: "basic",
    };
  }

  throw new AuthError("Unsupported Authorization scheme", 401);
}

/**
 * Build outbound headers for Jira REST API calls given the context.
 */
export function buildJiraHeaders(
  ctx: ServerAuthContext
): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (ctx.authType === "oauth" && ctx.accessToken) {
    headers.Authorization = `Bearer ${ctx.accessToken}`;
  } else if (ctx.authType === "basic" && ctx.basic) {
    const encoded = Buffer.from(
      `${ctx.basic.email}:${ctx.basic.apiToken}`
    ).toString("base64");
    headers.Authorization = `Basic ${encoded}`;
  }

  return headers;
}

/**
 * Standardized JSON error response body.
 */
export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return {
      success: false,
      error: error.message,
      hint: "Ensure you send Authorization and X-Site-Url headers.",
    };
  }
  return {
    success: false,
    error: error instanceof Error ? error.message : "Unknown error",
  };
}

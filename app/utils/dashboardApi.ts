import { format } from "date-fns";
import type { AuthData } from "../types/dashboard";

export const fetchApi = async (url: string, body: any) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed to ${url}`);
  }
  return response.json();
};

export const fetchWorklogs = async (
  authData: AuthData,
  startDate: Date | null,
  endDate: Date | null
) => {
  if (!startDate || !endDate) return null;
  return fetchApi("/api/worklogs", {
    ...authData,
    startDate: format(startDate, "yyyy-MM-dd"),
    endDate: format(endDate, "yyyy-MM-dd"),
  });
};

export const fetchAnalytics = async (
  authData: AuthData,
  startDate: Date | null,
  endDate: Date | null
) => {
  if (!startDate || !endDate) return null;
  return fetchApi("/api/analytics", {
    ...authData,
    dateRange: {
      start: format(startDate, "yyyy-MM-dd"),
      end: format(endDate, "yyyy-MM-dd"),
    },
  });
};

export const fetchProjects = async (authData: AuthData) => {
  return fetchApi("/api/projects", authData);
};

export const fetchUserInfo = async (authData: AuthData) => {
  const data = await fetchApi("/api/user", authData);
  return data.user;
};

export const fetchIssues = async (authData: AuthData) => {
  try {
    return await fetchApi("/api/issues", authData);
  } catch (err) {
    console.error("Failed to fetch issues:", err);
    return { issues: [] };
  }
}; 
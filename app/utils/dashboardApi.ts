import { format } from "date-fns";
import type { AuthData } from "../types/dashboard";
import { getAuthPayload, isAuthenticated } from "./authUtils";

export const fetchApi = async (url: string, additionalData: any = {}) => {
  if (!isAuthenticated()) {
    throw new Error("Not authenticated");
  }

  const authPayload = getAuthPayload();

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...authPayload, ...additionalData }),
    cache: "no-store",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed to ${url}`);
  }
  return response.json();
};

export const fetchWorklogs = async (
  startDate: Date | null,
  endDate: Date | null
) => {
  if (!startDate || !endDate) return null;
  return fetchApi("/api/worklogs", {
    startDate: format(startDate, "yyyy-MM-dd"),
    endDate: format(endDate, "yyyy-MM-dd"),
  });
};

export const fetchAnalytics = async (
  startDate: Date | null,
  endDate: Date | null
) => {
  if (!startDate || !endDate) return null;
  return fetchApi("/api/analytics", {
    dateRange: {
      start: format(startDate, "yyyy-MM-dd"),
      end: format(endDate, "yyyy-MM-dd"),
    },
  });
};

export const fetchProjects = async () => {
  return fetchApi("/api/projects");
};

export const fetchUserInfo = async () => {
  const data = await fetchApi("/api/user");
  return data.user;
};

export const fetchIssues = async () => {
  try {
    return await fetchApi("/api/issues");
  } catch (error) {
    console.error("Error fetching issues:", error);
    throw error;
  }
};

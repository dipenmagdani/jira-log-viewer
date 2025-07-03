import type { DashboardData } from "../types/dashboard";

export const getFilteredWorklogs = (
  dashboardData: DashboardData | null,
  searchTerm: string,
  selectedProject: string
) => {
  return (
    dashboardData?.worklogs.filter((worklog) => {
      const matchesSearch =
        worklog.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worklog.issueKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (worklog.comment &&
          worklog.comment.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesProject =
        selectedProject === "all" || worklog.project?.key === selectedProject;

      return matchesSearch && matchesProject;
    }) || []
  );
}; 
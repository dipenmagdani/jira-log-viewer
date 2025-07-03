"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Clock,
  FileText,
  TrendingUp,
  LogOut,
  User,
  RefreshCw,
  Calendar,
  AlertCircle,
  Search,
  Filter as FilterIcon,
  Loader2,
  Activity,
  FolderOpen,
  PieChart,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Building,
  ChevronDown,
} from "lucide-react";
import {
  subDays,
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  getDay,
  isToday,
  parseISO,
} from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";
// Add custom styles for date picker
import "../styles/calendar.css";
import "../globals.css";
import StatsCard from "./StatsCard";
import WorklogCard from "./WorklogCard";
import AddWorklogForm from "./AddWorklogForm";
// Import types from the new types file
import type {
  AuthData,
  JiraWorklog,
  DashboardData,
  AnalyticsData,
  ProjectData,
  DashboardProps,
  DateRangeCalendarProps,
  WorklogListProps,
} from "../types/dashboard";
// Temporary import for WorklogList (to be created)
import WorklogList from "./worklog/WorklogList";
import DateRangeCalendar from "./calendar/DateRangeCalendar";
import {
  fetchApi,
  fetchWorklogs,
  fetchAnalytics,
  fetchProjects,
  fetchUserInfo,
  fetchIssues,
} from "../utils/dashboardApi";
import { getFilteredWorklogs } from "../utils/dashboardUtils";
import DashboardHeader from "./dashboard/DashboardHeader";
import DashboardTabs from "./dashboard/DashboardTabs";

export default function Dashboard({ authData, onLogout }: DashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "overview" | "worklogs" | "analytics"
  >("overview");

  // Date range states
  const [startDate, setStartDate] = useState<Date | null>(
    subDays(new Date(), 7)
  );
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Data states
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [projectsData, setProjectsData] = useState<ProjectData | null>(null);
  const [issuesData, setIssuesData] = useState<any>(null); // You might want to type this properly
  const [userInfo, setUserInfo] = useState<any>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [advancedSearch, setAdvancedSearch] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedIssueType, setSelectedIssueType] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<string>("");
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("");
  const [selectedSortBy, setSelectedSortBy] = useState<string>("date_desc");

  // Calendar and worklog management states
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayWorklogs, setDayWorklogs] = useState<JiraWorklog[]>([]);
  const [showWorklogModal, setShowWorklogModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentWorklog, setCurrentWorklog] = useState<JiraWorklog | null>(
    null
  );
  const [worklogForm, setWorklogForm] = useState({
    issueKey: "",
    timeSpent: "",
    comment: "",
    started: new Date(),
  });

  useEffect(() => {
    if (startDate && endDate) {
      fetchAllData(true);
    }
  }, [startDate, endDate]);

  const fetchAllData = async (initial = false) => {
    if (initial) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError("");

    try {
      const [worklogs, analytics, projects, user, issues] = await Promise.all([
        fetchWorklogs(authData, startDate, endDate),
        fetchAnalytics(authData, startDate, endDate),
        fetchProjects(authData),
        fetchUserInfo(authData),
        fetchIssues(authData),
      ]);
      setDashboardData(worklogs);
      setAnalyticsData(analytics);
      setProjectsData(projects);
      setUserInfo(user);
      setIssuesData(issues);
    } catch (err) {
      setError("Failed to fetch data. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchAllData(false);
  };

  const handleQuickDateSelect = (days: number) => {
    const end = new Date();
    const start = subDays(end, days - 1);
    setStartDate(start);
    setEndDate(end);
  };

  const handleWorklogClick = (issueKey: string) => {
    router.push(`/worklog/${issueKey}`);
  };

  // Worklog management functions
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);

    // Filter worklogs for the selected date
    if (dashboardData?.worklogs) {
      const filtered = dashboardData.worklogs.filter((worklog) => {
        const worklogDate = new Date(worklog.started);
        return (
          worklogDate.getDate() === date.getDate() &&
          worklogDate.getMonth() === date.getMonth() &&
          worklogDate.getFullYear() === date.getFullYear()
        );
      });
      setDayWorklogs(filtered);

      // We no longer automatically open the modal when a date is clicked
      // This allows users to view worklog details directly in the calendar card
    }
  };

  const openAddWorklogModal = () => {
    setIsEditMode(false);
    setCurrentWorklog(null);
    setWorklogForm({
      issueKey: "",
      timeSpent: "",
      comment: "",
      started: selectedDate || new Date(),
    });
    setShowWorklogModal(true);
  };

  const openEditWorklogModal = (worklog: JiraWorklog) => {
    setIsEditMode(true);
    setCurrentWorklog(worklog);
    setWorklogForm({
      issueKey: worklog.issueKey,
      timeSpent: worklog.timeSpent,
      comment: worklog.comment || "",
      started: new Date(worklog.started),
    });
    setShowWorklogModal(true);
  };

  const submitWorklog = async (worklogData) => {
    if (!worklogData.issueKey || !worklogData.timeSpent) {
      // Show validation error
      setError("Issue key and time spent are required");
      toast.error("Issue key and time spent are required");
      return;
    }

    setIsRefreshing(true);
    setError("");

    try {
      // API endpoint would be different for add vs edit
      const endpoint = isEditMode ? "/api/update-worklog" : "/api/add-worklog";

      const response = await fetchApi(endpoint, {
        ...authData,
        worklog: {
          ...worklogData,
          id: currentWorklog?.id, // Only needed for edit mode
          issueKey: worklogData.issueKey.trim(),
          // Format the date according to JIRA's required format: yyyy-MM-dd'T'HH:mm:ss.SSSZ
          started:
            format(worklogData.started, "yyyy-MM-dd'T'HH:mm:ss.SSS") + "+0000",
        },
      });

      if (response.success) {
        // Show success toast message
        toast.success(
          isEditMode
            ? "Worklog updated successfully!"
            : "Worklog added successfully!"
        );

        // Explicitly close the modal - do this first before any other actions
        setShowWorklogModal(false);

        // Wait a moment before doing further processing
        setTimeout(() => {
          // Switch to overview tab after successful operation
          setActiveTab("overview");

          // Refresh data to show the new/updated worklog
          fetchAllData(false);

          // If a date was selected, update the day's worklogs but don't reopen the modal
          if (selectedDate) {
            // Update the day worklogs without reopening the modal
            const dateStr = format(selectedDate, "yyyy-MM-dd");
            if (dashboardData?.worklogs) {
              const filtered = dashboardData.worklogs.filter((worklog) => {
                const worklogDate = new Date(worklog.started);
                return (
                  worklogDate.getDate() === selectedDate.getDate() &&
                  worklogDate.getMonth() === selectedDate.getMonth() &&
                  worklogDate.getFullYear() === selectedDate.getFullYear()
                );
              });
              setDayWorklogs(filtered);
            }
          }
        }, 100);
      } else {
        setError(response.message || "Failed to save worklog");
        toast.error(response.message || "Failed to save worklog");
      }
    } catch (err) {
      console.error("Worklog submission error:", err);
      setError("Failed to save worklog. Please try again.");
      toast.error("Failed to save worklog. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const deleteWorklog = async (worklogId: string) => {
    if (!worklogId) return;

    if (!confirm("Are you sure you want to delete this worklog?")) {
      return;
    }

    setIsRefreshing(true);
    setError("");

    try {
      const response = await fetchApi("/api/delete-worklog", {
        ...authData,
        worklogId,
      });

      if (response.success) {
        // Show success message
        toast.success("Worklog deleted successfully!");

        // Refresh data to reflect the deletion
        fetchAllData(false);

        // Close the modal if it's open
        setShowWorklogModal(false);

        // Switch to overview tab after successful operation
        setActiveTab("overview");

        // If a date was selected, update the day's worklogs
        if (selectedDate) {
          handleDateClick(selectedDate);
        }
      } else {
        setError(response.message || "Failed to delete worklog");
        toast.error(response.message || "Failed to delete worklog");
      }
    } catch (err) {
      console.error("Worklog deletion error:", err);
      setError("Failed to delete worklog. Please try again.");
      toast.error("Failed to delete worklog. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAdvancedSearch = async () => {
    setSearchLoading(true);
    try {
      const response = await fetchApi("/api/search", {
        ...authData,
        query: searchTerm,
        projectKey: selectedProject !== "all" ? selectedProject : undefined,
        startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
        endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
        searchFields: ["issueKey", "summary", "comment", "description"],
        issueType: selectedIssueType || undefined,
        status: selectedStatus || undefined,
        priority: selectedPriority || undefined,
        timeRange: selectedTimeRange || undefined,
        sortBy: selectedSortBy || "date_desc",
      });

      if (response.worklogs) {
        // Update the dashboard data with the search results
        setDashboardData({
          ...dashboardData!,
          worklogs: response.worklogs,
        });
      } else {
        setError("No matching worklogs found");
      }
    } catch (err) {
      console.error("Advanced search error:", err);
      setError("Failed to perform search. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  };

  const filteredWorklogs = getFilteredWorklogs(dashboardData, searchTerm, selectedProject);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300 text-lg">
            Loading your JIRA workspace...
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Connecting to {authData.siteUrl}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <DashboardHeader
        userInfo={userInfo}
        authData={authData}
        onRefresh={handleRefresh}
        onLogout={onLogout}
        isRefreshing={isRefreshing}
      >
        <DashboardTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      </DashboardHeader>

      <div className="container mx-auto px-6 py-8">
        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-lg mb-6 flex items-center"
            >
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatsCard
                title="Total Hours"
                value={dashboardData?.summary.totalHours.toFixed(1) || "0"}
                subtitle="this period"
                icon={Clock}
                color="blue"
                isLoading={isRefreshing}
              />
              <StatsCard
                title="Worklogs"
                value={dashboardData?.summary.totalWorklogs || 0}
                subtitle="entries logged"
                icon={Activity}
                color="green"
                isLoading={isRefreshing}
              />
              <StatsCard
                title="Issues Worked"
                value={dashboardData?.summary.uniqueIssues || 0}
                subtitle="unique issues"
                icon={FileText}
                color="purple"
                isLoading={isRefreshing}
              />
              <StatsCard
                title="Projects"
                value={dashboardData?.summary.uniqueProjects || 0}
                subtitle="active projects"
                icon={FolderOpen}
                color="orange"
                isLoading={isRefreshing}
              />
            </div>

            {/* Date Range Picker */}
            <div className="glass-card p-6 mb-6 z-[9999] relative">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex flex-col space-y-2">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
                    Date Range
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-slate-400">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {startDate && endDate
                          ? `${format(startDate, "MMM dd")} - ${format(
                              endDate,
                              "MMM dd, yyyy"
                            )}`
                          : "Select date range"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col space-y-4">
                  {/* Date Range Selection */}
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <button
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className="flex items-center space-x-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl border border-slate-600/50 transition-all duration-200 text-sm font-medium"
                      >
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300">
                          {startDate && endDate
                            ? `${format(startDate, "MMM dd")} - ${format(
                                endDate,
                                "MMM dd"
                              )}`
                            : "Select dates"}
                        </span>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </button>

                      <AnimatePresence>
                        {showDatePicker && (
                          <>
                            {/* Backdrop to close date picker */}
                            <div
                              className="fixed inset-0"
                              onClick={() => setShowDatePicker(false)}
                            />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              transition={{ duration: 0.2, ease: "easeOut" }}
                              className="absolute top-full mt-2 right-0 bg-slate-800/95 backdrop-blur-md border border-slate-600/50 rounded-2xl shadow-2xl overflow-visible"
                            >
                              <DatePicker
                                selected={startDate}
                                onChange={(dates) => {
                                  const [start, end] = dates;
                                  setStartDate(start);
                                  setEndDate(end);
                                  // Close the picker when both dates are selected
                                  if (start && end) {
                                    setShowDatePicker(false);
                                  }
                                }}
                                startDate={startDate}
                                endDate={endDate}
                                selectsRange
                                inline
                                calendarClassName="react-datepicker--dark mx-auto custom-datepicker"
                                maxDate={new Date()}
                              />
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Quick Date Selections */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-500 font-medium mr-2">
                      Quick:
                    </span>
                    {[
                      { label: "Today", days: 1 },
                      { label: "7 Days", days: 7 },
                      { label: "30 Days", days: 30 },
                    ].map(({ label, days }) => (
                      <button
                        key={label}
                        onClick={() => {
                          const endDate = new Date();
                          const startDate = subDays(endDate, days - 1);
                          setStartDate(startDate);
                          setEndDate(endDate);
                          setShowDatePicker(false);
                        }}
                        className="px-3 py-1.5 text-xs bg-slate-700/50 hover:bg-slate-600/50 rounded-lg border border-slate-600/30 transition-all duration-200 text-slate-300 hover:text-white font-medium"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Calendar View */}
            <div className="glass-card p-6 mb-8">
              {/* Date Range Calendar */}
              <div className="mb-6">
                <DateRangeCalendar
                  worklogs={dashboardData?.worklogs || []}
                  onDateClick={handleDateClick}
                  selectedDate={selectedDate}
                  startDateRange={startDate}
                  endDateRange={endDate}
                  setSelectedDate={setSelectedDate}
                  setIsEditMode={setIsEditMode}
                  setCurrentWorklog={setCurrentWorklog}
                  setWorklogForm={setWorklogForm}
                  setShowWorklogModal={setShowWorklogModal}
                  setDayWorklogs={setDayWorklogs}
                />
              </div>

              {/* Selected Day Worklogs */}
              {selectedDate && (
                <div className="mt-6 border-t border-gray-700/50 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-white">
                      {format(selectedDate, "EEEE, MMMM d, yyyy")}
                    </h4>
                    <button
                      onClick={openAddWorklogModal}
                      className="btn-primary text-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Worklog
                    </button>
                  </div>

                  {dayWorklogs.length > 0 ? (
                    <div className="space-y-4">
                      {dayWorklogs.map((worklog) => (
                        <div
                          key={worklog.id}
                          className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-4 flex items-start justify-between hover:bg-gray-800/80 transition-colors group"
                        >
                          <div className="flex items-start space-x-3 flex-1">
                            {/* Project or Issue Icon */}
                            {worklog.project?.avatarUrls?.["24x24"] ? (
                              <img
                                src={worklog.project.avatarUrls["24x24"]}
                                alt={worklog.project.name}
                                className="w-10 h-10 rounded-md flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-md bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                <Clock className="w-5 h-5 text-blue-400" />
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-blue-400 font-medium">
                                  {worklog.issueKey}
                                </span>
                                <span className="text-gray-400 text-sm">
                                  {format(new Date(worklog.started), "h:mm a")}
                                </span>
                                <span className="bg-blue-500/20 text-blue-300 text-xs font-medium px-2 py-0.5 rounded-full">
                                  {worklog.timeSpent}
                                </span>
                              </div>

                              {worklog.project && (
                                <div className="flex items-center space-x-1 mb-2">
                                  <Building className="w-3 h-3 text-gray-500" />
                                  <span className="text-gray-500 text-xs">
                                    {worklog.project.name ||
                                      worklog.project.key}
                                  </span>
                                </div>
                              )}

                              <p className="text-white font-medium mb-1">
                                {worklog.summary}
                              </p>
                              {worklog.comment && (
                                <p className="text-gray-400 text-sm p-2 bg-gray-700/30 rounded-lg border-l-2 border-blue-500/50">
                                  {worklog.comment}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => openEditWorklogModal(worklog)}
                              className="p-2 text-blue-400 hover:text-white bg-blue-500/20 hover:bg-blue-500/40 rounded-lg transition-all duration-200 flex items-center space-x-1"
                              title="Edit worklog"
                            >
                              <Edit className="w-4 h-4" />
                              <span className="text-xs font-medium">Edit</span>
                            </button>
                            <button
                              onClick={() => deleteWorklog(worklog.id)}
                              className="p-2 text-red-400 hover:text-white bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-all duration-200"
                              title="Delete worklog"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-800/30 rounded-lg border border-gray-700/30">
                      <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">
                        No worklogs for {format(selectedDate, "MMMM d, yyyy")}
                      </p>
                      <button
                        onClick={openAddWorklogModal}
                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm inline-flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Worklog
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Recent Worklogs */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-blue-400" />
                  Recent Worklogs
                </h3>
                {isRefreshing && (
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                )}
              </div>
              {dashboardData?.worklogs?.length ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {dashboardData.worklogs.slice(0, 6).map((worklog, index) => (
                    <WorklogCard
                      key={worklog.id}
                      worklog={worklog}
                      index={index}
                      onClick={() => handleWorklogClick(worklog.issueKey)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">
                    No worklogs found for this period
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Try adjusting your date range or check your JIRA worklog
                    entries
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "worklogs" && (
          <div>
            {/* Search and Filter */}
            <div className="glass-card p-6 mb-6 ">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search worklogs by issue, summary, or comment..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleAdvancedSearch()
                        }
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="appearance-none bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 pr-8 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                      >
                        <option value="all">All Projects</option>
                        {projectsData?.projects.map((project) => (
                          <option key={project.key} value={project.key}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                      <FilterIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    </div>
                    <button
                      onClick={handleAdvancedSearch}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center"
                      disabled={searchLoading}
                    >
                      {searchLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4 mr-2" />
                      )}
                      Search
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setAdvancedSearch(!advancedSearch)}
                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                  >
                    {advancedSearch ? "Hide" : "Show"} Advanced Search Options
                  </button>

                  <button
                    onClick={openAddWorklogModal}
                    className="btn-primary text-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Worklog
                  </button>
                </div>

                {advancedSearch && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Issue Types
                      </label>
                      <select
                        className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm"
                        value={selectedIssueType}
                        onChange={(e) => setSelectedIssueType(e.target.value)}
                      >
                        <option value="">All Issue Types</option>
                        <option value="task">Task</option>
                        <option value="story">Story</option>
                        <option value="bug">Bug</option>
                        <option value="epic">Epic</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Status
                      </label>
                      <select
                        className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                      >
                        <option value="">All Statuses</option>
                        <option value="to_do">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Priority
                      </label>
                      <select
                        className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm"
                        value={selectedPriority}
                        onChange={(e) => setSelectedPriority(e.target.value)}
                      >
                        <option value="">All Priorities</option>
                        <option value="highest">Highest</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                        <option value="lowest">Lowest</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Time Spent
                      </label>
                      <div className="flex items-center space-x-2">
                        <select
                          className="flex-1 bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm"
                          value={selectedTimeRange}
                          onChange={(e) => setSelectedTimeRange(e.target.value)}
                        >
                          <option value="">Any Time</option>
                          <option value="lt_1h">Less than 1h</option>
                          <option value="1h_to_4h">1h to 4h</option>
                          <option value="4h_to_8h">4h to 8h</option>
                          <option value="gt_8h">More than 8h</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Sort By
                      </label>
                      <select
                        className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm"
                        value={selectedSortBy}
                        onChange={(e) => setSelectedSortBy(e.target.value)}
                      >
                        <option value="date_desc">Date (Newest First)</option>
                        <option value="date_asc">Date (Oldest First)</option>
                        <option value="time_desc">
                          Time Spent (Most First)
                        </option>
                        <option value="time_asc">
                          Time Spent (Least First)
                        </option>
                        <option value="issue_key">Issue Key</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={handleAdvancedSearch}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center w-full justify-center"
                        disabled={searchLoading}
                      >
                        {searchLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4 mr-2" />
                        )}
                        Apply Filters
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* All Worklogs */}
            <div className="glass-card p-6" >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-blue-400" />
                  All Worklogs
                  <span className="ml-2 text-sm text-gray-400">
                    ({`${filteredWorklogs.length} entries`})
                  </span>
                </h3>
                <div className="flex items-center space-x-4">
                  {isRefreshing && (
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                  )}
                </div>
              </div>
              {filteredWorklogs.length ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredWorklogs.map((worklog, index) => (
                    <div
                      key={worklog.id}
                      className="bg-gray-800/50 rounded-lg border border-gray-700/50 hover:bg-gray-700/50 transition-colors p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {worklog.project?.avatarUrls?.["24x24"] ? (
                            <img
                              src={worklog.project.avatarUrls["24x24"]}
                              alt={worklog.project.name || "Project"}
                              className="w-8 h-8 rounded-md"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-700 rounded-md flex items-center justify-center">
                              <FolderOpen className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div
                              className="text-blue-400 font-medium cursor-pointer hover:underline"
                              onClick={() =>
                                handleWorklogClick(worklog.issueKey)
                              }
                            >
                              {worklog.issueKey}
                            </div>
                            <div className="text-sm text-gray-400">
                              {worklog.project?.name || "Unknown project"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditWorklogModal(worklog)}
                            className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-full transition-colors"
                            title="Edit worklog"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteWorklog(worklog.id)}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                            title="Delete worklog"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-white font-medium mb-2">
                        {worklog.summary}
                      </h4>

                      {worklog.comment && (
                        <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                          {worklog.comment}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-4 text-sm">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center text-gray-400">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{worklog.timeSpent}</span>
                          </div>
                          <div className="flex items-center text-gray-400">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>
                              {format(new Date(worklog.started), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          {worklog.status && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                worklog.status.statusCategory.colorName ===
                                "green"
                                  ? "bg-green-500/20 text-green-300"
                                  : worklog.status.statusCategory.colorName ===
                                    "yellow"
                                  ? "bg-yellow-500/20 text-yellow-300"
                                  : "bg-blue-500/20 text-blue-300"
                              }`}
                            >
                              {worklog.status.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">
                    {searchTerm || selectedProject !== "all"
                      ? "No worklogs match your search criteria"
                      : "No worklogs found for this period"}
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    {searchTerm || selectedProject !== "all"
                      ? "Try adjusting your search terms or filters"
                      : "Try adjusting your date range or check your JIRA worklog entries"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div>
            {analyticsData ? (
              <>
                {/* Top Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <StatsCard
                    title="Total Hours"
                    value={analyticsData.analytics.worklogSummary.totalHours.toFixed(
                      1
                    )}
                    subtitle="logged in period"
                    icon={Clock}
                    color="blue"
                    isLoading={isRefreshing}
                  />
                  <StatsCard
                    title="Average Per Day"
                    value={
                      analyticsData.analytics.worklogSummary.averageHoursPerDay.toFixed(
                        1
                      ) + "h"
                    }
                    subtitle="daily productivity"
                    icon={TrendingUp}
                    color="green"
                    isLoading={isRefreshing}
                  />
                  <StatsCard
                    title="Projects"
                    value={
                      analyticsData.analytics.worklogSummary.uniqueProjects
                    }
                    subtitle="active projects"
                    icon={FolderOpen}
                    color="purple"
                    isLoading={isRefreshing}
                  />
                  <StatsCard
                    title="Issues"
                    value={analyticsData.analytics.worklogSummary.uniqueIssues}
                    subtitle="issues worked on"
                    icon={FileText}
                    color="orange"
                    isLoading={isRefreshing}
                  />
                </div>

                {/* Analytics Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Daily Hours Chart */}
                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-white flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                        Daily Hours Logged
                      </h3>
                    </div>
                    <div className="h-64">
                      {/* Chart would be rendered here with react-chartjs-2 */}
                      <div className="flex flex-col h-full">
                        <div className="flex-1 flex">
                          {Object.entries(
                            analyticsData.analytics.trends.dailyStats
                          ).map(([date, stats], i) => (
                            <div
                              key={date}
                              className="flex-1 flex flex-col justify-end px-1"
                            >
                              <div
                                className="bg-blue-500 hover:bg-blue-400 transition-all rounded-t-sm mx-auto w-full"
                                style={{
                                  height: `${Math.max(
                                    5,
                                    (stats.hours / 10) * 100
                                  )}%`,
                                  maxHeight: "95%",
                                }}
                              ></div>
                              <div className="text-xs text-gray-400 text-center mt-2">
                                {format(new Date(date), "MMM d")}
                              </div>
                              <div className="text-xs text-white text-center font-medium">
                                {stats.hours}h
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Project Distribution Chart */}
                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-white flex items-center">
                        <PieChart className="w-5 h-5 mr-2 text-purple-400" />
                        Project Distribution
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {analyticsData.analytics.distributions.projectTimeStats
                        .slice(0, 5)
                        .map((project, index) => (
                          <div
                            key={project.projectKey}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-2">
                              <div
                                className={`w-3 h-3 rounded-full ${
                                  [
                                    "bg-blue-500",
                                    "bg-green-500",
                                    "bg-purple-500",
                                    "bg-orange-500",
                                    "bg-red-500",
                                  ][index % 5]
                                }`}
                              ></div>
                              <span className="text-gray-300 text-sm">
                                {project.projectName}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-white font-semibold text-sm">
                                {project.totalHours}h
                              </div>
                              <div className="flex items-center">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    [
                                      "bg-blue-500",
                                      "bg-green-500",
                                      "bg-purple-500",
                                      "bg-orange-500",
                                      "bg-red-500",
                                    ][index % 5]
                                  }`}
                                  style={{
                                    width: `${project.percentage}%`,
                                    minWidth: "10px",
                                  }}
                                ></div>
                                <span className="text-gray-500 text-xs ml-2">
                                  {project.percentage}%
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Additional Analytics Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Productivity Insights */}
                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-white flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                        Productivity Insights
                      </h3>
                    </div>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-gray-400">
                            Most Productive Day
                          </span>
                          <p className="text-white text-lg font-semibold">
                            {analyticsData.analytics.trends.mostProductiveDay
                              .date
                              ? format(
                                  new Date(
                                    analyticsData.analytics.trends.mostProductiveDay.date
                                  ),
                                  "EEEE, MMM d"
                                )
                              : "N/A"}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-green-400 font-semibold text-xl">
                            {analyticsData.analytics.trends.mostProductiveDay.hours.toFixed(
                              1
                            )}
                            h
                          </span>
                          <p className="text-gray-400 text-sm">
                            {
                              analyticsData.analytics.trends.mostProductiveDay
                                .entries
                            }{" "}
                            entries
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-400 mb-2">
                          Daily Distribution
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {[
                            "Sun",
                            "Mon",
                            "Tue",
                            "Wed",
                            "Thu",
                            "Fri",
                            "Sat",
                          ].map((day, i) => {
                            const dayData = Object.entries(
                              analyticsData.analytics.trends.dailyStats
                            ).find(([date]) => new Date(date).getDay() === i);

                            const hours = dayData ? dayData[1].hours : 0;
                            const intensity = Math.min(100, (hours / 8) * 100);

                            return (
                              <div key={day} className="text-center">
                                <div
                                  className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${
                                    hours > 0
                                      ? `bg-gradient-to-br from-blue-500/40 to-blue-600/${intensity} border border-blue-500/${
                                          intensity * 0.7
                                        }`
                                      : "bg-gray-800/50 border border-gray-700/50"
                                  }`}
                                >
                                  <span className="text-sm font-medium text-white">
                                    {hours > 0 ? hours : "-"}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                  {day}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Issue Statistics */}
                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-white flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-blue-400" />
                        Issue Statistics
                      </h3>
                    </div>
                    <div className="space-y-6">
                      {/* Issue Status Distribution */}
                      <div>
                        <div className="text-gray-400 mb-2">
                          Issues by Status
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {Object.entries(
                            analyticsData.analytics.distributions
                              .issuesByStatus || {}
                          ).map(([status, count]) => (
                            <div
                              key={status}
                              className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 text-center"
                            >
                              <p className="text-xl font-semibold text-white">
                                {count}
                              </p>
                              <p className="text-gray-400 text-sm truncate">
                                {status}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Issue Priority Distribution */}
                      <div>
                        <div className="text-gray-400 mb-2">
                          Issues by Priority
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {Object.entries(
                            analyticsData.analytics.distributions
                              .issuesByPriority || {}
                          ).map(([priority, count]) => {
                            let colorClass = "text-yellow-400";
                            if (priority === "Highest")
                              colorClass = "text-red-400";
                            if (priority === "High")
                              colorClass = "text-orange-400";
                            if (priority === "Low")
                              colorClass = "text-green-400";
                            if (priority === "Lowest")
                              colorClass = "text-blue-400";

                            return (
                              <div
                                key={priority}
                                className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 text-center"
                              >
                                <p
                                  className={`text-xl font-semibold ${colorClass}`}
                                >
                                  {count}
                                </p>
                                <p className="text-gray-400 text-sm">
                                  {priority}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="glass-card p-6">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-blue-400" />
                  Analytics
                </h3>
                <p className="text-gray-400">
                  No analytics data available for the selected date range.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Add/Edit Worklog Modal */}
        <AnimatePresence>
          {showWorklogModal && (
            <AddWorklogForm
              authData={authData}
              onFormSubmit={submitWorklog}
              onFormCancel={() => setShowWorklogModal(false)}
              initialWorklog={currentWorklog}
              isEditMode={isEditMode}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

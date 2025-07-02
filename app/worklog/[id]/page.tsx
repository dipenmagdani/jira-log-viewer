"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  Calendar,
  User,
  Building,
  Tag,
  MessageSquare,
  ExternalLink,
  Loader2,
  AlertCircle,
  Timer,
} from "lucide-react";
import { format } from "date-fns";

interface WorklogDetailData {
  worklog: {
    id: string;
    key: string;
    issueKey: string;
    summary: string;
    description?: string;
    issueType?: {
      id: string;
      name: string;
      iconUrl: string;
      subtask: boolean;
    };
    priority?: {
      id: string;
      name: string;
      iconUrl: string;
    };
    status?: {
      id: string;
      name: string;
      statusCategory: {
        id: number;
        name: string;
        key: string;
        colorName: string;
      };
    };
    project?: {
      id: string;
      key: string;
      name: string;
      avatarUrls: {
        "48x48": string;
        "24x24": string;
        "16x16": string;
        "32x32": string;
      };
    };
    assignee?: {
      accountId: string;
      displayName: string;
      avatarUrls: {
        "48x48": string;
        "24x24": string;
        "16x16": string;
        "32x32": string;
      };
    };
    reporter?: {
      accountId: string;
      displayName: string;
      avatarUrls: {
        "48x48": string;
        "24x24": string;
        "16x16": string;
        "32x32": string;
      };
    };
    created: string;
    updated: string;
    duedate: string | null;
    fixVersions: any[];
    components: any[];
    labels: string[];
    timeTracking: {
      originalEstimate: string;
      remainingEstimate: string;
      timeSpent: string;
      originalEstimateSeconds: number;
      remainingEstimateSeconds: number;
      timeSpentSeconds: number;
    };
    subtasks: any[];
    parent?: {
      id: string;
      key: string;
      self: string;
      fields: {
        summary: string;
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
        priority: {
          self: string;
          iconUrl: string;
          name: string;
          id: string;
        };
        issuetype: {
          self: string;
          id: string;
          description: string;
          iconUrl: string;
          name: string;
          subtask: boolean;
          hierarchyLevel: number;
        };
      };
    };
    worklogCount: number;
    comment: string;
    timeSpent: string;
    timeSpentSeconds: number;
    started: string;
    author: {
      accountId: string;
      displayName: string;
      emailAddress: string;
      avatarUrls?: {
        "48x48": string;
        "24x24": string;
        "16x16": string;
        "32x32": string;
      };
    };
  };
}

const getStatusColor = (colorName: string) => {
  const colors: { [key: string]: string } = {
    "blue-gray": "bg-gray-500/20 text-gray-300 border-gray-500/30",
    yellow: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    green: "bg-green-500/20 text-green-300 border-green-500/30",
    brown: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    "warm-red": "bg-red-500/20 text-red-300 border-red-500/30",
    blue: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  };
  return colors[colorName] || colors["blue-gray"];
};

const getPriorityColor = (priority: string) => {
  const colors: { [key: string]: string } = {
    Highest: "text-red-400",
    High: "text-orange-400",
    Medium: "text-yellow-400",
    Low: "text-green-400",
    Lowest: "text-blue-400",
  };
  return colors[priority] || colors["Medium"];
};

export default function WorklogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [worklogData, setWorklogData] = useState<WorklogDetailData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const issueId = params.id as string;

  useEffect(() => {
    if (issueId) {
      fetchWorklogDetail();
    }
  }, [issueId]);

  const fetchWorklogDetail = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Get auth data from localStorage
      const authData = localStorage.getItem("jira-worklog-credentials");
      if (!authData) {
        router.push("/");
        return;
      }

      const parsedAuthData = JSON.parse(authData);

      const response = await fetch("/api/worklog-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...parsedAuthData,
          issueKey: issueId,
        }),
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.worklog) {
          setWorklogData(data);
        } else {
          setError("No worklog data available for this issue");
        }
      } else {
        const errorText = await response.text();
        console.error("API error:", errorText);
        setError(`Failed to fetch worklog details: ${response.status}`);
      }
    } catch (err) {
      console.error("Failed to fetch worklog detail:", err);
      setError("Failed to fetch worklog details");
    } finally {
      setIsLoading(false);
    }
  };

  const formatWorklogDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return {
          date: "Invalid date",
          time: "Invalid time",
          fullDate: "Invalid date and time",
        };
      }
      return {
        date: format(date, "MMMM dd, yyyy"),
        time: format(date, "h:mm a"),
        fullDate: format(date, "EEEE, MMMM d, yyyy 'at' h:mm a"),
      };
    } catch (error) {
      console.error("Error formatting date:", error);
      return {
        date: "Invalid date",
        time: "Invalid time",
        fullDate: "Invalid date and time",
      };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300 text-lg">Loading worklog details...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !worklogData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 text-lg mb-4">
            {error || "Worklog not found"}
          </p>
          <button onClick={() => router.back()} className="btn-primary">
            Go Back
          </button>
        </motion.div>
      </div>
    );
  }

  const worklog = worklogData?.worklog;
  const worklogDate = formatWorklogDate(worklog?.started || "");

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <header className="glass-card border-b border-gray-700/50 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.button
                onClick={() => router.back()}
                className="btn-ghost"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </motion.button>
              <div>
                <h1 className="text-2xl font-bold text-white">Issue Details</h1>
                <div className="flex items-center space-x-2">
                  <a
                    href={`${
                      worklog?.project?.key ? `${worklog?.project?.key}-` : ""
                    }${worklog?.issueKey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 flex items-center"
                  >
                    {worklog?.issueKey}
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                  {worklog?.parent && (
                    <div className="flex items-center text-gray-400">
                      <span className="mx-1">•</span>
                      <span className="text-sm">Child of</span>
                      <a
                        href={worklog?.parent?.key}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 ml-1 flex items-center"
                      >
                        {worklog?.parent?.key}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {worklog?.timeTracking?.originalEstimate && (
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-600/30">
                <Timer className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">Estimated/Spent</p>
                  <p className="text-sm text-white">
                    {worklog?.timeTracking?.originalEstimate} /{" "}
                    {worklog?.timeTracking?.timeSpent || "0h"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <motion.div
          className="max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {/* Main Issue Card */}
          <div className="glass-card p-8 mb-8">
            {/* Header Section */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start space-x-4 flex-1">
                {/* Project Avatar */}
                <div className="flex-shrink-0">
                  {worklog?.project?.avatarUrls?.["48x48"] ? (
                    <img
                      src={worklog?.project?.avatarUrls?.["48x48"]}
                      alt={worklog?.project?.name}
                      className="w-16 h-16 rounded-xl bg-gray-700 border border-gray-600"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center border border-blue-500/30">
                      <Building className="w-8 h-8 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Issue Key and Type */}
                  <div className="flex items-center space-x-3 mb-3 flex-wrap">
                    <div className="text-blue-400 hover:text-blue-300 font-bold text-xl flex items-center space-x-2 transition-colors">
                      <span>{worklog?.issueKey}</span>
                      <ExternalLink className="w-5 h-5" />
                    </div>

                    {worklog?.issueType && (
                      <div className="flex items-center space-x-2 px-3 py-1 bg-gray-700/50 rounded-lg border border-gray-600/30">
                        {worklog?.issueType?.iconUrl ? (
                          <img
                            src={worklog?.issueType?.iconUrl}
                            alt={worklog?.issueType?.name}
                            className="w-4 h-4"
                          />
                        ) : (
                          <Tag className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-sm text-gray-300 font-medium">
                          {worklog?.issueType?.name}
                          {worklog?.issueType?.subtask && " (Subtask)"}
                        </span>
                      </div>
                    )}

                    {/* Labels */}
                    {worklog?.labels && worklog.labels.length > 0 && (
                      <div className="flex items-center space-x-2 ml-auto">
                        {worklog.labels.map((label: string) => (
                          <span
                            key={label}
                            className="px-2 py-1 text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Issue Summary */}
                  <h2 className="text-2xl font-semibold text-white mb-4 leading-relaxed">
                    {worklog?.summary}
                  </h2>

                  {/* Status and Priority */}
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    {worklog?.status && (
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(
                          worklog?.status?.statusCategory?.colorName
                        )}`}
                      >
                        {worklog?.status?.name}
                      </span>
                    )}

                    {worklog?.priority && (
                      <div className="flex items-center space-x-2 px-4 py-2 bg-gray-700/50 rounded-lg border border-gray-600/30">
                        {worklog?.priority?.iconUrl ? (
                          <img
                            src={worklog?.priority?.iconUrl}
                            alt={worklog?.priority?.name}
                            className="w-4 h-4"
                          />
                        ) : (
                          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        )}
                        <span
                          className={`text-sm font-medium ${getPriorityColor(
                            worklog?.priority?.name
                          )}`}
                        >
                          {worklog?.priority?.name} Priority
                        </span>
                      </div>
                    )}

                    {/* Due Date */}
                    {worklog?.duedate && (
                      <div className="flex items-center space-x-2 px-4 py-2 bg-gray-700/50 rounded-lg border border-gray-600/30">
                        <Calendar className="w-4 h-4 text-red-400" />
                        <span className="text-sm text-gray-300">
                          Due:{" "}
                          {format(new Date(worklog.duedate), "MMM d, yyyy")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* People information */}
                  <div className="flex flex-wrap items-center gap-6 mb-4">
                    {/* Assignee */}
                    {worklog?.assignee && (
                      <div className="flex items-center space-x-2">
                        {worklog.assignee.avatarUrls?.["24x24"] ? (
                          <img
                            src={worklog.assignee.avatarUrls["24x24"]}
                            alt={worklog.assignee.displayName}
                            className="w-6 h-6 rounded-full border border-gray-600"
                          />
                        ) : (
                          <User className="w-4 h-4 text-gray-400" />
                        )}
                        <div>
                          <p className="text-xs text-gray-400">Assignee</p>
                          <p className="text-sm text-white">
                            {worklog.assignee.displayName}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Reporter */}
                    {worklog?.reporter && (
                      <div className="flex items-center space-x-2">
                        {worklog.reporter.avatarUrls?.["24x24"] ? (
                          <img
                            src={worklog.reporter.avatarUrls["24x24"]}
                            alt={worklog.reporter.displayName}
                            className="w-6 h-6 rounded-full border border-gray-600"
                          />
                        ) : (
                          <User className="w-4 h-4 text-gray-400" />
                        )}
                        <div>
                          <p className="text-xs text-gray-400">Reporter</p>
                          <p className="text-sm text-white">
                            {worklog.reporter.displayName}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Time Tracking - Highlighted */}
              <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl px-6 py-4 flex flex-col items-center min-w-[150px]">
                <Timer className="w-6 h-6 text-blue-400 mb-2" />
                <span className="text-blue-300 font-bold text-2xl">
                  {worklog?.timeSpent}
                </span>
                <span className="text-sm text-gray-400">logged</span>

                {worklog?.timeTracking?.originalEstimate && (
                  <div className="mt-2 pt-2 border-t border-blue-500/30 w-full">
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <span>Estimate:</span>
                      <span>{worklog?.timeTracking?.originalEstimate}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <span>Spent:</span>
                      <span>{worklog?.timeTracking?.timeSpent || "0h"}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <span>Remaining:</span>
                      <span>
                        {worklog?.timeTracking?.remainingEstimate || "0h"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {worklog?.description && (
              <div className="mb-6 p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-gray-400" />
                  Description
                </h3>
                <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {worklog?.description}
                </div>
              </div>
            )}

            {/* Worklog Comment */}
            {worklog?.comment && (
              <div className="mb-6 p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-blue-400" />
                  Worklog Comment
                </h3>
                <div className="text-gray-300 leading-relaxed">
                  {worklog?.comment}
                </div>
              </div>
            )}

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-6 border-t border-gray-700/50">
              {/* Work Date */}
              <div className="flex items-center space-x-3 p-3 bg-gray-700/40 rounded-lg border border-gray-600/30">
                <Calendar className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-xs text-gray-400">Work Date</p>
                  <p className="text-sm text-white font-semibold">
                    {worklogDate?.date}
                  </p>
                  <p className="text-xs text-gray-400">{worklogDate?.time}</p>
                </div>
              </div>

              {/* Project */}
              {worklog?.project && (
                <div className="flex items-center space-x-3 p-3 bg-gray-700/40 rounded-lg border border-gray-600/30">
                  <Building className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-xs text-gray-400">Project</p>
                    <p className="text-sm text-white font-semibold">
                      {worklog?.project?.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {worklog?.project?.key}
                    </p>
                  </div>
                </div>
              )}

              {/* Created Date */}
              <div className="flex items-center space-x-3 p-3 bg-gray-700/40 rounded-lg border border-gray-600/30">
                <Calendar className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-xs text-gray-400">Created</p>
                  <p className="text-sm text-white font-semibold">
                    {format(new Date(worklog?.created), "MMM d, yyyy")}
                  </p>
                  <p className="text-xs text-gray-400">
                    {format(new Date(worklog?.created), "h:mm a")}
                  </p>
                </div>
              </div>

              {/* Updated Date */}
              <div className="flex items-center space-x-3 p-3 bg-gray-700/40 rounded-lg border border-gray-600/30">
                <Calendar className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-xs text-gray-400">Updated</p>
                  <p className="text-sm text-white font-semibold">
                    {format(new Date(worklog?.updated), "MMM d, yyyy")}
                  </p>
                  <p className="text-xs text-gray-400">
                    {format(new Date(worklog?.updated), "h:mm a")}
                  </p>
                </div>
              </div>

              {/* Worklog Author */}
              <div className="flex items-center space-x-3 p-3 bg-gray-700/40 rounded-lg border border-gray-600/30">
                {worklog?.author?.avatarUrls?.["24x24"] ? (
                  <img
                    src={worklog?.author?.avatarUrls?.["24x24"]}
                    alt={worklog?.author?.displayName}
                    className="w-8 h-8 rounded-full border border-gray-600"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center border border-gray-600">
                    <User className="w-4 h-4 text-gray-300" />
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-400">Logged by</p>
                  <p className="text-sm text-white font-semibold">
                    {worklog?.author?.displayName}
                  </p>
                  <p className="text-xs text-gray-400 truncate max-w-[140px]">
                    {worklog?.author?.emailAddress}
                  </p>
                </div>
              </div>

              {/* Worklog Count */}
              <div className="flex items-center space-x-3 p-3 bg-gray-700/40 rounded-lg border border-gray-600/30">
                <Clock className="w-5 h-5 text-orange-400" />
                <div>
                  <p className="text-xs text-gray-400">Worklogs</p>
                  <p className="text-sm text-white font-semibold">
                    {worklog?.worklogCount || 0} entries
                  </p>
                  <p className="text-xs text-gray-400">
                    Total: {worklog?.timeTracking?.timeSpent || "0h"}
                  </p>
                </div>
              </div>
            </div>

            {/* Parent Info (if available) */}
            {worklog?.parent && (
              <div className="mt-6 pt-6 border-t border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Parent Issue
                </h3>
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {worklog.parent.fields.issuetype?.iconUrl && (
                        <img
                          src={worklog.parent.fields.issuetype.iconUrl}
                          alt={worklog.parent.fields.issuetype.name}
                          className="w-5 h-5"
                        />
                      )}
                      <div>
                        <a
                          href={worklog.parent.key}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          {worklog.parent.key}
                        </a>
                        <p className="text-white">
                          {worklog.parent.fields.summary}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          worklog.parent.fields.status?.statusCategory?.key ===
                          "done"
                            ? "bg-green-500/20 text-green-300"
                            : "bg-blue-500/20 text-blue-300"
                        }`}
                      >
                        {worklog.parent.fields.status?.name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Subtasks (if available) */}
            {worklog?.subtasks && worklog.subtasks.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Subtasks ({worklog.subtasks.length})
                </h3>
                <div className="space-y-2">
                  {worklog.subtasks.map((subtask: any) => (
                    <div
                      key={subtask.id}
                      className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {subtask.fields.issuetype?.iconUrl && (
                            <img
                              src={subtask.fields.issuetype.iconUrl}
                              alt={subtask.fields.issuetype.name}
                              className="w-5 h-5"
                            />
                          )}
                          <div>
                            <a
                              href={subtask.key}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300"
                            >
                              {subtask.key}
                            </a>
                            <p className="text-sm text-gray-300">
                              {subtask.fields.summary}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            subtask.fields.status?.statusCategory?.key ===
                            "done"
                              ? "bg-green-500/20 text-green-300"
                              : "bg-blue-500/20 text-blue-300"
                          }`}
                        >
                          {subtask.fields.status?.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

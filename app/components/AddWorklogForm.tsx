"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Search,
  Folder,
  File,
  ChevronsRight,
  Clock,
  Calendar,
  MessageSquare,
  Save,
  X,
  ChevronDown,
  Plus,
  Edit3,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/datepicker.css";
import toast from "react-hot-toast";
import CustomCombobox from "./CustomCombobox";

interface AuthData {
  siteUrl: string;
  email: string;
  apiToken: string;
}

interface JiraWorklog {
  id: string;
  issueKey: string;
  summary: string;
  timeSpent: string;
  timeSpentSeconds: number;
  comment: string;
  started: string;
}

interface Project {
  id: string;
  key: string;
  name: string;
  avatarUrls?: {
    "24x24": string;
  };
}

interface Issue {
  id: string;
  key: string;
  summary: string;
  subtasks?: Issue[];
  issueType?: {
    iconUrl: string;
    subtask?: boolean;
  };
}

const AddWorklogForm = ({
  authData,
  onFormSubmit,
  onFormCancel,
  initialWorklog,
  isEditMode,
}) => {
  const [worklogForm, setWorklogForm] = useState({
    issueKey: initialWorklog?.issueKey || "",
    timeSpent: initialWorklog?.timeSpent || "",
    comment: initialWorklog?.comment || "",
    started: initialWorklog ? new Date(initialWorklog.started) : new Date(),
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [subtasks, setSubtasks] = useState<Issue[]>([]);
  const [isLoadingSubtasks, setIsLoadingSubtasks] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);

  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoadingProjects(true);
      try {
        const response = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(authData),
        });
        const data = await response.json();
        setProjects(data.projects || []);
      } catch (error) {
        toast.error("Failed to load projects.");
      }
      setIsLoadingProjects(false);
    };
    fetchProjects();
  }, [authData]);

  const handleProjectChange = async (projectId) => {
    setSelectedProject(projectId);
    setSelectedIssue(null);
    setIssues([]);
    setSubtasks([]); // Clear subtasks when project changes
    if (projectId) {
      setIsLoadingIssues(true);
      try {
        const response = await fetch("/api/issues", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...authData,
            filters: { project: projectId },
          }),
        });
        const data = await response.json();
        setIssues(data.issues || []);
      } catch (error) {
        toast.error("Failed to load issues.");
      }
      setIsLoadingIssues(false);
    }
  };

  const handleIssueChange = (issueId) => {
    setSelectedIssue(issueId);
    const issue = issues.find((i) => i.id === issueId);

    // Check if the selected issue is a subtask
    const isSubtask = issue?.issueType?.subtask;

    // If it's a subtask, directly use it and don't load subtasks
    if (isSubtask) {
      setWorklogForm({ ...worklogForm, issueKey: issue?.key || "" });
      setSubtasks([]);
      return;
    }

    setWorklogForm({ ...worklogForm, issueKey: issue?.key || "" });

    // Fetch subtasks for the selected issue, only if it's not a subtask itself
    if (issueId && issue?.key) {
      setIsLoadingSubtasks(true);
      fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...authData,
          filters: { parent: issue.key },
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          setSubtasks(data.issues || []);
          setIsLoadingSubtasks(false);
        })
        .catch((error) => {
          toast.error("Failed to load subtasks.");
          setIsLoadingSubtasks(false);
        });
    } else {
      setSubtasks([]);
    }
  };

  const projectOptions = useMemo(
    () =>
      projects.map((p) => ({
        value: p.id,
        label: `${p.name} (${p.key})`,
        icon: p.avatarUrls?.["24x24"] ? (
          <img
            src={p.avatarUrls["24x24"]}
            alt={p.name}
            className="w-4 h-4 rounded-sm"
          />
        ) : (
          <Folder className="w-4 h-4 text-blue-400" />
        ),
      })),
    [projects]
  );

  const issueOptions = useMemo(
    () =>
      issues.map((i) => ({
        value: i.id,
        label: `${i.summary} (${i.key})`,
        icon: i.issueType?.iconUrl ? (
          <img src={i.issueType.iconUrl} alt={i.key} className="w-4 h-4" />
        ) : (
          <File className="w-4 h-4 text-green-400" />
        ),
      })),
    [issues]
  );

  const subtaskOptions = useMemo(() => {
    return subtasks.map((st) => ({
      value: st.key,
      label: `${st.summary} (${st.key})`,
      icon: st.issueType?.iconUrl ? (
        <img src={st.issueType.iconUrl} alt={st.key} className="w-4 h-4" />
      ) : (
        <ChevronsRight className="w-4 h-4 text-yellow-400" />
      ),
    }));
  }, [subtasks]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onFormSubmit(worklogForm);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onFormCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0.1 }}
        className="relative w-full max-w-2xl bg-slate-800/90 backdrop-blur-xl border border-slate-600/30 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-r from-slate-800/80 via-slate-700/40 to-slate-800/80 border-b border-slate-600/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                {isEditMode ? (
                  <Edit3 className="w-5 h-5 text-white" />
                ) : (
                  <Plus className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
                  {isEditMode ? "Edit Worklog" : "Add New Worklog"}
                </h2>
                <p className="text-sm text-slate-400">
                  {isEditMode ? "Update your time entry" : "Log your work time"}
                </p>
              </div>
            </div>
            <button
              onClick={onFormCancel}
              className="w-8 h-8 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/30 flex items-center justify-center transition-all duration-200 hover:scale-105 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {isEditMode ? (
            <div className="space-y-3">
              <label className="flex items-center space-x-2 text-sm font-medium text-slate-300">
                <File className="w-4 h-4 text-blue-400" />
                <span>Issue</span>
              </label>
              <div className="p-4 bg-slate-700/30 border border-slate-600/30 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <File className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="font-medium text-white">
                      {initialWorklog.issueKey}
                    </div>
                    <div className="text-sm text-slate-400">
                      {initialWorklog.summary}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <label className="flex items-center space-x-2 text-sm font-medium text-slate-300">
                  <Folder className="w-4 h-4 text-orange-400" />
                  <span>Project</span>
                </label>
                {isLoadingProjects ? (
                  <div className="flex items-center space-x-2 p-4 bg-slate-700/30 border border-slate-600/30 rounded-xl">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span className="text-slate-400">Loading projects...</span>
                  </div>
                ) : (
                  <div className="relative">
                    <CustomCombobox
                      options={projectOptions}
                      value={selectedProject}
                      onChange={handleProjectChange}
                      placeholder="Select a project"
                      searchPlaceholder="Search projects..."
                    />
                  </div>
                )}
              </div>

              {selectedProject && (
                <div className="space-y-3">
                  <label className="flex items-center space-x-2 text-sm font-medium text-slate-300">
                    <File className="w-4 h-4 text-blue-400" />
                    <span>Issue</span>
                  </label>
                  {isLoadingIssues ? (
                    <div className="flex items-center space-x-2 p-4 bg-slate-700/30 border border-slate-600/30 rounded-xl">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                      <span className="text-slate-400">Loading issues...</span>
                    </div>
                  ) : (
                    <div className="relative">
                      <CustomCombobox
                        options={issueOptions}
                        value={selectedIssue}
                        onChange={handleIssueChange}
                        placeholder="Select an issue"
                        searchPlaceholder="Search issues..."
                      />
                    </div>
                  )}
                </div>
              )}

              {subtasks.length > 0 && !isLoadingSubtasks && (
                <div className="space-y-3">
                  <label className="flex items-center space-x-2 text-sm font-medium text-slate-300">
                    <ChevronsRight className="w-4 h-4 text-yellow-400" />
                    <span>Sub-task</span>
                  </label>
                  <div className="relative">
                    <CustomCombobox
                      options={subtaskOptions}
                      value={worklogForm.issueKey}
                      onChange={(value) =>
                        setWorklogForm({ ...worklogForm, issueKey: value })
                      }
                      placeholder="Select a sub-task"
                      searchPlaceholder="Search sub-tasks..."
                    />
                  </div>
                </div>
              )}

              {isLoadingSubtasks && (
                <div className="space-y-3">
                  <label className="flex items-center space-x-2 text-sm font-medium text-slate-300">
                    <ChevronsRight className="w-4 h-4 text-yellow-400" />
                    <span>Sub-task</span>
                  </label>
                  <div className="flex items-center space-x-2 p-4 bg-slate-700/30 border border-slate-600/30 rounded-xl">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span className="text-slate-400">Loading sub-tasks...</span>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="flex items-center space-x-2 text-sm font-medium text-slate-300">
                <Clock className="w-4 h-4 text-green-400" />
                <span>Time Spent</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={worklogForm.timeSpent}
                  onChange={(e) =>
                    setWorklogForm({
                      ...worklogForm,
                      timeSpent: e.target.value,
                    })
                  }
                  className="w-full bg-slate-700/30 border border-slate-600/30 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  placeholder="e.g., 1h 30m, 2h, 45m"
                />
              </div>
              <p className="text-xs text-slate-500">
                Use formats like: 1h 30m, 2h, 45m, 1.5h
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-2 text-sm font-medium text-slate-300">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span>Date & Time</span>
              </label>
              <div className="relative">
                <DatePicker
                  selected={worklogForm.started}
                  onChange={(date: Date) =>
                    setWorklogForm({ ...worklogForm, started: date })
                  }
                  className="w-full bg-slate-700/30 border border-slate-600/30 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                  dateFormat="MMMM d, yyyy h:mm aa"
                  showTimeSelect
                  popperPlacement="bottom-start"
                  maxDate={new Date()}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center space-x-2 text-sm font-medium text-slate-300">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span>Comment</span>
            </label>
            <div className="relative">
              <textarea
                value={worklogForm.comment}
                onChange={(e) =>
                  setWorklogForm({ ...worklogForm, comment: e.target.value })
                }
                className="w-full bg-slate-700/30 border border-slate-600/30 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 resize-none"
                rows={4}
                placeholder="Describe what you worked on..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-600/30">
            <button
              type="button"
              onClick={onFormCancel}
              className="px-6 py-3 text-sm font-medium text-slate-300 bg-slate-700/30 hover:bg-slate-600/50 rounded-xl border border-slate-600/30 transition-all duration-200 hover:scale-105 flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              disabled={!worklogForm.issueKey || !worklogForm.timeSpent}
              className={`px-8 py-3 text-sm font-medium rounded-xl transition-all duration-200 flex items-center space-x-2 ${
                !worklogForm.issueKey || !worklogForm.timeSpent
                  ? "bg-slate-600/50 text-slate-400 cursor-not-allowed"
                  : isEditMode
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg hover:shadow-blue-500/30 hover:scale-105"
                  : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg hover:shadow-green-500/30 hover:scale-105"
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{isEditMode ? "Update Worklog" : "Save Worklog"}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default AddWorklogForm;

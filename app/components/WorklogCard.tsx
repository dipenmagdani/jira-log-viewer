"use client";

import { motion } from "framer-motion";
import {
  Clock,
  MessageSquare,
  ExternalLink,
  Calendar,
  User,
  Tag,
  Timer,
  Building,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

interface WorklogCardProps {
  worklog: {
    id: string;
    issueKey: string;
    summary: string;
    issueType?: {
      name: string;
      iconUrl: string;
    };
    priority?: {
      name: string;
      iconUrl: string;
    };
    status?: {
      name: string;
      statusCategory: {
        name: string;
        colorName: string;
      };
    };
    project?: {
      key: string;
      name: string;
      avatarUrls?: {
        "24x24": string;
      };
    };
    timeSpent: string;
    timeSpentSeconds: number;
    comment: string;
    created: string;
    started: string;
    author: {
      displayName: string;
      emailAddress: string;
      avatarUrls?: {
        "24x24": string;
      };
    };
  };
  index?: number;
  onClick?: () => void;
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

const getPriorityBgColor = (priority: string) => {
  const colors: { [key: string]: string } = {
    Highest: "bg-red-400",
    High: "bg-orange-400",
    Medium: "bg-yellow-400",
    Low: "bg-green-400",
    Lowest: "bg-blue-400",
  };
  return colors[priority] || colors["Medium"];
};

export default function WorklogCard({
  worklog,
  index = 0,
  onClick,
}: WorklogCardProps) {
  // Minimal animations - faster and less distracting
  const cardVariants = {
    hidden: { opacity: 0, y: 5 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.15,
        delay: index * 0.02,
      },
    },
    hover: {
      y: -1,
      transition: { duration: 0.1 },
    },
  };

  const formatWorklogDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: format(date, "MMM d"),
      time: format(date, "h:mm a"),
      fullDate: format(date, "EEEE, MMMM d, yyyy"),
    };
  };

  const worklogDate = formatWorklogDate(worklog.started);

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onClick={onClick}
      className={`
        bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 
        rounded-xl p-6 group transition-all duration-150
        hover:border-blue-500/30 hover:bg-gray-800/70
        ${onClick ? "cursor-pointer" : ""}
      `}
    >
      {/* Header - Key Information Highlighted */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1">
          {/* Project Avatar - Highlighted */}
          <div className="flex-shrink-0">
            {worklog.project?.avatarUrls?.["24x24"] ? (
              <motion.img
                src={worklog.project.avatarUrls["24x24"]}
                alt={worklog.project.name}
                className="w-10 h-10 rounded-lg bg-gray-700 border border-gray-600"
                whileHover={{ scale: 1.05 }}
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center border border-blue-500/30">
                <Building className="w-5 h-5 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Issue Key and Type - Highlighted */}
            <div className="flex items-center space-x-2 mb-2">
              <motion.div
                className="text-blue-400 hover:text-blue-300 font-semibold text-sm flex items-center space-x-1 transition-colors"
                whileHover={{ scale: 1.02 }}
              >
                <span>{worklog.issueKey}</span>
                <ExternalLink className="w-3 h-3" />
              </motion.div>

              {/* Issue Type */}
              {worklog.issueType && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-gray-700/50 rounded-md border border-gray-600/30">
                  {worklog.issueType.iconUrl ? (
                    <img
                      src={worklog.issueType.iconUrl}
                      alt={worklog.issueType.name}
                      className="w-3 h-3"
                    />
                  ) : (
                    <Tag className="w-3 h-3 text-gray-400" />
                  )}
                  <span className="text-xs text-gray-300 font-medium">
                    {worklog.issueType.name}
                  </span>
                </div>
              )}
            </div>

            {/* Issue Summary */}
            <h3 className="text-white font-medium mb-3 line-clamp-2 group-hover:text-blue-100 transition-colors leading-relaxed">
              {worklog.summary}
            </h3>

            {/* Status and Priority */}
            <div className="flex items-center space-x-3 mb-3">
              {/* Status */}
              {worklog.status && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                    worklog.status.statusCategory.colorName
                  )}`}
                >
                  {worklog.status.name}
                </span>
              )}

              {/* Priority */}
              {worklog.priority && (
                <div className="flex items-center space-x-1">
                  {worklog.priority.iconUrl ? (
                    <img
                      src={worklog.priority.iconUrl}
                      alt={worklog.priority.name}
                      className="w-4 h-4"
                    />
                  ) : (
                    <div
                      className={`w-2 h-2 rounded-full ${getPriorityBgColor(
                        worklog.priority.name
                      )}`}
                    ></div>
                  )}
                  <span
                    className={`text-xs font-medium ${getPriorityColor(
                      worklog.priority.name
                    )}`}
                  >
                    {worklog.priority.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Time Spent - Highlighted */}
        <motion.div
          className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-lg px-4 py-3 flex flex-col items-center min-w-[80px]"
          whileHover={{ scale: 1.02 }}
        >
          <Timer className="w-4 h-4 text-blue-400 mb-1" />
          <span className="text-blue-300 font-bold text-sm">
            {worklog.timeSpent}
          </span>
          <span className="text-xs text-gray-400">logged</span>
        </motion.div>
      </div>

      {/* Comment */}
      {worklog.comment && (
        <div className="mb-4 p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
          <div className="flex items-start space-x-2">
            <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-300 leading-relaxed">
              {worklog.comment}
            </p>
          </div>
        </div>
      )}

      {/* Footer - Date/Time and Author Highlighted */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
        {/* Date and Time - Highlighted */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-2 bg-gray-700/40 rounded-lg border border-gray-600/30">
            <Calendar className="w-4 h-4 text-blue-400" />
            <div className="text-left">
              <p className="text-sm font-semibold text-white">
                {worklogDate.date}
              </p>
              <p className="text-xs text-gray-400">{worklogDate.time}</p>
            </div>
          </div>

          {/* Project Name - Highlighted */}
          {worklog.project && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-700/40 rounded-lg border border-gray-600/30">
              <Building className="w-4 h-4 text-green-400" />
              <div className="text-left">
                <p className="text-xs text-gray-400">Project</p>
                <p className="text-sm font-semibold text-white">
                  {worklog.project.key}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Author - Highlighted */}
        <div className="flex items-center space-x-3 px-3 py-2 bg-gray-700/40 rounded-lg border border-gray-600/30">
          {worklog.author.avatarUrls?.["24x24"] ? (
            <motion.img
              src={worklog.author.avatarUrls["24x24"]}
              alt={worklog.author.displayName}
              className="w-6 h-6 rounded-full border border-gray-600"
              whileHover={{ scale: 1.1 }}
            />
          ) : (
            <div className="w-6 h-6 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center border border-gray-600">
              <User className="w-3 h-3 text-gray-300" />
            </div>
          )}
          <div className="text-left">
            <p className="text-xs text-gray-400">Author</p>
            <p className="text-sm font-semibold text-white truncate max-w-24">
              {worklog.author.displayName}
            </p>
          </div>
        </div>
      </div>

      {/* Hover indicator */}
      {onClick && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
        </div>
      )}
    </motion.div>
  );
}

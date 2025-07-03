import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday } from "date-fns";
import { Plus, Edit, CheckCircle } from "lucide-react";
import type { DateRangeCalendarProps, JiraWorklog } from "../../types/dashboard";
import WorklogList from "../worklog/WorklogList";

const DateRangeCalendar = ({
  worklogs,
  onDateClick,
  selectedDate,
  startDateRange,
  endDateRange,
  setSelectedDate,
  setIsEditMode,
  setCurrentWorklog,
  setWorklogForm,
  setShowWorklogModal,
  setDayWorklogs,
}: DateRangeCalendarProps) => {
  // State for showing worklog list modal
  const [showWorklogList, setShowWorklogList] = useState(false);
  const [selectedDateWorklogs, setSelectedDateWorklogs] = useState<JiraWorklog[]>([]);

  // If we don't have a date range, use the current month
  const defaultDate = new Date();
  const effectiveStartDate = startDateRange || startOfMonth(defaultDate);
  const effectiveEndDate = endDateRange || endOfMonth(defaultDate);

  // Get all days in the selected range
  const daysInRange = eachDayOfInterval({
    start: effectiveStartDate,
    end: effectiveEndDate,
  });

  // Group worklogs by date
  const worklogsByDate: Record<string, JiraWorklog[]> = {};
  worklogs.forEach((worklog) => {
    const date = format(new Date(worklog.started), "yyyy-MM-dd");
    if (!worklogsByDate[date]) {
      worklogsByDate[date] = [];
    }
    worklogsByDate[date].push(worklog);
  });

  // Get hours logged for a specific day
  const getHoursForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    if (!worklogsByDate[dateStr]) return 0;

    return worklogsByDate[dateStr].reduce((total, worklog) => {
      return total + worklog.timeSpentSeconds / 3600;
    }, 0);
  };

  // Get projects for a specific day
  const getProjectsForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    if (!worklogsByDate[dateStr]) return [];

    const projectsMap = new Map();
    worklogsByDate[dateStr].forEach((worklog) => {
      if (worklog.project?.key) {
        if (!projectsMap.has(worklog.project.key)) {
          projectsMap.set(worklog.project.key, {
            key: worklog.project.key,
            name: worklog.project.name || worklog.project.key,
            avatarUrl: worklog.project?.avatarUrls?.["24x24"] || "",
            count: 1,
            hours: worklog.timeSpentSeconds / 3600,
          });
        } else {
          const existing = projectsMap.get(worklog.project.key);
          existing.count++;
          existing.hours += worklog.timeSpentSeconds / 3600;
          projectsMap.set(worklog.project.key, existing);
        }
      }
    });

    return Array.from(projectsMap.values());
  };

  // Handle clicking on a date
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dateStr = format(date, "yyyy-MM-dd");
    const dayWorklogs = worklogsByDate[dateStr] || [];
    setDayWorklogs(dayWorklogs);

    // Always show the worklog list modal if there are any worklogs (even if just one)
    if (dayWorklogs.length > 0) {
      setSelectedDateWorklogs(dayWorklogs);
      setShowWorklogList(true);
    } else {
      // If no worklogs, just show the date selection
      onDateClick(date);
    }
  };

  // Handle editing a specific worklog
  const handleEditWorklog = (worklog: JiraWorklog) => {
    setIsEditMode(true);
    setCurrentWorklog(worklog);
    setWorklogForm({
      issueKey: worklog.issueKey,
      timeSpent: worklog.timeSpent,
      comment: worklog.comment || "",
      started: new Date(worklog.started),
    });
    setShowWorklogModal(true);
    setShowWorklogList(false);
  };

  // Handle adding a new worklog for a specific date
  const handleAddWorklog = (date: Date) => {
    setSelectedDate(date);
    setIsEditMode(false);
    setCurrentWorklog(null);
    setWorklogForm({
      issueKey: "",
      timeSpent: "",
      comment: "",
      started: date,
    });
    setShowWorklogModal(true);
    setShowWorklogList(false);
  };

  // Organize days into weeks for proper display
  const weeks = [];
  let currentWeek = [];

  // Start with the correct day of week
  const firstDayOfWeek = getDay(daysInRange[0]);
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push(null); // Empty cell for days before the start date
  }

  // Add all days in the range
  daysInRange.forEach((day, index) => {
    currentWeek.push(day);

    // If we reached the end of a week or the end of the range
    if (getDay(day) === 6 || index === daysInRange.length - 1) {
      // Fill in any remaining days in the week
      if (getDay(day) !== 6) {
        for (let i = getDay(day) + 1; i <= 6; i++) {
          currentWeek.push(null); // Empty cell for days after the end date
        }
      }

      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  return (
    <>
      <div className="calendar-container page-transition">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8 p-6 rounded-2xl bg-gradient-to-r from-slate-800/60 via-slate-700/40 to-slate-800/60 backdrop-blur-sm border border-slate-600/30 shadow-xl">
          <div className="flex flex-col space-y-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
              Worklog Calendar
            </h2>
            <div className="flex items-center space-x-4 text-sm text-slate-400">
              <div className="flex items-center space-x-2">
                <span className="sr-only">Calendar Icon</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4m-5 4h18"/></svg>
                <span>{daysInRange.length} days</span>
              </div>
              <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
              <div className="flex items-center space-x-2">
                <span className="sr-only">Activity Icon</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12h3l3 8 4-16 3 8h4"/></svg>
                <span>{Object.keys(worklogsByDate).length} active days</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-500 bg-slate-700/50 px-3 py-2 rounded-lg border border-slate-600/30">
            Click any day to view or manage worklogs
          </div>
        </div>
        <div className="grid grid-cols-7 gap-3 mb-6">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
            <div
              key={day}
              className={`text-center py-4 text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                index === 0 || index === 6
                  ? "text-orange-400/80"
                  : "text-slate-300/90"
              } hover:text-white hover:scale-105`}
            >
              {day}
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {weeks.map((week, weekIndex) => (
            <motion.div
              key={`week-${weekIndex}`}
              className="grid grid-cols-7 gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: weekIndex * 0.1,
                ease: "easeOut",
              }}
            >
              {week.map((day, dayIndex) => {
                if (day === null) {
                  return (
                    <div
                      key={`empty-${weekIndex}-${dayIndex}`}
                      className="aspect-square"
                    >
                      <div className="h-full rounded-2xl bg-gradient-to-br from-slate-800/20 via-slate-700/10 to-slate-800/20 border border-slate-700/20 opacity-40"></div>
                    </div>
                  );
                }
                const dateStr = format(day, "yyyy-MM-dd");
                const dayWorklogs = worklogsByDate[dateStr] || [];
                const hoursLogged = getHoursForDay(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);
                const isWeekend = getDay(day) === 0 || getDay(day) === 6;

                // Determine color based on hours logged
                let bgColor, borderColor, textColor, intensityClass;
                if (hoursLogged === 0) {
                  bgColor = isWeekend ? "bg-gray-800/20" : "bg-gray-800/40";
                  borderColor = "border-gray-700/30";
                  textColor = "text-gray-400";
                  intensityClass = "";
                } else if (hoursLogged < 8) {
                  bgColor = "bg-amber-500/20";
                  borderColor = "border-amber-500/40";
                  textColor = "text-amber-300";
                  intensityClass = "bg-amber-500/10";
                } else {
                  bgColor = "bg-green-500/20";
                  borderColor = "border-green-500/40";
                  textColor = "text-green-300";
                  intensityClass = "bg-green-500/10";
                }
                if (isSelected) {
                  bgColor = "bg-blue-600/30";
                  borderColor = "border-blue-500/60";
                  textColor = "text-white";
                  intensityClass = "bg-blue-500/20";
                }

                return (
                  <div key={dateStr} className="h-32 sm:h-36 lg:h-40">
                    <div
                      className={`h-full rounded-2xl transition-all duration-500 ease-out overflow-hidden relative group cursor-pointer transform-gpu ${
                        isSelected
                          ? "ring-2 ring-blue-400/60 shadow-xl shadow-blue-500/30 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-cyan-500/10 border border-blue-400/40 scale-[1.02]"
                          : "hover:shadow-2xl hover:shadow-black/30 hover:-translate-y-2 hover:scale-[1.01] bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 backdrop-blur-sm hover:from-slate-700/50 hover:via-slate-600/40 hover:to-slate-700/50"
                      } ${
                        isTodayDate
                          ? "border-2 border-gradient-to-r from-blue-400 to-purple-400 shadow-lg shadow-blue-500/25"
                          : "border border-slate-600/30 hover:border-slate-500/50"
                      }`}
                      onClick={() => handleDateClick(day)}
                    >
                      {/* Animated background overlay */}
                      <div
                        className={`absolute inset-0 rounded-2xl transition-all duration-700 ${
                          isSelected
                            ? "bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-cyan-600/20"
                            : "bg-gradient-to-br from-transparent via-white/[0.02] to-transparent group-hover:from-white/[0.05] group-hover:via-white/[0.03] group-hover:to-white/[0.05]"
                        }`}
                      />
                      {/* Header Section */}
                      <div className="relative z-10 p-3 pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col">
                            <div className="flex flex-col items-start">
                              <span
                                className={`text-lg font-bold transition-all duration-300 ${
                                  isTodayDate
                                    ? "text-white bg-gradient-to-r from-blue-500 to-purple-500 px-3 py-1.5 rounded-xl text-sm shadow-lg shadow-blue-500/30 border border-blue-400/30"
                                    : hoursLogged === 0
                                    ? "text-slate-400 group-hover:text-slate-300"
                                    : hoursLogged >= 8
                                    ? "text-emerald-400 group-hover:text-emerald-300"
                                    : "text-amber-400 group-hover:text-amber-300"
                                }`}
                              >
                                {format(day, "d")}
                              </span>
                              <span
                                className={`text-xs font-medium transition-all duration-300 ${
                                  isTodayDate
                                    ? "text-blue-300"
                                    : "text-slate-500 group-hover:text-slate-400"
                                }`}
                              >
                                {format(day, "MMM")}
                              </span>
                            </div>
                            {isTodayDate && (
                              <span className="text-xs text-blue-400 font-medium mt-1 bg-blue-500/20 px-2 py-0.5 rounded-lg border border-blue-500/30">
                                Today
                              </span>
                            )}
                          </div>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleAddWorklog(day);
                            }}
                            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-400 hover:from-blue-500/30 hover:to-purple-500/30 hover:text-white hover:scale-110 opacity-0 group-hover:opacity-100 border border-blue-500/20 hover:border-blue-400/40 shadow-lg hover:shadow-blue-500/30"
                            title="Add worklog"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        {/* Enhanced hours indicator */}
                        {hoursLogged > 0 && (
                          <div className="mt-3 mb-2">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`text-sm font-bold px-2 py-1 rounded-lg border transition-all duration-300 ${
                                    hoursLogged >= 8
                                      ? "text-emerald-300 bg-emerald-500/20 border-emerald-500/30 shadow-lg shadow-emerald-500/20"
                                      : "text-amber-300 bg-amber-500/20 border-amber-500/30 shadow-lg shadow-amber-500/20"
                                  }`}
                                >
                                  {hoursLogged.toFixed(1)}h
                                </span>
                                {hoursLogged >= 8 && (
                                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                                )}
                              </div>
                              <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded-lg border border-slate-600/30">
                                {dayWorklogs.length} {dayWorklogs.length === 1 ? "log" : "logs"}
                              </span>
                            </div>
                            {/* Enhanced progress bar */}
                            <div className="relative">
                              <div className="w-full bg-slate-800/60 rounded-full h-2 shadow-inner border border-slate-700/50">
                                <div
                                  className={`h-2 rounded-full transition-all duration-700 ease-out relative overflow-hidden ${
                                    hoursLogged >= 8
                                      ? "bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-400 shadow-lg shadow-emerald-500/40"
                                      : "bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 shadow-lg shadow-amber-500/40"
                                  }`}
                                  style={{
                                    width: `${Math.min((hoursLogged / 8) * 100, 100)}%`,
                                  }}
                                >
                                  {/* Animated shimmer effect */}
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform translate-x-[-100%] animate-shimmer" />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
            
                      {/* Enhanced gradient overlay with shimmer */}
                      <div
                        className={`absolute inset-0 rounded-2xl pointer-events-none transition-all duration-500 ${
                          hoursLogged >= 8
                            ? "bg-gradient-to-br from-emerald-500/5 via-green-500/3 to-emerald-600/5"
                            : hoursLogged > 0
                            ? "bg-gradient-to-br from-amber-500/5 via-yellow-500/3 to-amber-600/5"
                            : ""
                        }`}
                      />
                      {/* Hover shimmer effect */}
                      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-white/[0.03] via-transparent to-white/[0.02]" />
                    </div>
                  </div>
                );
              })}
            </motion.div>
          ))}
        </div>
      </div>
      <AnimatePresence>
        {showWorklogList && (
          <WorklogList
            worklogs={selectedDateWorklogs}
            onEditClick={handleEditWorklog}
            onAddNewClick={() => handleAddWorklog(selectedDate!)}
            onClose={() => setShowWorklogList(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default DateRangeCalendar; 
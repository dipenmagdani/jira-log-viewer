import { motion } from "framer-motion";
import { format } from "date-fns";
import { Plus, Edit, Building } from "lucide-react";
import type { WorklogListProps, JiraWorklog } from "../../types/dashboard";

const WorklogList = ({
  worklogs,
  onEditClick,
  onAddNewClick,
  onClose,
}: WorklogListProps) => {
  return (
    <motion.div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-gradient-to-br from-slate-800/95 via-slate-700/95 to-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-hidden"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-white text-xl font-bold mb-1">
              Worklogs for{" "}
              {worklogs.length > 0
                ? format(new Date(worklogs[0].started), "EEEE, MMMM d, yyyy")
                : "Selected Date"}
            </h3>
            <p className="text-slate-400 text-sm">
              {worklogs.length} {worklogs.length === 1 ? "entry" : "entries"}{" "}
              found
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-600/50 rounded-xl w-10 h-10 flex items-center justify-center transition-all duration-200 hover:scale-105"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto mb-6 custom-scrollbar">
          {worklogs.map((worklog) => (
            <div
              key={worklog.id}
              className="border border-slate-600/30 rounded-xl p-5 bg-gradient-to-r from-slate-800/60 to-slate-700/40 hover:from-slate-700/60 hover:to-slate-600/40 transition-all duration-300 hover:border-slate-500/50 hover:shadow-lg group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-3">
                    {worklog.project?.avatarUrls?.["24x24"] && (
                      <img
                        src={worklog.project.avatarUrls["24x24"]}
                        alt={worklog.project?.name || ""}
                        className="w-8 h-8 rounded-lg shadow-lg border border-slate-600/50 flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-blue-400 font-bold text-lg">
                        {worklog.issueKey}
                      </span>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-slate-300 bg-slate-700/50 px-3 py-1 rounded-lg text-sm font-medium border border-slate-600/30">
                          {worklog.timeSpent}
                        </span>
                        <span className="text-slate-400 text-sm">
                          {format(new Date(worklog.started), "h:mm a")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {worklog.project && (
                    <div className="flex items-center space-x-2 mb-3 text-slate-400">
                      <Building className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm truncate">
                        {worklog.project.name || worklog.project.key}
                      </span>
                    </div>
                  )}

                  <div className="text-white font-medium mb-3 leading-relaxed">
                    {worklog.summary}
                  </div>
                </div>
              </div>

              {worklog.comment && (
                <div className="mb-4 p-4 bg-slate-700/40 rounded-xl border-l-4 border-blue-500/60">
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {worklog.comment}
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => onEditClick(worklog)}
                  className="flex items-center space-x-2 text-sm bg-gradient-to-r from-blue-600/80 to-blue-500/80 hover:from-blue-600 hover:to-blue-500 text-white px-4 py-2.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/30 hover:scale-105 border border-blue-500/30"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Worklog</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-slate-600/30">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl text-white font-medium transition-all duration-200 border border-slate-600/30"
          >
            Close
          </button>
          <button
            onClick={onAddNewClick}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl text-white font-medium flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-blue-500/30 hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            <span>Add New Worklog</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WorklogList; 
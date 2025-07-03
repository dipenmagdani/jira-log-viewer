import { BarChart3, LogOut, User, RefreshCw } from "lucide-react";
import type { AuthData } from "../../types/dashboard";

interface DashboardHeaderProps {
  userInfo: any;
  authData: AuthData;
  onRefresh: () => void;
  onLogout: () => void;
  isRefreshing: boolean;
  children?: React.ReactNode;
}

const DashboardHeader = ({
  userInfo,
  authData,
  onRefresh,
  onLogout,
  isRefreshing,
  children,
}: DashboardHeaderProps) => (
  <header className="glass-card border-b border-gray-700/50 sticky top-0 z-30">
    <div className="container mx-auto px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              JIRA Worklog Viewer
            </h1>
            <div className="flex items-center space-x-2 text-gray-400">
              {userInfo?.avatarUrls?.["24x24"] ? (
                <img
                  src={userInfo.avatarUrls["24x24"]}
                  alt={userInfo.displayName}
                  className="w-5 h-5 rounded-full"
                />
              ) : (
                <User className="w-4 h-4" />
              )}
              <span className="text-sm">
                {userInfo?.displayName || authData.email}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={onRefresh}
            className="btn-ghost flex items-center gap-2 hover:bg-gray-700/50 hover:text-white text-gray-400 transition-colors px-3 py-2 rounded-lg"
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>

          <button
            onClick={onLogout}
            className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10 flex gap-2 items-center"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
      {children}
    </div>
  </header>
);

export default DashboardHeader; 
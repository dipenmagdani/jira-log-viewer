import { BarChart3, Clock, TrendingUp } from "lucide-react";

interface DashboardTabsProps {
  activeTab: "overview" | "worklogs" | "analytics";
  setActiveTab: (tab: "overview" | "worklogs" | "analytics") => void;
}

const DashboardTabs = ({ activeTab, setActiveTab }: DashboardTabsProps) => (
  <div className="flex items-center space-x-6 mt-6">
    {[
      { id: "overview", label: "Overview", icon: BarChart3 },
      { id: "worklogs", label: "Worklogs", icon: Clock },
      { id: "analytics", label: "Analytics", icon: TrendingUp },
    ].map((tab) => (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id as any)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
          activeTab === tab.id
            ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
            : "text-gray-400 hover:text-white hover:bg-gray-700/50"
        }`}
      >
        <tab.icon className="w-4 h-4" />
        <span>{tab.label}</span>
      </button>
    ))}
  </div>
);

export default DashboardTabs; 
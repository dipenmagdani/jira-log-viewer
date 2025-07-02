"use client";

import { type LucideIcon, Loader2 } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: "blue" | "green" | "purple" | "orange" | "red";
  trend?: {
    value: number;
    isPositive: boolean;
  };
  index?: number;
  isLoading?: boolean;
}

const colorVariants = {
  blue: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    icon: "text-blue-400",
    text: "text-blue-300",
    gradient: "from-blue-500/20 to-blue-600/20",
  },
  green: {
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    icon: "text-green-400",
    text: "text-green-300",
    gradient: "from-green-500/20 to-green-600/20",
  },
  purple: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    icon: "text-purple-400",
    text: "text-purple-300",
    gradient: "from-purple-500/20 to-purple-600/20",
  },
  orange: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    icon: "text-orange-400",
    text: "text-orange-300",
    gradient: "from-orange-500/20 to-orange-600/20",
  },
  red: {
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    icon: "text-red-400",
    text: "text-red-300",
    gradient: "from-red-500/20 to-red-600/20",
  },
};

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "blue",
  trend,
  index = 0,
  isLoading = false,
}: StatsCardProps) {
  const colors = colorVariants[color];

  if (isLoading) {
    return (
      <div
        className={`relative flex flex-col justify-between p-5 rounded-xl shadow-lg overflow-hidden h-36 animate-pulse ${colors.bg}`}
      >
        <div className="h-6 bg-gray-700/50 rounded w-3/4"></div>
        <div className="h-10 bg-gray-700/50 rounded w-1/2"></div>
        <div className="h-4 bg-gray-700/50 rounded w-1/4"></div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col justify-between p-5 rounded-xl shadow-lg overflow-hidden h-36 ${colors.bg} border ${colors.border} hover:border-gray-500/50 transition-all duration-300`}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">{title}</h3>
        <Icon className={`w-6 h-6 ${colors.icon}`} />
      </div>

      <div>
        <p className="text-3xl font-bold text-white">{value}</p>
        {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
      </div>
    </div>
  );
}

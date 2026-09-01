"use client";

import type { AdminCharts } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const PIE_COLORS = [
  "#2563EB",
  "#10B981",
  "#8B5CF6",
  "#F59E0B",
  "#EC4899",
  "#14B8A6",
  "#6366F1",
  "#F97316",
  "#06B6D4",
  "#64748B",
];

const TOOLTIP_STYLE = {
  borderRadius: "8px",
  border: "1px solid #E2E8F0",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
  fontSize: "12px",
} as const;

function ChartCard({
  title,
  description,
  children,
  empty,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-slate-400">{description}</p>
        )}
      </div>
      <div className="h-64">
        {empty ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            No data available
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export function WeeklyActiveUsersChart({ charts }: { charts: AdminCharts }) {
  return (
    <ChartCard
      title="Weekly Active Users"
      description="Users active per day this week"
      empty={charts.weeklyActiveUsers.every((d) => d.users === 0)}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={charts.weeklyActiveUsers}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 12, fill: "#64748B" }}
            axisLine={{ stroke: "#E2E8F0" }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: "#64748B" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Bar dataKey="users" name="Active Users" fill="#2563EB" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function XpDistributionChart({ charts }: { charts: AdminCharts }) {
  return (
    <ChartCard
      title="XP Distribution"
      description="Users by level band"
      empty={charts.xpByLevel.every((d) => d.value === 0)}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={charts.xpByLevel}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            nameKey="name"
          >
            {charts.xpByLevel.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={PIE_COLORS[index % PIE_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function CompletionRateChart({ charts }: { charts: AdminCharts }) {
  return (
    <ChartCard
      title="Habit Completion Rate"
      description="Daily completion percentage (last 14 days)"
      empty={charts.completionRate.every((d) => d.rate === 0)}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={charts.completionRate}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: "#64748B" }}
            axisLine={{ stroke: "#E2E8F0" }}
            tickLine={false}
            tickFormatter={(v: string) => v.slice(5)}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#64748B" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value) => [`${value}%`, "Completion Rate"]}
          />
          <Line
            type="monotone"
            dataKey="rate"
            name="Completion Rate"
            stroke="#10B981"
            strokeWidth={2}
            dot={{ r: 3, fill: "#10B981" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function GrowthTrendChart({ charts }: { charts: AdminCharts }) {
  return (
    <ChartCard
      title="Growth Trend"
      description="User registrations over time"
      empty={charts.userGrowth.every((d) => d.users === 0)}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={charts.userGrowth}>
          <defs>
            <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: "#64748B" }}
            axisLine={{ stroke: "#E2E8F0" }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: "#64748B" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Area
            type="monotone"
            dataKey="users"
            name="New Users"
            stroke="#2563EB"
            strokeWidth={2}
            fill="url(#growthGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function HabitCompletionsChart({ charts }: { charts: AdminCharts }) {
  return (
    <ChartCard
      title="Habit Completions"
      description="Daily completions (last 30 days)"
      empty={charts.habitCompletionTimeline.every((d) => d.completions === 0)}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={charts.habitCompletionTimeline}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: "#64748B" }}
            axisLine={{ stroke: "#E2E8F0" }}
            tickLine={false}
            tickFormatter={(v: string) => v.slice(5)}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: "#64748B" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Bar dataKey="completions" name="Completions" fill="#2563EB" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function CategoryDistributionChart({ charts }: { charts: AdminCharts }) {
  return (
    <ChartCard
      title="Category Distribution"
      description="Habits by category"
      empty={charts.categoryDistribution.every((d) => d.value === 0)}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={charts.categoryDistribution}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            nameKey="name"
          >
            {charts.categoryDistribution.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={PIE_COLORS[index % PIE_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function XpEarnedChart({ charts }: { charts: AdminCharts }) {
  return (
    <ChartCard
      title="XP Earned"
      description="Total XP earned over time (last 30 days)"
      empty={charts.xpTimeline.every((d) => d.xp === 0)}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={charts.xpTimeline}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: "#64748B" }}
            axisLine={{ stroke: "#E2E8F0" }}
            tickLine={false}
            tickFormatter={(v: string) => v.slice(5)}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#64748B" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Line
            type="monotone"
            dataKey="xp"
            name="XP"
            stroke="#F59E0B"
            strokeWidth={2}
            dot={{ r: 3, fill: "#F59E0B" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

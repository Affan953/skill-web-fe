"use client";

import {
  Settings,
  Shield,
  Mail,
  Server,
  Database,
  Save,
} from "lucide-react";

const settingCards = [
  {
    icon: Settings,
    title: "General",
    description: "Platform name, maintenance mode, default settings",
    color: "bg-[#2563EB]/10 text-[#2563EB]",
    fields: [
      { label: "Platform Name", value: "SkillUp RPG" },
      { label: "Maintenance Mode", value: "Off" },
      { label: "Default Language", value: "English" },
    ],
  },
  {
    icon: Database,
    title: "Firebase",
    description: "Firebase project configuration and credentials",
    color: "bg-amber-100 text-amber-500",
    fields: [
      { label: "Project ID", value: "skillup-rpg" },
      { label: "Auth Provider", value: "Firebase Auth" },
      { label: "Database", value: "Firestore" },
    ],
  },
  {
    icon: Shield,
    title: "Security",
    description: "Authentication, authorization, and API security",
    color: "bg-[#10B981]/10 text-[#10B981]",
    fields: [
      { label: "2FA", value: "Enabled" },
      { label: "Session Timeout", value: "24 hours" },
      { label: "Rate Limiting", value: "Active" },
    ],
  },
  {
    icon: Server,
    title: "System",
    description: "Server configuration, caching, and performance",
    color: "bg-purple-100 text-purple-500",
    fields: [
      { label: "API URL", value: "localhost:3000" },
      { label: "Cache TTL", value: "30s" },
      { label: "Max Connections", value: "100" },
    ],
  },
  {
    icon: Mail,
    title: "Email",
    description: "Email templates and notification delivery settings",
    color: "bg-orange-100 text-orange-500",
    fields: [
      { label: "SMTP Provider", value: "Not configured" },
      { label: "From Address", value: "noreply@skillup.app" },
      { label: "Daily Limit", value: "500" },
    ],
  },
];

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage platform configuration.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {settingCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="rounded-xl border border-slate-200 bg-white p-6"
            >
              <div className="flex items-start gap-4">
                <div className={`rounded-xl p-3 ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-slate-900">
                    {card.title}
                  </h3>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {card.description}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {card.fields.map((field) => (
                  <div
                    key={field.label}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <span className="text-sm text-slate-500">
                      {field.label}
                    </span>
                    <span className="text-sm font-medium text-slate-700">
                      {field.value}
                    </span>
                  </div>
                ))}
              </div>

              <button className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

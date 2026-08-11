import { useQuery } from "@tanstack/react-query";
import { Megaphone, X, Info, AlertTriangle, Wrench } from "lucide-react";
import { useState } from "react";
import { getLatestAnnouncement } from "../features/admin/actions/superadmin.api";
import type { AnnouncementType } from "../lib/types";

const TONE_BORDER: Record<AnnouncementType, string> = {
  INFO: "border-blue-500/30 bg-blue-500/10 text-blue-900 dark:text-blue-200",
  WARNING: "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200",
  MAINTENANCE: "border-red-500/30 bg-red-500/10 text-red-900 dark:text-red-200",
};

const ICON_MAP: Record<AnnouncementType, any> = {
  INFO: Info,
  WARNING: AlertTriangle,
  MAINTENANCE: Wrench,
};

export function GlobalAnnouncementBanner() {
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["latest-announcement"],
    queryFn: getLatestAnnouncement,
    refetchInterval: 60000,
  });

  const announcement = data?.announcement;

  if (!announcement || dismissedId === announcement.id) {
    return null;
  }

  const annType = (announcement.type || "INFO") as AnnouncementType;
  const Icon = ICON_MAP[annType] || Megaphone;

  return (
    <div className={`relative mb-6 rounded-2xl border p-4 shadow-sm flex items-start gap-3 ${TONE_BORDER[annType]}`}>

      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex-1 pr-6 space-y-1">
        <h4 className="font-bold text-sm leading-tight">{announcement.title}</h4>
        <p className="text-xs opacity-90 leading-relaxed whitespace-pre-wrap">{announcement.message}</p>
      </div>
      <button
        onClick={() => setDismissedId(announcement.id)}
        className="absolute top-3 right-3 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
        title="Cerrar aviso"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

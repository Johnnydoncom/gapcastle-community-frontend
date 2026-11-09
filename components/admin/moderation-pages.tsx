"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { AdminHeading } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiError, api } from "@/lib/api";
import { listingPath, profilePath } from "@/lib/site";

type ModerationReport = { id: number; reason: string; details: string | null; status: string; created_at: string; subject_label: string; user_id: number | null; user_slug: string | null; listing: { id: number; slug: string; title: string } | null };

const REASON_LABELS: Record<string, string> = {
  selling: "Selling",
  prohibited_item: "Prohibited item",
  misrepresented: "Misrepresented",
  harassment: "Harassment",
  scam: "Scam",
  other: "Other",
};

export function AdminReportsPage() {
  const queryClient = useQueryClient();
  const [updating, setUpdating] = useState<number | null>(null);
  const reports = useQuery({ queryKey: ["moderation-reports"], queryFn: async () => (await api.get<{ data: ModerationReport[] }>("moderation/reports")).data });

  async function updateReport(id: number, status: "reviewed" | "resolved" | "dismissed") {
    setUpdating(id);
    try {
      await api.patch(`moderation/reports/${id}`, { status });
      toast.success(`Report ${status}`);
      await queryClient.invalidateQueries({ queryKey: ["moderation-reports"] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update report");
    }
    setUpdating(null);
  }

  return (
    <div>
      <AdminHeading title="Open reports" description="User-submitted concerns needing review. Resolve after taking action (e.g. removing a listing or suspending a member)." />
      <div className="flex items-center gap-3"><TriangleAlert className="size-5 text-primary" /><p className="text-sm text-muted-foreground">{reports.data?.length ?? 0} report(s) open or under review</p></div>
      {reports.isLoading ? <div className="mt-4 h-24 animate-pulse rounded bg-muted" /> : reports.data?.length ? <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card px-5 shadow-soft">{reports.data.map((report) => <article key={report.id} className="flex flex-wrap items-start justify-between gap-4 py-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant="warning">{REASON_LABELS[report.reason] ?? report.reason}</Badge>{report.status === "reviewed" && <Badge variant="secondary">Reviewed</Badge>}<span className="text-xs text-muted-foreground">{new Date(report.created_at).toLocaleDateString()}</span></div><p className="mt-2 font-semibold">{report.listing ? <Link href={listingPath(report.listing.slug)} className="hover:text-primary">{report.listing.title}</Link> : report.user_slug ? <Link href={profilePath(report.user_slug)} className="hover:text-primary">{report.subject_label}</Link> : report.subject_label}</p>{report.details && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{report.details}</p>}</div><div className="flex flex-wrap gap-2">{report.status !== "reviewed" && <Button size="sm" variant="outline" disabled={updating === report.id} onClick={() => void updateReport(report.id, "reviewed")}>Mark reviewed</Button>}<Button size="sm" disabled={updating === report.id} onClick={() => void updateReport(report.id, "resolved")}>Resolve</Button><Button size="sm" variant="ghost" disabled={updating === report.id} onClick={() => void updateReport(report.id, "dismissed")}>Dismiss</Button></div></article>)}</div> : <p className="mt-4 rounded-2xl border border-dashed border-border bg-card py-10 text-center text-sm text-muted-foreground">No open reports right now.</p>}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, ClipboardCheck, Gift, HandHeart, MapPin, Minus, Package, TriangleAlert, UserPlus, Users } from "lucide-react";
import { ChartCard, RankedBars, SERIES, SplitBar, StackedBars, TrendChart } from "@/components/admin/charts";
import { PageHeader, Panel, Pill, STATUS_TONE, humanize } from "@/components/admin/ui";
import { useSession } from "@/hooks/use-session";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/gapcastle";
import { listingPath } from "@/lib/site";
import { cn } from "@/lib/utils";

type Compare = { value: number; previous: number };
type Analytics = {
  range: number;
  kpis: {
    new_members: Compare; new_listings: Compare; requests: Compare; rehomed: Compare;
    total_members: number; active_listings: number; pending_moderation: number; pending_requests: number; open_reports: number; live_hubs: number;
  };
  series: Array<{ date: string; listings: number; requests: number; members: number; rehomed: number }>;
  by_category: Array<{ name: string; total: number }>;
  by_status: Array<{ status: string; total: number }>;
  fulfillment: { pickup: number; delivery: number };
  by_state: Array<{ name: string; pickup: number; delivery: number }>;
  recent_requests: Array<{ id: number; status: string; fulfillment_method: string; listing: { title: string; slug: string } | null; requester: string | null; state: string | null; hub: string | null; created_at: string }>;
};

const RANGES = [7, 30, 90] as const;

/** Admin dashboard: KPIs with period-over-period change, trends, breakdowns and work queues. */
export function AdminOverviewPage() {
  const { user } = useSession();
  const [range, setRange] = useState<(typeof RANGES)[number]>(30);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-analytics", range],
    queryFn: () => api.get<{ data: Analytics }>("admin/analytics", { range }).then((response) => response.data),
    placeholderData: (previous) => previous,
  });

  const rangeControl = (
    <div className="inline-flex rounded-xl border border-border bg-card p-1 text-sm font-semibold shadow-soft" role="tablist" aria-label="Date range">
      {RANGES.map((days) => (
        <button key={days} type="button" role="tab" aria-selected={range === days} onClick={() => setRange(days)} className={cn("rounded-lg px-3 py-1.5 transition-colors", range === days ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
          {days} days
        </button>
      ))}
    </div>
  );

  return (
    <div>
      <PageHeader title={`Welcome back, ${user?.name.split(" ")[0] ?? "admin"}`} description="How the Gap Castle community is doing. Growth figures exclude demo content." actions={rangeControl} />

      {isError && <p className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">We couldn&apos;t load the dashboard data. Please refresh.</p>}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <KpiCard label="New members" icon={UserPlus} compare={data?.kpis.new_members} range={range} loading={isLoading} />
        <KpiCard label="New listings" icon={Package} compare={data?.kpis.new_listings} range={range} loading={isLoading} />
        <KpiCard label="Requests" icon={HandHeart} compare={data?.kpis.requests} range={range} loading={isLoading} />
        <KpiCard label="Items rehomed" icon={Gift} compare={data?.kpis.rehomed} range={range} loading={isLoading} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <MiniStat label="Total members" value={data?.kpis.total_members} icon={Users} href="/admin/users" />
        <MiniStat label="Active listings" value={data?.kpis.active_listings} icon={Package} href="/admin/listings?status=available" />
        <MiniStat label="Awaiting approval" value={data?.kpis.pending_moderation} icon={ClipboardCheck} href="/admin/listings?moderation=pending" attention />
        <MiniStat label="Pending requests" value={data?.kpis.pending_requests} icon={HandHeart} href="/admin/requests?status=pending" />
        <MiniStat label="Open reports" value={data?.kpis.open_reports} icon={TriangleAlert} href="/admin/reports" attention />
        <MiniStat label="Live pickup hubs" value={data?.kpis.live_hubs} icon={MapPin} href="/admin/locations" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <ChartCard
          className="xl:col-span-2"
          title="Community activity"
          description={`New listings and requests per day · last ${range} days`}
          legend={[{ key: "listings", label: "New listings", color: SERIES.one }, { key: "requests", label: "Requests", color: SERIES.two }]}
          table={{ columns: ["Date", "Listings", "Requests", "Members", "Rehomed"], rows: (data?.series ?? []).map((row) => [row.date, row.listings, row.requests, row.members, row.rehomed]) }}
        >
          {data ? (
            <TrendChart data={data.series} series={[{ key: "listings", label: "New listings", color: SERIES.one }, { key: "requests", label: "Requests", color: SERIES.two }]} />
          ) : <ChartSkeleton />}
        </ChartCard>

        <ChartCard
          title="How receivers collect"
          description={`Requests in the last ${range} days`}
          table={{ columns: ["Method", "Requests"], rows: data ? [["Pickup hub", data.fulfillment.pickup], ["Waybill", data.fulfillment.delivery]] : [] }}
        >
          {data ? (
            <div className="pt-4">
              <SplitBar parts={[{ label: "Pickup hub", value: data.fulfillment.pickup, color: SERIES.one }, { label: "Waybill", value: data.fulfillment.delivery, color: SERIES.two }]} />
              <div className="mt-5 px-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Listings by status</p>
                <ul className="space-y-1.5 text-sm">
                  {data.by_status.map((row) => (
                    <li key={row.status} className="flex items-center justify-between">
                      <Pill tone={STATUS_TONE[row.status] ?? "gray"}>{humanize(row.status)}</Pill>
                      <span className="font-semibold tabular-nums">{row.total.toLocaleString("en-NG")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : <ChartSkeleton />}
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Available listings by category"
          description="Live items members can request right now"
          table={{ columns: ["Category", "Listings"], rows: (data?.by_category ?? []).map((row) => [row.name, row.total]) }}
        >
          {data ? <RankedBars data={data.by_category} /> : <ChartSkeleton />}
        </ChartCard>

        <ChartCard
          title="Requests by state"
          description={`Top states in the last ${range} days`}
          legend={[{ key: "pickup", label: "Pickup hub", color: SERIES.one }, { key: "delivery", label: "Waybill", color: SERIES.two }]}
          table={{ columns: ["State", "Pickup", "Waybill"], rows: (data?.by_state ?? []).map((row) => [row.name, row.pickup, row.delivery]) }}
        >
          {data ? (
            data.by_state.length ? (
              <StackedBars data={data.by_state} series={[{ key: "pickup", label: "Pickup hub", color: SERIES.one }, { key: "delivery", label: "Waybill", color: SERIES.two }]} />
            ) : <p className="px-3 py-12 text-center text-sm text-muted-foreground">No requests with a state in this period yet.</p>
          ) : <ChartSkeleton />}
        </ChartCard>
      </div>

      <Panel className="mt-4" title="Latest requests" actions={<Link href="/admin/requests" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">All requests <ArrowRight className="size-4" /></Link>} bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/60 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-5 py-2.5">Item</th><th className="px-5 py-2.5">Requester</th><th className="px-5 py-2.5">Collection</th><th className="px-5 py-2.5">Status</th><th className="px-5 py-2.5 text-right">When</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(data?.recent_requests ?? []).map((row) => (
                <tr key={row.id}>
                  <td className="px-5 py-3 font-medium">{row.listing ? <Link href={listingPath(row.listing.slug)} target="_blank" className="hover:text-primary">{row.listing.title}</Link> : "Deleted listing"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{row.requester ?? "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{row.fulfillment_method === "pickup" ? `Hub${row.hub ? ` · ${row.hub}` : ""}` : `Waybill${row.state ? ` · ${row.state}` : ""}`}</td>
                  <td className="px-5 py-3"><Pill tone={STATUS_TONE[row.status] ?? "gray"}>{humanize(row.status)}</Pill></td>
                  <td className="px-5 py-3 text-right text-muted-foreground">{timeAgo(row.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && !data.recent_requests.length && <p className="px-5 py-8 text-center text-sm text-muted-foreground">No requests yet.</p>}
        </div>
      </Panel>
    </div>
  );
}

function KpiCard({ label, icon: Icon, compare, range, loading }: { label: string; icon: typeof Users; compare?: Compare; range: number; loading: boolean }) {
  const change = compare ? delta(compare) : null;
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</p>
        <span className="flex size-8 shrink-0 items-center sm:size-9 justify-center rounded-xl bg-primary-50 text-primary"><Icon className="size-[18px]" /></span>
      </div>
      {loading || !compare ? (
        <div className="mt-3 h-9 w-24 animate-pulse rounded bg-muted" />
      ) : (
        <p className="mt-2 text-2xl font-extrabold tabular-nums tracking-tight sm:text-3xl">{compare.value.toLocaleString("en-NG")}</p>
      )}
      {change && (
        <p className="mt-1.5 flex flex-wrap items-center gap-x-1 text-[11px] text-muted-foreground sm:text-xs">
          <span className={cn("inline-flex items-center gap-0.5 font-bold", change.direction === "up" && "text-success", change.direction === "down" && "text-destructive")}>
            {change.direction === "up" ? <ArrowUpRight className="size-3.5" /> : change.direction === "down" ? <ArrowDownRight className="size-3.5" /> : <Minus className="size-3.5" />}
            {change.label}
          </span>
          vs previous {range} days
        </p>
      )}
    </div>
  );
}

function delta({ value, previous }: Compare) {
  if (value === previous) return { direction: "flat" as const, label: "No change" };
  if (previous === 0) return { direction: "up" as const, label: `+${value}` };
  const percent = Math.round(((value - previous) / previous) * 100);
  return { direction: percent >= 0 ? ("up" as const) : ("down" as const), label: `${percent > 0 ? "+" : ""}${percent}%` };
}

function MiniStat({ label, value, icon: Icon, href, attention = false }: { label: string; value?: number; icon: typeof Users; href: string; attention?: boolean }) {
  const needsWork = attention && (value ?? 0) > 0;
  return (
    <Link href={href} className={cn("group rounded-2xl border bg-card p-4 transition-[box-shadow,border-color] hover:shadow-lift", needsWork ? "border-brand-yellow-300" : "border-border")}>
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className={cn("size-4", needsWork ? "text-brand-yellow-700" : "text-primary")} /> {label}
      </div>
      <p className="mt-2 text-xl font-extrabold tabular-nums">{value === undefined ? "—" : value.toLocaleString("en-NG")}</p>
    </Link>
  );
}

function ChartSkeleton() {
  return <div className="mx-3 h-64 animate-pulse rounded-xl bg-muted" />;
}

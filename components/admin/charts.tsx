"use client";

import { useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { cn } from "@/lib/utils";

/*
 * Chart palette (validated with the dataviz validator against the white card surface):
 *   series 1 = primary-500 #1f65c9, series 2 = brand-yellow-600 #afa23d.
 * Yellow is below 3:1 contrast on white, so every chart ships with a legend,
 * hover values and a table view — colour is never the only way to read it.
 */
export const SERIES = { one: "#1f65c9", two: "#afa23d" } as const;
const GRID = "var(--color-border)";
const AXIS = "var(--color-muted-foreground)";
const fmt = (value: number) => new Intl.NumberFormat("en-NG").format(value);

type Series = { key: string; label: string; color: string };

/** A chart card with a Chart / Table switch so the data is always readable without colour. */
export function ChartCard({
  title,
  description,
  legend,
  table,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  legend?: Series[];
  table: { columns: string[]; rows: Array<Array<string | number>> };
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const [view, setView] = useState<"chart" | "table">("chart");

  return (
    <section className={cn("flex flex-col rounded-2xl border border-border bg-card shadow-soft", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pb-2 pt-4">
        <div className="min-w-0">
          <h2 className="font-bold">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <div className="inline-flex rounded-lg bg-muted p-0.5 text-xs font-semibold" role="tablist" aria-label={`${title} view`}>
            {(["chart", "table"] as const).map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={view === option}
                onClick={() => setView(option)}
                className={cn("rounded-md px-2.5 py-1 capitalize transition-colors", view === option ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground")}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
      {legend && legend.length > 1 && view === "chart" && (
        <ul className="flex flex-wrap gap-4 px-5 text-xs text-muted-foreground" aria-label="Legend">
          {legend.map((item) => (
            <li key={item.key} className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: item.color, height: 3 }} aria-hidden="true" /> {item.label}
            </li>
          ))}
        </ul>
      )}
      <div className="flex-1 px-2 pb-3 pt-2">
        {view === "chart" ? (
          children
        ) : (
          <div className="max-h-72 overflow-auto px-3">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>{table.columns.map((column, index) => <th key={column} className={cn("py-2", index > 0 && "text-right")}>{column}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {table.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>{row.map((cell, index) => <td key={index} className={cn("py-1.5", index > 0 && "text-right tabular-nums")}>{typeof cell === "number" ? fmt(cell) : cell}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function ChartTooltip({ active, payload, label, formatLabel }: Partial<TooltipContentProps<number, string>> & { formatLabel?: (label: string) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-36 rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-lift">
      <p className="mb-1 font-semibold text-foreground">{formatLabel ? formatLabel(String(label)) : label}</p>
      {payload.map((entry) => (
        <p key={String(entry.dataKey)} className="flex items-center justify-between gap-4 text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />{entry.name}</span>
          <span className="font-semibold tabular-nums text-foreground">{fmt(Number(entry.value))}</span>
        </p>
      ))}
    </div>
  );
}

const shortDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "short" });

/** Activity over time: one line per series, 2px strokes, crosshair tooltip. */
export function TrendChart({ data, series, height = 280 }: { data: Array<Record<string, number | string>>; series: Series[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={24} />
        <YAxis allowDecimals={false} tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
        <Tooltip content={<ChartTooltip formatLabel={shortDate} />} cursor={{ stroke: AXIS, strokeDasharray: "3 3" }} />
        {series.map((item) => (
          <Line key={item.key} type="linear" dataKey={item.key} name={item.label} stroke={item.color} strokeWidth={2} dot={false} activeDot={{ r: 4.5, strokeWidth: 2, stroke: "#fff" }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Magnitude by category: horizontal bars, one hue, value labels at the bar end. */
export function RankedBars({ data, color = SERIES.one, height }: { data: Array<{ name: string; total: number }>; color?: string; height?: number }) {
  const rows = data.slice(0, 10);
  return (
    <ResponsiveContainer width="100%" height={height ?? Math.max(160, rows.length * 34)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 36, bottom: 4, left: 8 }} barCategoryGap={6}>
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis type="category" dataKey="name" width={118} tick={{ fill: AXIS, fontSize: 12 }} tickLine={false} axisLine={false} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-muted)" }} />
        <Bar dataKey="total" name="Listings" fill={color} radius={[0, 4, 4, 0]} maxBarSize={18} label={{ position: "right", fill: "var(--color-foreground)", fontSize: 11, formatter: (value: unknown) => fmt(Number(value)) }} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Two-part composition per row (pickup vs delivery per state), stacked with a 2px gap. */
export function StackedBars({ data, series, height }: { data: Array<Record<string, number | string>>; series: Series[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height ?? Math.max(72, data.length * 38 + 16)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }} barCategoryGap={8}>
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis type="category" dataKey="name" width={110} tick={{ fill: AXIS, fontSize: 12 }} tickLine={false} axisLine={false} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-muted)" }} />
        {series.map((item, index) => (
          <Bar key={item.key} dataKey={item.key} name={item.label} stackId="a" fill={item.color} stroke="var(--color-card)" strokeWidth={2} maxBarSize={18} radius={index === series.length - 1 ? [0, 4, 4, 0] : 0} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/** A single part-to-whole bar for two values, labelled directly (no pie charts). */
export function SplitBar({ parts }: { parts: Array<{ label: string; value: number; color: string }> }) {
  const total = parts.reduce((sum, part) => sum + part.value, 0);
  return (
    <div className="px-3">
      <div className="flex h-3 overflow-hidden rounded-full bg-muted" role="img" aria-label={parts.map((part) => `${part.label}: ${part.value}`).join(", ")}>
        {total > 0 && parts.map((part, index) => (
          <span key={part.label} style={{ width: `${(part.value / total) * 100}%`, backgroundColor: part.color }} className={cn(index > 0 && "border-l-2 border-card")} />
        ))}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3">
        {parts.map((part) => (
          <div key={part.label} className="rounded-xl bg-muted/60 p-3">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="size-2 rounded-full" style={{ backgroundColor: part.color }} />{part.label}</dt>
            <dd className="mt-1 text-xl font-extrabold tabular-nums">{fmt(part.value)} <span className="text-xs font-semibold text-muted-foreground">{total ? Math.round((part.value / total) * 100) : 0}%</span></dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

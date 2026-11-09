"use client";

import { Flag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label, Select, Textarea } from "@/components/ui/form-fields";
import { ApiError, api } from "@/lib/api";

const REASONS = [
  { value: "selling", label: "Asking for money / selling" },
  { value: "prohibited_item", label: "Prohibited or dangerous item" },
  { value: "misrepresented", label: "Item misrepresented" },
  { value: "harassment", label: "Harassment or discrimination" },
  { value: "scam", label: "Scam or fraud" },
  { value: "other", label: "Something else" },
];

type Props = {
  type: "listing" | "user" | "conversation";
  id: number | string;
  label?: string;
  trigger?: (open: () => void) => React.ReactNode;
};

/** Report a listing, member or conversation to the moderators. */
export function ReportDialog({ type, id, label = "Report", trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("selling");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await api.post<{ message: string }>("reports", { type, id: Number(id), reason, details: details || null });
      toast.success(response.message);
      setOpen(false);
      setDetails("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not send the report");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {trigger ? trigger(() => setOpen(true)) : (
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="text-muted-foreground">
          <Flag className="size-4" /> {label}
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report this {type}</DialogTitle>
            <DialogDescription>Reports are private. Our moderators review every one and act on anything that breaks the community guidelines.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="report-reason">What&apos;s wrong?</Label>
              <Select id="report-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
                {REASONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="report-details">Details (optional)</Label>
              <Textarea id="report-details" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={2000} placeholder="Anything that helps moderators understand what happened" />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? "Sending…" : "Send report"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

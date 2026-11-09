"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Ban } from "lucide-react";
import { toast } from "sonner";
import { ReportDialog } from "@/components/report-dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ApiError, api } from "@/lib/api";

/** Report and block controls for a member profile. */
export function ProfileActions({
  userId,
  name,
  isBlocked,
  isSelf,
}: {
  userId: number;
  name: string;
  isBlocked: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const { userId: viewerId } = useAuth();
  const [blocked, setBlocked] = useState(isBlocked);
  const [busy, setBusy] = useState(false);

  if (isSelf) {
    return (
      <Button asChild variant="outline">
        <Link href="/account/settings">Edit profile</Link>
      </Button>
    );
  }

  if (!viewerId) {
    return null;
  }

  async function toggleBlock() {
    if (!blocked && !confirm(`Block ${name}? They won't be able to message you or request your items.`)) {
      return;
    }

    setBusy(true);
    try {
      const response = blocked
        ? await api.delete<{ message: string }>(`users/${userId}/block`)
        : await api.post<{ message: string }>(`users/${userId}/block`);
      setBlocked(!blocked);
      toast.success(response.message);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <ReportDialog type="user" id={userId} label="Report" />
      <Button variant="ghost" size="sm" onClick={toggleBlock} disabled={busy} className="text-muted-foreground">
        <Ban className="size-4" /> {blocked ? "Unblock" : "Block"}
      </Button>
    </>
  );
}

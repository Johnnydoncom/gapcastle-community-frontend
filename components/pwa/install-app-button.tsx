"use client";

import { useState } from "react";
import { Download, Share, SquarePlus } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePwaInstall } from "./pwa-register";

/**
 * "Install app" — uses the native prompt on Android/desktop Chrome and Edge, and
 * shows the Add to Home Screen steps on iOS Safari. Hidden when not installable.
 */
export function InstallAppButton({ label = "Install the app", ...props }: ButtonProps & { label?: string }) {
  const { state, install } = usePwaInstall();
  const [iosHelp, setIosHelp] = useState(false);

  if (state === "unavailable" || state === "installed") return null;

  return (
    <>
      <Button
        {...props}
        onClick={async () => {
          if (state === "ios") {
            setIosHelp(true);
            return;
          }
          if (await install()) toast.success("Gratis Castle is on your home screen");
        }}
      >
        <Download className="size-4" /> {label}
      </Button>
      <Dialog open={iosHelp} onOpenChange={setIosHelp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Gratis Castle to your Home Screen</DialogTitle>
            <DialogDescription>Open it like an app — full screen, one tap away.</DialogDescription>
          </DialogHeader>
          <ol className="space-y-3 text-sm">
            <li className="flex items-center gap-3 rounded-xl bg-muted p-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-card text-primary"><Share className="size-4" /></span>
              Tap the <strong>Share</strong> button in Safari&apos;s toolbar.
            </li>
            <li className="flex items-center gap-3 rounded-xl bg-muted p-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-card text-primary"><SquarePlus className="size-4" /></span>
              Choose <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.
            </li>
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
}

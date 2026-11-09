import type { Metadata } from "next";
import { Suspense } from "react";
import { MessagesPage } from "@/components/account/messages-page";

export const metadata: Metadata = {
  title: "Messages",
  description: "Chat with members about free items. Gap Castle handles every handover.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense>
      <MessagesPage />
    </Suspense>
  );
}

import type { Metadata } from "next";
import { GivePage } from "@/components/routes/give-page";

export const metadata: Metadata = {
  title: "Give an item",
  description: "List something you no longer need and give it a new home. Free, simple and meaningful.",
  alternates: { canonical: "/give" },
};

export default function Page() {
  return <GivePage />;
}

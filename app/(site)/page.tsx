import type { Metadata } from "next";
import { HomePage } from "@/components/routes/home-page";

export const metadata: Metadata = {
  title: { absolute: "Gratis Castle — Give freely, receive gratefully" },
  description: "Find useful things shared for free by neighbours, give away what you no longer need, and collect safely from a Gratis Castle pickup hub.",
  alternates: { canonical: "/" },
};

export default function Page() {
  return <HomePage />;
}

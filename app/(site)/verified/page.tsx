import { redirect } from "next/navigation";

/** Old verification-link landing page. Verification now uses an emailed code. */
export default function Page() {
  redirect("/verify-email");
}

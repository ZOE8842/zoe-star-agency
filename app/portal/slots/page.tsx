// Legacy-Slot-Pfad — V3 ersetzt durch Creator Services.
// Soft-Redirect, damit alte Bookmarks/Cron-Reminders nicht 404en.

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function LegacySlotsRedirect() {
  redirect("/portal/services");
}

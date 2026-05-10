// Legacy-Downloads-Pfad — V3 ersetzt durch Academy.
// Soft-Redirect, damit alte Links/Bookmarks nicht 404en.

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function LegacyDownloadsRedirect() {
  redirect("/portal/academy");
}

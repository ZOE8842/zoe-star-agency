// Portal-Layout: nur fuer auto-tracking aller /portal/*-Routes.
// Rendert lediglich children durch + montiert den Page-View-Tracker.
// Header/Footer-Komposition bleibt in den jeweiligen Pages.

import type { ReactNode } from "react";
import { PortalAnalyticsTracker } from "@/components/analytics/PortalAnalyticsTracker";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PortalAnalyticsTracker eventType="page_view" />
      {children}
    </>
  );
}

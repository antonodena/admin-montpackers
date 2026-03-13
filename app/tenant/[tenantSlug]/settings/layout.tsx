import type { ReactNode } from "react"

import { TenantSettingsLayoutShell } from "@/components/tenant/tenant-settings-layout-shell"

export default function TenantSettingsLayout({
  children,
}: {
  children: ReactNode
}) {
  return <TenantSettingsLayoutShell>{children}</TenantSettingsLayoutShell>
}


"use client"

import { useParams } from "next/navigation"

import { TenantNotificationsSettingsSection } from "@/components/tenant/tenant-settings-sections"

export default function TenantNotificationsSettingsPage() {
  const params = useParams<{ tenantSlug: string }>()

  return <TenantNotificationsSettingsSection tenantSlug={params.tenantSlug} />
}

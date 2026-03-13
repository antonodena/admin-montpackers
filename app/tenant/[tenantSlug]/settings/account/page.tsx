"use client"

import { useParams } from "next/navigation"

import { TenantAccountSettingsSection } from "@/components/tenant/tenant-settings-sections"

export default function TenantAccountSettingsPage() {
  const params = useParams<{ tenantSlug: string }>()

  return <TenantAccountSettingsSection tenantSlug={params.tenantSlug} />
}


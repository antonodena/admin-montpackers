"use client"

import { useParams } from "next/navigation"

import { TenantGeneralSettingsSection } from "@/components/tenant/tenant-settings-sections"

export default function TenantGeneralSettingsPage() {
  const params = useParams<{ tenantSlug: string }>()

  return <TenantGeneralSettingsSection tenantSlug={params.tenantSlug} />
}


"use client"

import { useParams } from "next/navigation"

import { TenantDomainsSettingsSection } from "@/components/tenant/tenant-settings-sections"

export default function TenantDomainsSettingsPage() {
  const params = useParams<{ tenantSlug: string }>()

  return <TenantDomainsSettingsSection tenantSlug={params.tenantSlug} />
}


"use client"

import { useParams } from "next/navigation"

import { TenantTeamSettingsSection } from "@/components/tenant/tenant-settings-sections"

export default function TenantTeamSettingsPage() {
  const params = useParams<{ tenantSlug: string }>()

  return <TenantTeamSettingsSection tenantSlug={params.tenantSlug} />
}


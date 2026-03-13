"use client"

import { useParams } from "next/navigation"

import { TenantAppearanceSettingsSection } from "@/components/tenant/tenant-settings-sections"

export default function TenantAppearanceSettingsPage() {
  const params = useParams<{ tenantSlug: string }>()

  return <TenantAppearanceSettingsSection tenantSlug={params.tenantSlug} />
}


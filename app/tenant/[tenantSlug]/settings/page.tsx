import { redirect } from "next/navigation"

export default function TenantSettingsIndexPage({
  params,
}: {
  params: { tenantSlug: string }
}) {
  redirect(`/tenant/${params.tenantSlug}/settings/general`)
}


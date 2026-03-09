import { TenantDashboardPage } from "@/components/tenant/tenant-dashboard-page"
import { defaultTenant } from "@/lib/mock-data"

export default function HomePage() {
  return <TenantDashboardPage tenant={defaultTenant} />
}

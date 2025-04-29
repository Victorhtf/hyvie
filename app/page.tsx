import { DashboardHeader } from "@/components/dashboard-header"
import { ServiceGrid } from "@/components/service-grid"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <DashboardHeader />
        <ServiceGrid />
      </div>
    </div>
  )
}

import Link from "next/link";
import { RecentActivityCard } from "@/components/dashboard/recent-activity-card";
import { UpcomingSessionsCard } from "@/components/dashboard/upcoming-sessions-card";
import { ClientMetricsCard } from "@/components/dashboard/client-metrics-card";
import { Button } from "@/components/ui/button";

// This is a Server Component by default - no "use client" needed!
// In a real app, we could fetch data directly here:
// const metrics = await getMetricsFromDatabase();

export default function DashboardPage() {
  return (
    <div className="animate-in space-y-8">
      <h1 className="font-bold">Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ClientMetricsCard />
            <UpcomingSessionsCard />
          </div>
          
          <div className="p-6 border rounded-lg bg-coaching-50">
            <h3 className="text-lg font-semibold mb-4">Ready to process a coaching session?</h3>
            <p className="text-muted-foreground mb-6">
              Paste your session transcript and let Coach Claude analyze it for you, identifying key themes, 
              providing feedback, and suggesting follow-up actions.
            </p>
            <div className="flex space-x-4">
              <Link href="/new-session">
                <Button>New Session Analysis</Button>
              </Link>
              <Button variant="outline">Learn More</Button>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-4">
          <RecentActivityCard />
        </div>
      </div>
    </div>
  );
}

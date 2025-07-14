import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function ClientMetricsCard() {
  // Mock data - in real app would come from Supabase
  const metrics = {
    totalClients: 12,
    activeClients: 8,
    sessionsThisMonth: 24,
    resourcesShared: 18,
    completionRate: 75,
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Client Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active Clients</span>
              <span className="font-semibold">{metrics.activeClients}/{metrics.totalClients}</span>
            </div>
            <Progress value={metrics.activeClients / metrics.totalClients * 100} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 border rounded-md text-center">
              <p className="text-2xl font-bold text-coaching-600">{metrics.sessionsThisMonth}</p>
              <p className="text-xs text-muted-foreground">Sessions this month</p>
            </div>
            <div className="p-3 border rounded-md text-center">
              <p className="text-2xl font-bold text-coaching-600">{metrics.resourcesShared}</p>
              <p className="text-xs text-muted-foreground">Resources shared</p>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Session Completion</span>
              <span className="font-semibold">{metrics.completionRate}%</span>
            </div>
            <Progress value={metrics.completionRate} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
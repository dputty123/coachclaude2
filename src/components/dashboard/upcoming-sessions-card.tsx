import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function UpcomingSessionsCard() {
  // Mock data - in real app would come from Supabase
  const upcomingSessions = [
    { id: 1, client: 'Jane Smith', date: '2024-05-21', time: '10:00 AM' },
    { id: 2, client: 'Tom Johnson', date: '2024-05-22', time: '2:30 PM' },
    { id: 3, client: 'Maria Garcia', date: '2024-05-23', time: '11:15 AM' },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Upcoming Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingSessions.map((session) => (
            <div key={session.id} className="flex flex-col space-y-2 p-3 border rounded-md card-hover">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">{session.client}</h4>
                <span className="text-sm font-medium text-coaching-600">{session.time}</span>
              </div>
              <p className="text-sm text-muted-foreground">{new Date(session.date).toLocaleDateString()}</p>
              <div className="pt-2">
                <Button variant="outline" size="sm" className="w-full">Prepare Session</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
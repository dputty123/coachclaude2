import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export function RecentActivityCard() {
  // Mock data - in real app would come from Supabase
  const activities = [
    { id: 1, type: 'session', client: 'Jane Smith', date: '2024-05-18', title: 'Quarterly Review' },
    { id: 2, type: 'resource', client: 'Tom Johnson', date: '2024-05-17', title: 'Leadership Framework PDF' },
    { id: 3, type: 'followup', client: 'Maria Garcia', date: '2024-05-16', title: 'Session Summary Email' },
    { id: 4, type: 'session', client: 'Alex Wong', date: '2024-05-15', title: 'Goal Setting' },
    { id: 5, type: 'resource', client: 'Sarah Lee', date: '2024-05-14', title: 'EQ Assessment Tool' },
  ];

  const getActivityIcon = (type: string) => {
    switch(type) {
      case 'session':
        return <div className="h-8 w-8 rounded-full bg-coaching-100 text-coaching-600 flex items-center justify-center">S</div>;
      case 'resource':
        return <div className="h-8 w-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">R</div>;
      case 'followup':
        return <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">F</div>;
      default:
        return <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">?</div>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80 pr-4">
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4">
                {getActivityIcon(activity.type)}
                <div className="flex-1 space-y-1">
                  <p className="font-medium leading-none">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {activity.client} • {new Date(activity.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
"use client"

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";

// Mock data for upcoming sessions
const mockSessions = [
  { id: 1, client: "Jane Smith", date: new Date(2025, 4, 22, 14, 0), duration: 60 },
  { id: 2, client: "Tom Johnson", date: new Date(2025, 4, 23, 10, 30), duration: 45 },
  { id: 3, client: "Maria Garcia", date: new Date(2025, 4, 25, 16, 15), duration: 60 },
];

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Filter sessions for the selected date
  const sessionsOnSelectedDate = selectedDate
    ? mockSessions.filter(
        (session) =>
          session.date.getDate() === selectedDate.getDate() &&
          session.date.getMonth() === selectedDate.getMonth() &&
          session.date.getFullYear() === selectedDate.getFullYear()
      )
    : [];

  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    if (newDate) {
      setSelectedDate(newDate);
    }
  };

  return (
    <div className="animate-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2>Calendar</h2>
          <p className="text-muted-foreground">
            Schedule and manage your coaching sessions
          </p>
        </div>
        <Button>
          <CalendarPlus className="h-4 w-4 mr-2" /> New Session
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateChange}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedDate ? (
                <>Sessions for {selectedDate.toLocaleDateString()}</>
              ) : (
                <>All Upcoming Sessions</>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessionsOnSelectedDate.length > 0 ? (
              <div className="space-y-4">
                {sessionsOnSelectedDate.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 border rounded-md"
                  >
                    <div>
                      <h4 className="font-medium">{session.client}</h4>
                      <p className="text-sm text-muted-foreground">
                        {session.date.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        · {session.duration} minutes
                      </p>
                    </div>
                    <div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No sessions scheduled for this date
                </p>
                <Button className="mt-4" variant="outline" size="sm">
                  <CalendarPlus className="h-4 w-4 mr-2" /> Schedule Session
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
'use client'

import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, StickyNote } from 'lucide-react'
import type { Session, ClientNote } from '@/generated/prisma'

interface ClientTimelineProps {
  clientId: string
  sessions: Session[]
  notes: ClientNote[]
}

interface TimelineItem {
  id: string
  type: 'session' | 'note' | 'followup'
  date: Date
  title: string
  description: string
  icon: React.ReactNode
}

export function ClientTimeline({ sessions, notes }: ClientTimelineProps) {
  // Combine sessions and notes into a single timeline
  const timelineItems: TimelineItem[] = [
    ...sessions.map(session => ({
      id: session.id,
      type: 'session' as const,
      date: session.date || session.createdAt,
      title: session.title || 'Coaching Session',
      description: session.summary || 'No summary available',
      icon: <MessageSquare className="h-4 w-4" />
    })),
    ...notes.map(note => ({
      id: note.id,
      type: 'note' as const,
      date: note.createdAt,
      title: 'Note Added',
      description: note.content.substring(0, 100) + (note.content.length > 100 ? '...' : ''),
      icon: <StickyNote className="h-4 w-4" />
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const getIconBackground = (type: string) => {
    switch(type) {
      case 'session': return 'bg-coaching-100 text-coaching-600'
      case 'note': return 'bg-amber-100 text-amber-600'
      case 'followup': return 'bg-green-100 text-green-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  if (timelineItems.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No activity yet. Start by creating a session or adding a note.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="relative pl-10">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
        
        {timelineItems.map((item) => (
          <div key={item.id} className="mb-6 relative">
            <div className="absolute left-0 w-8 h-8 bg-background border-2 border-border rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
            </div>
            <Card className="ml-6">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`p-1.5 rounded ${getIconBackground(item.type)}`}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <p className="text-sm">{item.description}</p>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
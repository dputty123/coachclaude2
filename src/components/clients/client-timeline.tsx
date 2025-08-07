'use client'

import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Mail, BookOpen } from 'lucide-react'
import type { Session, ClientResource } from '@/generated/prisma'

interface ClientTimelineProps {
  clientId: string
  sessions: Session[]
  resources?: ClientResource[]
}

interface TimelineItem {
  id: string
  type: 'session' | 'followup' | 'resource'
  date: Date
  title: string
  description: string
  icon: React.ReactNode
  sessionId?: string
}

export function ClientTimeline({ sessions, resources = [] }: ClientTimelineProps) {
  // Create timeline items from sessions and their follow-ups
  const timelineItems: TimelineItem[] = []
  
  // Add sessions and their follow-up emails
  sessions.forEach(session => {
    // Add the session itself
    timelineItems.push({
      id: session.id,
      type: 'session' as const,
      date: session.date || session.createdAt,
      title: session.title || 'Coaching Session',
      description: session.summary || 'No summary available',
      icon: <MessageSquare className="h-4 w-4" />
    })
    
    // Add follow-up email if it exists
    if (session.followUpEmail) {
      timelineItems.push({
        id: `${session.id}-followup`,
        type: 'followup' as const,
        date: new Date(session.updatedAt), // Use updated time as follow-up is generated after session
        title: 'Follow-up Email Sent',
        description: 'Follow-up email generated and sent to client',
        icon: <Mail className="h-4 w-4" />,
        sessionId: session.id
      })
    }
  })
  
  // Add resources
  resources.forEach(resource => {
    timelineItems.push({
      id: resource.id,
      type: 'resource' as const,
      date: resource.suggestedAt,
      title: 'Resource Suggested',
      description: resource.reason || 'Resource suggested for client',
      icon: <BookOpen className="h-4 w-4" />,
      sessionId: resource.sessionId || undefined
    })
  })
  
  // Sort by date (most recent first)
  timelineItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const getIconBackground = (type: string) => {
    switch(type) {
      case 'session': return 'bg-coaching-100 text-coaching-600'
      case 'followup': return 'bg-green-100 text-green-600'
      case 'resource': return 'bg-blue-100 text-blue-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  if (timelineItems.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No activity yet. Start by creating a coaching session.</p>
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
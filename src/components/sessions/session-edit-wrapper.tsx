'use client'

import { useSession } from '@/hooks/use-sessions'
import { SessionForm } from './session-form'
import SessionEditLoading from '@/app/sessions/[id]/edit/loading'

interface SessionEditWrapperProps {
  sessionId: string
  userId: string
}

export function SessionEditWrapper({ sessionId, userId }: SessionEditWrapperProps) {
  const { data: session, isLoading } = useSession(sessionId, userId)
  
  if (isLoading) {
    return <SessionEditLoading />
  }
  
  if (!session) {
    return <div>Session not found</div>
  }
  
  return (
    <SessionForm 
      userId={userId} 
      mode="edit" 
      session={{
        id: session.id,
        title: session.title,
        clientId: session.clientId,
        date: session.date,
        transcript: session.transcript
      }}
    />
  )
}
'use client'

import { useSession } from '@/hooks/use-sessions'
import { SessionDetail } from './session-detail'
import SessionDetailLoading from '@/app/sessions/[id]/loading'

interface SessionDetailWrapperProps {
  sessionId: string
  userId: string
}

export function SessionDetailWrapper({ sessionId, userId }: SessionDetailWrapperProps) {
  const { data: session, isLoading } = useSession(sessionId, userId)
  
  if (isLoading) {
    return <SessionDetailLoading />
  }
  
  if (!session) {
    return <div>Session not found</div>
  }
  
  return <SessionDetail session={session} userId={userId} />
}
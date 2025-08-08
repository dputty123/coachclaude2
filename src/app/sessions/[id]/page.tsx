import { getUserServer } from '@/app/actions/user'
import { notFound } from 'next/navigation'
import { SessionDetailWrapper } from '@/components/sessions/session-detail-wrapper'

interface SessionDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function SessionDetailPage({ params }: SessionDetailPageProps) {
  const user = await getUserServer()
  
  if (!user) {
    notFound()
  }
  
  const { id } = await params
  
  return (
    <div className="animate-in">
      <SessionDetailWrapper sessionId={id} userId={user.id} />
    </div>
  )
}
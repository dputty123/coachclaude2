import { getUserServer } from '@/app/actions/user'
import { notFound } from 'next/navigation'
import { SessionEditWrapper } from '@/components/sessions/session-edit-wrapper'

interface SessionEditPageProps {
  params: Promise<{ id: string }>
}

export default async function SessionEditPage({ params }: SessionEditPageProps) {
  const user = await getUserServer()
  
  if (!user) {
    notFound()
  }
  
  const { id } = await params
  
  return (
    <div className="animate-in">
      <SessionEditWrapper sessionId={id} userId={user.id} />
    </div>
  )
}
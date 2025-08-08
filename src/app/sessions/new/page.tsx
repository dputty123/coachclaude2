import { getUserServer } from '@/app/actions/user'
import { notFound } from 'next/navigation'
import { SessionForm } from '@/components/sessions/session-form'

interface NewSessionPageProps {
  searchParams: Promise<{ clientId?: string }>
}

export default async function NewSessionPage({ searchParams }: NewSessionPageProps) {
  const user = await getUserServer()
  
  if (!user) {
    notFound()
  }
  
  // Get clientId from search params if provided (e.g., from client detail page)
  const params = await searchParams
  const defaultClientId = params?.clientId
  
  return (
    <div className="animate-in">
      <SessionForm 
        userId={user.id} 
        mode="create" 
        defaultClientId={defaultClientId}
      />
    </div>
  )
}
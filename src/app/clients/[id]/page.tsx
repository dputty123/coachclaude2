import { notFound } from 'next/navigation'
import { getUserServer } from '@/app/actions/user'
import { ClientDetailWrapper } from '@/components/clients/client-detail-wrapper'

interface ClientPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ClientPage({ params }: ClientPageProps) {
  const { id } = await params
  const user = await getUserServer()
  
  if (!user) {
    notFound()
  }

  return (
    <div className="animate-in">
      <ClientDetailWrapper clientId={id} userId={user.id} />
    </div>
  )
}
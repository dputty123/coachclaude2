import { notFound } from 'next/navigation'
import { getClient } from '@/app/actions/clients'
import { getUserServer } from '@/app/actions/user'
import { ClientDetail } from '@/components/clients/client-detail'

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

  const result = await getClient(id, user.id)
  
  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <div className="animate-in">
      <ClientDetail client={result.data} userId={user.id} />
    </div>
  )
}
import { getUserProfile } from '@/app/actions/profile'
import ProfileClient from './profile-client'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const result = await getUserProfile()
  
  if (!result.success || !result.data) {
    // This shouldn't happen as middleware ensures authentication
    return (
      <div className="animate-in">
        <div className="mb-6">
          <h2>Your Profile</h2>
          <p className="text-muted-foreground">
            Unable to load profile information
          </p>
        </div>
      </div>
    )
  }

  return <ProfileClient initialData={result.data} />
}
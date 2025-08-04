'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getUserProfile() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
      }
    })

    if (!profile) {
      return { success: false, error: 'User not found' }
    }

    return {
      success: true,
      data: profile
    }
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return { success: false, error: 'Failed to fetch profile' }
  }
}

export async function updateUserProfile(name: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Validate name
    if (!name || name.trim().length === 0) {
      return { success: false, error: 'Name cannot be empty' }
    }

    if (name.length > 100) {
      return { success: false, error: 'Name is too long (max 100 characters)' }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { name: name.trim() },
      select: {
        id: true,
        email: true,
        name: true,
      }
    })

    revalidatePath('/profile')
    
    return {
      success: true,
      data: updatedUser
    }
  } catch (error) {
    console.error('Error updating user profile:', error)
    return { success: false, error: 'Failed to update profile' }
  }
}
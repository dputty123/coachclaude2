'use client'

import { useQuery } from '@tanstack/react-query'
import { getUserClient } from '@/app/actions/user'

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const user = await getUserClient()
      if (!user) {
        throw new Error('User not found')
      }
      return user
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}
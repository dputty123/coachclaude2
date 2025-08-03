'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from './sidebar'
import { Header } from './header'

export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const pathname = usePathname()
  const supabase = createClient()
  
  useEffect(() => {
    // Check initial auth state
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
    }
    
    checkAuth()
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session)
    })
    
    return () => subscription.unsubscribe()
  }, [supabase])
  
  // Don't show layout on auth page
  const isAuthPage = pathname === '/auth' || pathname === '/login' || pathname === '/signup'
  
  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return <>{children}</>
  }
  
  // If on auth page or not authenticated, just show the page content
  if (isAuthPage || !isAuthenticated) {
    return <>{children}</>
  }
  
  // Show full layout for authenticated users on non-auth pages
  return (
    <div className="layout">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}
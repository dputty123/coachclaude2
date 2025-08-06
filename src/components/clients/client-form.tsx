'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from 'lucide-react'
import { useCreateClient } from '@/hooks/use-clients'
import { toast } from 'sonner'

interface ClientFormProps {
  userId: string
  mode: 'create'
}

export function ClientForm({ userId }: ClientFormProps) {
  const router = useRouter()
  const createMutation = useCreateClient()
  
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    company: '',
    email: '',
    phone: '',
    birthday: '',
    coachingSince: '',
    careerGoal: '',
    keyChallenge: '',
    keyStakeholders: '',
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    
    // Validate required fields
    if (!formData.name.trim()) {
      setErrors({ name: 'Name is required' })
      toast.error('Please enter a client name')
      return
    }
    
    // Clean up empty strings
    const cleanedData = Object.entries(formData).reduce((acc, [key, value]) => {
      const trimmedValue = value.trim()
      acc[key as keyof typeof formData] = trimmedValue === '' ? '' : trimmedValue
      return acc
    }, {} as typeof formData)
    
    try {
      await createMutation.mutateAsync({
        data: cleanedData,
        userId
      })
    } catch {
      // Error is handled by the mutation hook
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Link href="/clients">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2>Add New Client</h2>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="John Doe"
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input 
                  id="role" 
                  value={formData.role} 
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  placeholder="Chief Marketing Officer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input 
                  id="company" 
                  value={formData.company} 
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  placeholder="ABC Corp"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="john.doe@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input 
                  id="phone" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthday">Birthday</Label>
                <Input 
                  id="birthday" 
                  type="date"
                  value={formData.birthday} 
                  onChange={(e) => setFormData({...formData, birthday: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coaching-since">Coaching Start Date</Label>
                <Input 
                  id="coaching-since" 
                  type="date"
                  value={formData.coachingSince} 
                  onChange={(e) => setFormData({...formData, coachingSince: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>
          
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Career & Development</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="career-goal">Career Goal</Label>
                  <Textarea 
                    id="career-goal"
                    value={formData.careerGoal} 
                    onChange={(e) => setFormData({...formData, careerGoal: e.target.value})}
                    placeholder="e.g., CEO position within 5 years"
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="key-challenge">Key Challenge</Label>
                  <Textarea 
                    id="key-challenge"
                    value={formData.keyChallenge} 
                    onChange={(e) => setFormData({...formData, keyChallenge: e.target.value})}
                    placeholder="e.g., Building executive presence"
                    className="min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Relationships & Context</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="key-stakeholders">Key Stakeholders</Label>
                  <Input 
                    id="key-stakeholders"
                    value={formData.keyStakeholders} 
                    onChange={(e) => setFormData({...formData, keyStakeholders: e.target.value})}
                    placeholder="e.g., CEO, CTO, Sales Director"
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter stakeholder roles separated by commas
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  You can add team members and reporting relationships after creating the client.
                </p>
              </CardContent>
            </Card>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => router.push('/clients')}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Client'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
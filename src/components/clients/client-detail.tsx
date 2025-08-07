'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Calendar, MessageSquare } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ClientTimeline } from './client-timeline'
import { ClientSelector, MultiClientSelector } from './client-selector'
import { ClientNotes } from './client-notes'
import { useUpdateClient, useDeleteClient, useClients, useAddTeamMember, useRemoveTeamMember } from '@/hooks/use-clients'
import { getClient } from '@/app/actions/clients'
import type { Client, Session, ClientNote } from '@/generated/prisma'
import type { ClientFormData } from '@/hooks/use-clients'

interface ClientWithRelations extends Client {
  reportsTo: Client | null
  directReports: Client[]
  teamMembers: Client[]
  teamMemberOf: Client[]
  sessions: Session[]
  notes: ClientNote[]
  _count: {
    sessions: number
  }
}

interface ClientDetailProps {
  client: ClientWithRelations
  userId: string
}

export function ClientDetail({ client: initialClient, userId }: ClientDetailProps) {
  const router = useRouter()
  const [client, setClient] = useState<ClientWithRelations>(initialClient)
  const [isEditing, setIsEditing] = useState(false)
  const [editedClient, setEditedClient] = useState<ClientFormData | null>(null)
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  
  const { data: allClients } = useClients(userId)
  const updateMutation = useUpdateClient()
  const deleteMutation = useDeleteClient()
  const addTeamMemberMutation = useAddTeamMember()
  const removeTeamMemberMutation = useRemoveTeamMember()

  const handleStartEditing = () => {
    setEditedClient({
      name: client.name,
      role: client.role,
      company: client.company,
      email: client.email,
      phone: client.phone,
      birthday: client.birthday ? new Date(client.birthday).toISOString().split('T')[0] : '',
      coachingSince: client.coachingSince ? new Date(client.coachingSince).toISOString().split('T')[0] : '',
      careerGoal: client.careerGoal,
      keyChallenge: client.keyChallenge,
      keyStakeholders: client.keyStakeholders,
      reportsToId: client.reportsToId,
    })
    // Initialize selected team members (include both directions)
    const currentTeamMembers = [
      ...client.teamMembers.map(tm => tm.id),
      ...client.teamMemberOf.map(tm => tm.id)
    ]
    setSelectedTeamMembers(currentTeamMembers)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setEditedClient(null)
    setIsEditing(false)
    setHasUnsavedChanges(false)
  }

  const handleSaveChanges = async () => {
    if (!editedClient) return
    
    // Update basic client info
    await updateMutation.mutateAsync({
      id: client.id,
      data: editedClient,
      userId
    })
    
    // Handle team member changes (include both directions)
    const currentTeamMembers = [
      ...client.teamMembers.map(tm => tm.id),
      ...client.teamMemberOf.map(tm => tm.id)
    ]
    
    // Find members to add and remove
    const membersToAdd = selectedTeamMembers.filter(id => !currentTeamMembers.includes(id))
    const membersToRemove = currentTeamMembers.filter(id => !selectedTeamMembers.includes(id))
    
    // Add new team members
    for (const memberId of membersToAdd) {
      await addTeamMemberMutation.mutateAsync({
        clientId: client.id,
        memberId,
        userId
      })
    }
    
    // Remove team members
    for (const memberId of membersToRemove) {
      await removeTeamMemberMutation.mutateAsync({
        clientId: client.id,
        memberId,
        userId
      })
    }
    
    setIsEditing(false)
    setEditedClient(null)
    setHasUnsavedChanges(false)
    
    // Refetch the client data to get updated relationships
    const result = await getClient(client.id, userId)
    if (result.success && result.data) {
      setClient(result.data)
    }
  }

  // Check if form has unsaved changes
  const checkForUnsavedChanges = useCallback(() => {
    if (!isEditing || !editedClient) return false
    
    // Check basic fields
    const basicFieldsChanged = 
      editedClient.name !== client.name ||
      editedClient.role !== client.role ||
      editedClient.company !== client.company ||
      editedClient.email !== client.email ||
      editedClient.phone !== client.phone ||
      editedClient.careerGoal !== client.careerGoal ||
      editedClient.keyChallenge !== client.keyChallenge ||
      editedClient.keyStakeholders !== client.keyStakeholders ||
      editedClient.reportsToId !== client.reportsToId ||
      editedClient.birthday !== (client.birthday ? new Date(client.birthday).toISOString().split('T')[0] : '') ||
      editedClient.coachingSince !== (client.coachingSince ? new Date(client.coachingSince).toISOString().split('T')[0] : '')
    
    // Check team members
    const currentTeamMembers = [
      ...client.teamMembers.map(tm => tm.id),
      ...client.teamMemberOf.map(tm => tm.id)
    ]
    const teamMembersChanged = 
      selectedTeamMembers.length !== currentTeamMembers.length ||
      !selectedTeamMembers.every(id => currentTeamMembers.includes(id))
    
    return basicFieldsChanged || teamMembersChanged
  }, [isEditing, editedClient, client, selectedTeamMembers])

  // Update hasUnsavedChanges when form changes
  useEffect(() => {
    setHasUnsavedChanges(checkForUnsavedChanges())
  }, [checkForUnsavedChanges])

  // Handle navigation with unsaved changes
  const handleNavigationWithUnsavedChanges = (url: string) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(url)
      setShowUnsavedDialog(true)
    } else {
      router.push(url)
    }
  }

  // Handle dialog actions
  const handleSaveAndNavigate = async () => {
    await handleSaveChanges()
    if (pendingNavigation) {
      router.push(pendingNavigation)
    }
  }

  const handleDiscardAndNavigate = () => {
    setShowUnsavedDialog(false)
    if (pendingNavigation) {
      router.push(pendingNavigation)
    }
  }

  const handleDeleteClient = async () => {
    if (confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      await deleteMutation.mutateAsync({ id: client.id, userId })
    }
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Not specified'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/clients">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h2>{client.name}</h2>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDeleteClient}>
          Delete Client
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Client Information</CardTitle>
            {!isEditing && (
              <Button variant="ghost" size="sm" onClick={handleStartEditing}>
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing && editedClient ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="client-name">Name</Label>
                  <Input 
                    id="client-name" 
                    value={editedClient.name || ''} 
                    onChange={(e) => setEditedClient({...editedClient, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-role">Role</Label>
                  <Input 
                    id="client-role" 
                    value={editedClient.role || ''} 
                    onChange={(e) => setEditedClient({...editedClient, role: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-company">Company</Label>
                  <Input 
                    id="client-company" 
                    value={editedClient.company || ''} 
                    onChange={(e) => setEditedClient({...editedClient, company: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-email">Email</Label>
                  <Input 
                    id="client-email" 
                    type="email"
                    value={editedClient.email || ''} 
                    onChange={(e) => setEditedClient({...editedClient, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-phone">Phone</Label>
                  <Input 
                    id="client-phone" 
                    value={editedClient.phone || ''} 
                    onChange={(e) => setEditedClient({...editedClient, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-birthday">Birthday</Label>
                  <Input 
                    id="client-birthday" 
                    type="date"
                    value={editedClient.birthday || ''} 
                    onChange={(e) => setEditedClient({...editedClient, birthday: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-start-date">Coaching Start Date</Label>
                  <Input 
                    id="client-start-date" 
                    type="date"
                    value={editedClient.coachingSince || ''} 
                    onChange={(e) => setEditedClient({...editedClient, coachingSince: e.target.value})}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-muted-foreground">Role</span>
                  <span className="font-medium">{client.role || 'Not specified'}</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-muted-foreground">Company</span>
                  <span className="font-medium">{client.company || 'Not specified'}</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="font-medium">{client.email || 'Not specified'}</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-muted-foreground">Phone</span>
                  <span className="font-medium">{client.phone || 'Not specified'}</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-muted-foreground">Birthday</span>
                  <span className="font-medium">{formatDate(client.birthday)}</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-muted-foreground">Coaching since</span>
                  <span className="font-medium">{formatDate(client.coachingSince)}</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-muted-foreground">Total Sessions</span>
                  <span className="font-medium">{client._count.sessions}</span>
                </div>
              </>
            )}
          </CardContent>
          {isEditing && (
            <CardFooter className="px-6 py-4 border-t flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
              <Button onClick={handleSaveChanges}>Save Changes</Button>
            </CardFooter>
          )}
          {!isEditing && (
            <CardFooter className="px-6 py-4 border-t">
              <div className="flex flex-col space-y-2 w-full">
                <Button className="w-full" onClick={() => router.push(`/sessions/new?clientId=${client.id}`)}>
                  <MessageSquare className="h-4 w-4 mr-2" /> New Session
                </Button>
                <Button variant="outline" className="w-full">
                  <Calendar className="h-4 w-4 mr-2" /> Schedule Meeting
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
        
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Career & Development</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing && editedClient ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="career-goal">Career Goal</Label>
                    <Textarea 
                      id="career-goal"
                      value={editedClient.careerGoal || ''} 
                      onChange={(e) => setEditedClient({...editedClient, careerGoal: e.target.value})}
                      placeholder="e.g., CEO position within 5 years"
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="key-challenge">Key Challenge</Label>
                    <Textarea 
                      id="key-challenge"
                      value={editedClient.keyChallenge || ''} 
                      onChange={(e) => setEditedClient({...editedClient, keyChallenge: e.target.value})}
                      placeholder="e.g., Building executive presence"
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Career Goal</h4>
                    <div className="p-3 border rounded-md">
                      <p>{client.careerGoal || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Key Challenge</h4>
                    <div className="p-3 border rounded-md">
                      <p>{client.keyChallenge || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Relationships & Context</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing && editedClient ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reports-to">Reports To</Label>
                    <ClientSelector
                      clients={allClients || []}
                      value={editedClient.reportsToId}
                      onChange={(value) => setEditedClient({...editedClient, reportsToId: value})}
                      placeholder="Select manager..."
                      excludeId={client.id}
                      onNavigateToNewClient={() => handleNavigationWithUnsavedChanges('/clients/new')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team-members">Team Members</Label>
                    <MultiClientSelector
                      clients={allClients || []}
                      value={selectedTeamMembers}
                      onChange={setSelectedTeamMembers}
                      placeholder="Select team members..."
                      excludeId={client.id}
                      onNavigateToNewClient={() => handleNavigationWithUnsavedChanges('/clients/new')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="key-stakeholders">Key Stakeholders</Label>
                    <Input 
                      id="key-stakeholders"
                      value={editedClient.keyStakeholders || ''} 
                      onChange={(e) => setEditedClient({...editedClient, keyStakeholders: e.target.value})}
                      placeholder="e.g., CEO, CTO, Sales Director"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Reports to</h4>
                    <div className="p-3 border rounded-md">
                      {client.reportsTo ? (
                        <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md">
                          {client.reportsTo.name}
                        </span>
                      ) : (
                        <p className="text-muted-foreground">Not specified</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Key Stakeholders</h4>
                    <div className="p-3 border rounded-md">
                      <p>{client.keyStakeholders || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <h4 className="font-medium text-sm">Team Members</h4>
                    <div className="p-3 border rounded-md">
                      {client.teamMembers.length > 0 || client.teamMemberOf.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {client.teamMembers.map((member) => (
                            <span key={member.id} className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md">
                              {member.name}
                            </span>
                          ))}
                          {client.teamMemberOf.map((member) => (
                            <span key={member.id} className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md">
                              {member.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No team members</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Tabs defaultValue="timeline">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            <TabsContent value="timeline" className="mt-6">
              <ClientTimeline 
                clientId={client.id} 
                sessions={client.sessions}
                notes={client.notes}
              />
            </TabsContent>
            <TabsContent value="notes">
              <Card>
                <CardContent className="p-6">
                  <ClientNotes 
                    clientId={client.id}
                    userId={userId}
                    notes={client.notes}
                    onNoteCreated={(note) => {
                      setClient(prev => ({
                        ...prev,
                        notes: [note, ...prev.notes]
                      }))
                    }}
                    onNoteUpdated={(updatedNote) => {
                      setClient(prev => ({
                        ...prev,
                        notes: prev.notes.map(note => 
                          note.id === updatedNote.id ? updatedNote : note
                        )
                      }))
                    }}
                    onNoteDeleted={(noteId) => {
                      setClient(prev => ({
                        ...prev,
                        notes: prev.notes.filter(note => note.id !== noteId)
                      }))
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Do you want to save them before leaving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowUnsavedDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <Button variant="outline" onClick={handleDiscardAndNavigate}>
              Discard Changes
            </Button>
            <AlertDialogAction onClick={handleSaveAndNavigate}>
              Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
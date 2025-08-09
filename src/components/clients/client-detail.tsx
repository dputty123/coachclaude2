'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { usePrepareForSession } from '@/hooks/use-session-ai'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Calendar, MessageSquare, Sparkles, Copy, Check } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { ClientTimeline } from './client-timeline'
import { ClientSelector, MultiClientSelector } from './client-selector'
import { ClientNotes } from './client-notes'
import { useUpdateClient, useDeleteClient, useClients, useAddTeamMember, useRemoveTeamMember } from '@/hooks/use-clients'
import type { Client, Session, ClientNote, ClientResource } from '@/generated/prisma'
import type { ClientFormData } from '@/hooks/use-clients'

interface ClientWithRelations extends Client {
  reportsTo: Client | null
  directReports: Client[]
  teamMembers: Client[]
  teamMemberOf: Client[]
  sessions: Session[]
  notes: ClientNote[]
  resources: ClientResource[] // ClientResource with Resource relation
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
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPreparationDialog, setShowPreparationDialog] = useState(false)
  const [preparationNotes, setPreparationNotes] = useState<string | null>(null)
  const [copiedPreparation, setCopiedPreparation] = useState(false)
  
  const { data: allClients } = useClients(userId)
  const updateMutation = useUpdateClient()
  const deleteMutation = useDeleteClient()
  const addTeamMemberMutation = useAddTeamMember()
  const removeTeamMemberMutation = useRemoveTeamMember()
  const prepareForSession = usePrepareForSession()

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
    
    setIsSaving(true)
    try {
      // Update basic client info
      const updatedClient = await updateMutation.mutateAsync({
        id: client.id,
        data: editedClient,
        userId
      })
      
      // Optimistically update local state with the updated client info
      if (updatedClient) {
        setClient(prev => ({
          ...prev,
          ...updatedClient,
          // Preserve relations that aren't updated by the basic update
          reportsTo: editedClient.reportsToId !== prev.reportsToId 
            ? allClients?.find(c => c.id === editedClient.reportsToId) || null 
            : prev.reportsTo,
          teamMembers: prev.teamMembers,
          teamMemberOf: prev.teamMemberOf,
          sessions: prev.sessions,
          notes: prev.notes,
          _count: prev._count
        }))
      }
      
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
        
        // Optimistically update team members
        const member = allClients?.find(c => c.id === memberId)
        if (member) {
          setClient(prev => ({
            ...prev,
            teamMembers: [...prev.teamMembers, member]
          }))
        }
      }
      
      // Remove team members
      for (const memberId of membersToRemove) {
        await removeTeamMemberMutation.mutateAsync({
          clientId: client.id,
          memberId,
          userId
        })
        
        // Optimistically remove from team members
        setClient(prev => ({
          ...prev,
          teamMembers: prev.teamMembers.filter(tm => tm.id !== memberId),
          teamMemberOf: prev.teamMemberOf.filter(tm => tm.id !== memberId)
        }))
      }
      
      setIsEditing(false)
      setEditedClient(null)
      setHasUnsavedChanges(false)
    } finally {
      setIsSaving(false)
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
    setShowUnsavedDialog(false)
    await handleSaveChanges()
    if (pendingNavigation) {
      toast.loading('Navigating to create new client...', { id: 'navigation' })
      // Small delay to ensure state is updated
      setTimeout(() => {
        router.push(pendingNavigation)
        toast.dismiss('navigation')
      }, 100)
    }
  }

  const handleDiscardAndNavigate = () => {
    setShowUnsavedDialog(false)
    if (pendingNavigation) {
      router.push(pendingNavigation)
    }
  }

  const handleDeleteClient = async () => {
    setIsDeleting(true)
    try {
      await deleteMutation.mutateAsync({ id: client.id, userId })
      setShowDeleteDialog(false)
    } catch {
      // Error is handled by the mutation
      setIsDeleting(false)
    }
  }
  
  const handlePrepareForSession = async () => {
    const result = await prepareForSession.mutateAsync({ 
      clientId: client.id, 
      userId 
    })
    
    if (result?.success && result?.data?.preparationNotes) {
      setPreparationNotes(result.data.preparationNotes)
      setShowPreparationDialog(true)
      setCopiedPreparation(false)
    }
  }
  
  const handleCopyPreparation = async () => {
    if (!preparationNotes) return
    
    try {
      await navigator.clipboard.writeText(preparationNotes)
      setCopiedPreparation(true)
      toast.success('Preparation notes copied to clipboard')
      setTimeout(() => setCopiedPreparation(false), 2000)
    } catch {
      toast.error('Failed to copy to clipboard')
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
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleStartEditing}
            disabled={isEditing}
            className="h-9 px-4"
          >
            Edit Client
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => setShowDeleteDialog(true)}
            className="h-9 px-4"
          >
            Delete Client
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
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
              <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>Cancel</Button>
              <Button onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          )}
          {!isEditing && (
            <CardFooter className="px-6 py-4 border-t">
              <div className="flex flex-col space-y-2 w-full">
                <Button className="w-full" onClick={() => router.push(`/sessions/new?clientId=${client.id}`)}>
                  <MessageSquare className="h-4 w-4 mr-2" /> New Session
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handlePrepareForSession}
                  disabled={prepareForSession.isPending}
                >
                  {prepareForSession.isPending ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                      Preparing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Prepare for Session
                    </>
                  )}
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
                        <Link href={`/clients/${client.reportsTo.id}`}>
                          <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md hover:bg-secondary/80 transition-colors cursor-pointer inline-block">
                            {client.reportsTo.name}
                          </span>
                        </Link>
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
                            <Link key={member.id} href={`/clients/${member.id}`}>
                              <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md hover:bg-secondary/80 transition-colors cursor-pointer inline-block">
                                {member.name}
                              </span>
                            </Link>
                          ))}
                          {client.teamMemberOf.map((member) => (
                            <Link key={member.id} href={`/clients/${member.id}`}>
                              <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md hover:bg-secondary/80 transition-colors cursor-pointer inline-block">
                                {member.name}
                              </span>
                            </Link>
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
                resources={client.resources}
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
            <AlertDialogAction onClick={handleSaveAndNavigate} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteClient}
        title="Delete Client"
        description={`Are you sure you want to delete ${client.name}? This will permanently delete the client and all associated sessions, notes, and data.`}
        confirmText="Delete Client"
        isDeleting={isDeleting}
      />
      
      <Dialog open={showPreparationDialog} onOpenChange={setShowPreparationDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Session Preparation Notes
            </DialogTitle>
            <DialogDescription>
              AI-generated insights to help you prepare for your next session with {client.name}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            <div className="whitespace-pre-wrap">
              {preparationNotes}
            </div>
          </ScrollArea>
          
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handleCopyPreparation}
              className="flex items-center gap-2"
            >
              {copiedPreparation ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy to Clipboard
                </>
              )}
            </Button>
            <Button onClick={() => setShowPreparationDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
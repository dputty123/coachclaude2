'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Client validation schema - only name is required
const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  birthday: z.string().optional().nullable(),
  coachingSince: z.string().optional().nullable(),
  careerGoal: z.string().optional().nullable(),
  keyChallenge: z.string().optional().nullable(),
  keyStakeholders: z.string().optional().nullable(),
  reportsToId: z.string().optional().nullable(),
})

// Get all clients for a user
export async function getClients(userId: string) {
  try {
    const clients = await prisma.client.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { sessions: true }
        }
      }
    })
    return { success: true, data: clients }
  } catch (error) {
    console.error('Error fetching clients:', error)
    return { success: false, error: 'Failed to fetch clients' }
  }
}

// Get a single client with all relations
export async function getClient(id: string, userId: string) {
  try {
    const client = await prisma.client.findFirst({
      where: { 
        id,
        userId // Ensure user owns this client
      },
      include: {
        reportsTo: true,
        directReports: true,
        teamMembers: true,
        teamMemberOf: true,
        sessions: {
          orderBy: { date: 'desc' },
          take: 10 // Limit to recent sessions for performance
        },
        notes: {
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { sessions: true }
        }
      }
    })

    if (!client) {
      return { success: false, error: 'Client not found' }
    }

    return { success: true, data: client }
  } catch (error) {
    console.error('Error fetching client:', error)
    return { success: false, error: 'Failed to fetch client' }
  }
}

// Create a new client
export async function createClient(data: z.infer<typeof clientSchema>, userId: string) {
  try {
    const validated = clientSchema.parse(data)
    
    const client = await prisma.client.create({
      data: {
        name: validated.name,
        userId,
        role: validated.role || null,
        company: validated.company || null,
        email: validated.email || null,
        phone: validated.phone || null,
        birthday: validated.birthday ? new Date(validated.birthday) : null,
        coachingSince: validated.coachingSince ? new Date(validated.coachingSince) : null,
        careerGoal: validated.careerGoal || null,
        keyChallenge: validated.keyChallenge || null,
        keyStakeholders: validated.keyStakeholders || null,
        reportsToId: validated.reportsToId || null
      }
    })

    revalidatePath('/clients')
    return { success: true, data: client }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues?.[0]?.message || 'Validation error' }
    }
    console.error('Error creating client:', error)
    return { success: false, error: 'Failed to create client' }
  }
}

// Update a client
export async function updateClient(
  id: string, 
  data: z.infer<typeof clientSchema>, 
  userId: string
) {
  try {
    // Verify ownership
    const existing = await prisma.client.findFirst({
      where: { id, userId }
    })
    
    if (!existing) {
      return { success: false, error: 'Client not found' }
    }

    const validated = clientSchema.parse(data)
    
    const client = await prisma.client.update({
      where: { id },
      data: {
        name: validated.name,
        role: validated.role || null,
        company: validated.company || null,
        email: validated.email || null,
        phone: validated.phone || null,
        birthday: validated.birthday ? new Date(validated.birthday) : null,
        coachingSince: validated.coachingSince ? new Date(validated.coachingSince) : null,
        careerGoal: validated.careerGoal || null,
        keyChallenge: validated.keyChallenge || null,
        keyStakeholders: validated.keyStakeholders || null,
        reportsToId: validated.reportsToId || null
      }
    })

    revalidatePath('/clients')
    revalidatePath(`/clients/${id}`)
    return { success: true, data: client }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues?.[0]?.message || 'Validation error' }
    }
    console.error('Error updating client:', error)
    return { success: false, error: 'Failed to update client' }
  }
}

// Delete a client
export async function deleteClient(id: string, userId: string) {
  try {
    // Verify ownership
    const existing = await prisma.client.findFirst({
      where: { id, userId }
    })
    
    if (!existing) {
      return { success: false, error: 'Client not found' }
    }

    await prisma.client.delete({
      where: { id }
    })

    revalidatePath('/clients')
    return { success: true }
  } catch (error) {
    console.error('Error deleting client:', error)
    return { success: false, error: 'Failed to delete client' }
  }
}

// Add team member relationship
export async function addTeamMember(clientId: string, memberId: string, userId: string) {
  try {
    // Verify both clients belong to the user
    const [client, member] = await Promise.all([
      prisma.client.findFirst({ where: { id: clientId, userId } }),
      prisma.client.findFirst({ where: { id: memberId, userId } })
    ])

    if (!client || !member) {
      return { success: false, error: 'Client not found' }
    }

    // Check if already team members
    const currentClient = await prisma.client.findUnique({
      where: { id: clientId },
      include: { teamMembers: true }
    })

    if (currentClient?.teamMembers.some(tm => tm.id === memberId)) {
      return { success: false, error: 'Already team members' }
    }

    // Add team member (automatically bidirectional)
    await prisma.client.update({
      where: { id: clientId },
      data: {
        teamMembers: {
          connect: { id: memberId }
        }
      }
    })

    revalidatePath(`/clients/${clientId}`)
    revalidatePath(`/clients/${memberId}`)
    return { success: true }
  } catch (error) {
    console.error('Error adding team member:', error)
    return { success: false, error: 'Failed to add team member' }
  }
}

// Remove team member relationship
export async function removeTeamMember(clientId: string, memberId: string, userId: string) {
  try {
    // Verify ownership
    const client = await prisma.client.findFirst({
      where: { id: clientId, userId }
    })

    if (!client) {
      return { success: false, error: 'Client not found' }
    }

    // Remove team member (automatically bidirectional)
    await prisma.client.update({
      where: { id: clientId },
      data: {
        teamMembers: {
          disconnect: { id: memberId }
        }
      }
    })

    revalidatePath(`/clients/${clientId}`)
    revalidatePath(`/clients/${memberId}`)
    return { success: true }
  } catch (error) {
    console.error('Error removing team member:', error)
    return { success: false, error: 'Failed to remove team member' }
  }
}

// Client Notes Actions

// Create a new note for a client
export async function createClientNote(clientId: string, content: string, userId: string) {
  try {
    // Verify the client belongs to the user
    const client = await prisma.client.findFirst({
      where: { id: clientId, userId }
    })

    if (!client) {
      return { success: false, error: 'Client not found' }
    }

    const note = await prisma.clientNote.create({
      data: {
        clientId,
        content
      }
    })

    revalidatePath(`/clients/${clientId}`)
    return { success: true, data: note }
  } catch (error) {
    console.error('Error creating note:', error)
    return { success: false, error: 'Failed to create note' }
  }
}

// Update a client note
export async function updateClientNote(noteId: string, content: string, userId: string) {
  try {
    // Verify ownership through the client
    const note = await prisma.clientNote.findFirst({
      where: { 
        id: noteId,
        client: { userId }
      }
    })

    if (!note) {
      return { success: false, error: 'Note not found' }
    }

    const updatedNote = await prisma.clientNote.update({
      where: { id: noteId },
      data: { content }
    })

    revalidatePath(`/clients/${note.clientId}`)
    return { success: true, data: updatedNote }
  } catch (error) {
    console.error('Error updating note:', error)
    return { success: false, error: 'Failed to update note' }
  }
}

// Delete a client note
export async function deleteClientNote(noteId: string, userId: string) {
  try {
    // Verify ownership through the client
    const note = await prisma.clientNote.findFirst({
      where: { 
        id: noteId,
        client: { userId }
      }
    })

    if (!note) {
      return { success: false, error: 'Note not found' }
    }

    await prisma.clientNote.delete({
      where: { id: noteId }
    })

    revalidatePath(`/clients/${note.clientId}`)
    return { success: true }
  } catch (error) {
    console.error('Error deleting note:', error)
    return { success: false, error: 'Failed to delete note' }
  }
}
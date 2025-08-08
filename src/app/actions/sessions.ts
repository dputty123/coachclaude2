'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Session validation schema - no tags during creation
const createSessionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  clientId: z.string().min(1, "Client is required"),
  date: z.string().min(1, "Session date is required"),
  transcript: z.string().optional().nullable(),
})

// Separate update schema type (not used for validation)
type UpdateSessionData = {
  title?: string
  clientId?: string
  date?: string | null
  transcript?: string | null
  summary?: string | null
  followUpEmail?: string | null
  analysis?: string | null
  preparationNotes?: string | null
}

// Get all sessions for a user
export async function getSessions(userId: string) {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        client: true,
        tags: {
          include: {
            tag: true
          }
        },
        _count: {
          select: { resources: true }
        }
      }
    })
    
    return { success: true, data: sessions }
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return { success: false, error: 'Failed to fetch sessions' }
  }
}

// Get sessions for a specific client
export async function getClientSessions(clientId: string, userId: string) {
  try {
    const sessions = await prisma.session.findMany({
      where: { 
        clientId,
        userId // Ensure user owns these sessions
      },
      orderBy: { date: 'desc' },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        _count: {
          select: { resources: true }
        }
      }
    })
    
    return { success: true, data: sessions }
  } catch (error) {
    console.error('Error fetching client sessions:', error)
    return { success: false, error: 'Failed to fetch client sessions' }
  }
}

// Get a single session with all details
export async function getSession(id: string, userId: string) {
  try {
    const session = await prisma.session.findFirst({
      where: { 
        id,
        userId // Ensure user owns this session
      },
      include: {
        client: true,
        tags: {
          include: {
            tag: true
          }
        },
        resources: {
          include: {
            resource: true
          }
        }
      }
    })

    if (!session) {
      return { success: false, error: 'Session not found' }
    }

    return { success: true, data: session }
  } catch (error) {
    console.error('Error fetching session:', error)
    return { success: false, error: 'Failed to fetch session' }
  }
}

// Create a new session
export async function createSession(data: z.infer<typeof createSessionSchema>, userId: string) {
  try {
    const validated = createSessionSchema.parse(data)
    
    // Verify client belongs to user
    const client = await prisma.client.findFirst({
      where: {
        id: validated.clientId,
        userId
      }
    })
    
    if (!client) {
      return { success: false, error: 'Client not found' }
    }
    
    const session = await prisma.session.create({
      data: {
        title: validated.title,
        clientId: validated.clientId,
        userId,
        date: new Date(validated.date),
        transcript: validated.transcript || null,
      },
      include: {
        client: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
    })
    
    revalidatePath('/sessions')
    revalidatePath(`/clients/${validated.clientId}`)
    
    return { success: true, data: session }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error('Error creating session:', error)
    return { success: false, error: 'Failed to create session' }
  }
}

// Update a session
export async function updateSession(
  id: string, 
  data: Partial<UpdateSessionData>,
  userId: string
) {
  try {
    // Verify session belongs to user
    const existingSession = await prisma.session.findFirst({
      where: { id, userId }
    })
    
    if (!existingSession) {
      return { success: false, error: 'Session not found' }
    }
    
    const updateData: Record<string, unknown> = {}
    
    if (data.title !== undefined) updateData.title = data.title
    if (data.date !== undefined) updateData.date = data.date ? new Date(data.date) : null
    if (data.transcript !== undefined) updateData.transcript = data.transcript
    if (data.summary !== undefined) updateData.summary = data.summary
    if (data.followUpEmail !== undefined) updateData.followUpEmail = data.followUpEmail
    if (data.analysis !== undefined) updateData.analysis = data.analysis
    if (data.preparationNotes !== undefined) updateData.preparationNotes = data.preparationNotes
    
    const session = await prisma.session.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
    })
    
    revalidatePath('/sessions')
    revalidatePath(`/sessions/${id}`)
    revalidatePath(`/clients/${session.clientId}`)
    
    return { success: true, data: session }
  } catch (error) {
    console.error('Error updating session:', error)
    return { success: false, error: 'Failed to update session' }
  }
}

// Delete a session
export async function deleteSession(id: string, userId: string) {
  try {
    // Verify session belongs to user
    const session = await prisma.session.findFirst({
      where: { id, userId }
    })
    
    if (!session) {
      return { success: false, error: 'Session not found' }
    }
    
    await prisma.session.delete({
      where: { id }
    })
    
    revalidatePath('/sessions')
    revalidatePath(`/clients/${session.clientId}`)
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting session:', error)
    return { success: false, error: 'Failed to delete session' }
  }
}

// Update session tags (after AI analysis)
export async function updateSessionTags(
  sessionId: string,
  tagNames: string[],
  userId: string
) {
  try {
    // Verify session belongs to user
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId }
    })
    
    if (!session) {
      return { success: false, error: 'Session not found' }
    }
    
    // Delete existing tags
    await prisma.sessionTag.deleteMany({
      where: { sessionId }
    })
    
    // Add new tags
    const tags = await prisma.tag.findMany({
      where: {
        name: { in: tagNames },
        category: 'session'
      }
    })
    
    if (tags.length > 0) {
      await prisma.sessionTag.createMany({
        data: tags.map(tag => ({
          sessionId,
          tagId: tag.id
        }))
      })
    }
    
    // Return updated session
    const updatedSession = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    })
    
    revalidatePath(`/sessions/${sessionId}`)
    
    return { success: true, data: updatedSession }
  } catch (error) {
    console.error('Error updating session tags:', error)
    return { success: false, error: 'Failed to update session tags' }
  }
}

// Get all session tags for dropdown
export async function getSessionTags() {
  try {
    const tags = await prisma.tag.findMany({
      where: { category: 'session' },
      orderBy: { name: 'asc' }
    })
    
    return { success: true, data: tags }
  } catch (error) {
    console.error('Error fetching session tags:', error)
    return { success: false, error: 'Failed to fetch tags' }
  }
}
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { 
  generateSessionAnalysis, 
  generatePreparationNotes,
  discoverResources 
} from '@/lib/ai/session-ai-service'

// Analyze a session (generate summary, follow-up email, tags, etc.)
export async function analyzeSession(sessionId: string, userId: string) {
  try {
    // Verify session belongs to user
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId },
      select: { 
        id: true, 
        transcript: true,
        clientId: true
      }
    })
    
    if (!session) {
      return { success: false, error: 'Session not found' }
    }
    
    if (!session.transcript) {
      return { success: false, error: 'No transcript available for analysis' }
    }
    
    // Check if user has API key configured
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { claudeApiKey: true }
    })
    
    if (!user?.claudeApiKey) {
      return { 
        success: false, 
        error: 'Please configure your Claude API key in settings to use AI analysis' 
      }
    }
    
    // Generate analysis
    const result = await generateSessionAnalysis(sessionId, userId)
    
    if (result.error) {
      return { success: false, error: result.error }
    }
    
    // Revalidate paths
    revalidatePath(`/sessions/${sessionId}`)
    revalidatePath('/sessions')
    revalidatePath(`/clients/${session.clientId}`)
    
    return { 
      success: true, 
      data: {
        summary: result.summary,
        followUpEmail: result.followUpEmail,
        analysis: result.customAnalysis,
        tags: result.tags
      }
    }
  } catch (error) {
    console.error('Error analyzing session:', error)
    return { success: false, error: 'Failed to analyze session' }
  }
}

// Generate preparation notes for an upcoming session
export async function prepareForSession(clientId: string, userId: string) {
  try {
    // Verify client belongs to user
    const client = await prisma.client.findFirst({
      where: { id: clientId, userId }
    })
    
    if (!client) {
      return { success: false, error: 'Client not found' }
    }
    
    // Check if user has API key configured
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { claudeApiKey: true }
    })
    
    if (!user?.claudeApiKey) {
      return { 
        success: false, 
        error: 'Please configure your Claude API key in settings to use AI preparation' 
      }
    }
    
    // Generate preparation notes
    const result = await generatePreparationNotes(clientId, userId)
    
    if (result.error) {
      return { success: false, error: result.error }
    }
    
    return { 
      success: true, 
      data: {
        preparationNotes: result.preparationNotes
      }
    }
  } catch (error) {
    console.error('Error preparing for session:', error)
    return { success: false, error: 'Failed to generate preparation notes' }
  }
}

// Discover resources for a session
export async function discoverSessionResources(sessionId: string, userId: string) {
  try {
    // Verify session belongs to user
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId },
      select: { id: true, transcript: true }
    })
    
    if (!session) {
      return { success: false, error: 'Session not found' }
    }
    
    if (!session.transcript) {
      return { success: false, error: 'No transcript available for resource discovery' }
    }
    
    // Check if user has API key configured
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { claudeApiKey: true }
    })
    
    if (!user?.claudeApiKey) {
      return { 
        success: false, 
        error: 'Please configure your Claude API key in settings to discover resources' 
      }
    }
    
    // Discover resources
    const result = await discoverResources(sessionId, userId)
    
    if (result.error) {
      return { success: false, error: result.error }
    }
    
    // TODO: Save discovered resources to database
    // This would involve creating Resource records and linking them to the session
    
    return { 
      success: true, 
      data: {
        resources: result.resources
      }
    }
  } catch (error) {
    console.error('Error discovering resources:', error)
    return { success: false, error: 'Failed to discover resources' }
  }
}

// Re-analyze a session (useful if prompts or context have changed)
export async function reanalyzeSession(sessionId: string, userId: string) {
  try {
    // Clear existing analysis
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        summary: null,
        followUpEmail: null,
        analysis: null
      }
    })
    
    // Clear existing tags
    await prisma.sessionTag.deleteMany({
      where: { sessionId }
    })
    
    // Run fresh analysis
    return await analyzeSession(sessionId, userId)
  } catch (error) {
    console.error('Error re-analyzing session:', error)
    return { success: false, error: 'Failed to re-analyze session' }
  }
}
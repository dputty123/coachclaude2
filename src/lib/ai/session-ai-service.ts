import { prisma } from '@/lib/prisma'
import { callClaudeAPI, validateApiKey } from './claude-service'
import { getAllUserContextDocuments } from '@/app/actions/context-documents'
import {
  SUMMARY_PROMPT,
  FOLLOWUP_EMAIL_PROMPT,
  RESOURCE_DISCOVERY_PROMPT,
  SESSION_TAGS_PROMPT,
  DEFAULT_CLAUDE_MODEL
} from '@/lib/constants/session-prompts'

interface AnalysisResult {
  summary?: string
  followUpEmail?: string
  customAnalysis?: string
  tags?: string[]
  resources?: Array<{
    title: string
    type: string
    url?: string
    description: string
    tags: string[]
  }>
  error?: string
}

interface ParsedResource {
  title: string
  type: string
  url?: string
  description: string
  tags: string[]
}

// Core function to generate content with context
async function generateWithContext(
  systemPrompt: string,
  transcript: string,
  userId: string,
  includeContext: boolean = true
): Promise<{ content: string; error?: string }> {
  // 1. Get user and validate API key
  const user = await prisma.user.findUnique({ 
    where: { id: userId },
    select: {
      claudeApiKey: true,
      claudeModel: true
    }
  })

  if (!user) {
    return { content: '', error: 'User not found' }
  }

  const { valid, apiKey, error } = await validateApiKey(user.claudeApiKey)
  if (!valid || !apiKey) {
    return { content: '', error }
  }

  // 2. Get context documents if needed
  let contextContent = ''
  if (includeContext) {
    const contextResult = await getAllUserContextDocuments()
    if (contextResult.success && contextResult.data?.combinedContent) {
      contextContent = contextResult.data.combinedContent
    }
  }

  // 3. Build full prompt
  const fullPrompt = `
${contextContent ? `CONTEXT INFORMATION:\n${contextContent}\n\n` : ''}
${systemPrompt}

Session Transcript:
${transcript}
`

  // 4. Call Claude API
  const response = await callClaudeAPI(
    fullPrompt,
    apiKey,
    user.claudeModel || DEFAULT_CLAUDE_MODEL
  )

  return response
}


// Helper function to parse resources from text
function parseResourcesFromText(text: string): ParsedResource[] {
  const resources: ParsedResource[] = []
  
  // Split by common separators (numbered lists, bullets, etc.)
  const lines = text.split(/\n/).filter(line => line.trim())
  
  let currentResource: Partial<ParsedResource> | null = null
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    // Check if this is a new resource (starts with number, bullet, or title keywords)
    if (/^[\d\-\*•]/.test(trimmed) || /^(title:|resource:)/i.test(trimmed)) {
      // Save previous resource if exists
      if (currentResource?.title) {
        resources.push({
          title: currentResource.title,
          type: currentResource.type || 'article',
          url: currentResource.url,
          description: currentResource.description || '',
          tags: currentResource.tags || []
        })
      }
      
      // Start new resource
      currentResource = {
        title: trimmed.replace(/^[\d\-\*•\.]+\s*/, '').replace(/^(title:|resource:)\s*/i, ''),
        type: 'article',
        tags: []
      }
    } else if (currentResource) {
      // Add details to current resource
      const lowerLine = trimmed.toLowerCase()
      
      if (lowerLine.includes('type:') || lowerLine.includes('format:')) {
        currentResource.type = trimmed.split(/type:|format:/i)[1]?.trim() || 'article'
      } else if (lowerLine.includes('url:') || lowerLine.includes('link:') || lowerLine.startsWith('http')) {
        currentResource.url = trimmed.replace(/^(url:|link:)\s*/i, '')
      } else if (lowerLine.includes('description:') || lowerLine.includes('why:')) {
        currentResource.description = trimmed.replace(/^(description:|why:)\s*/i, '')
      } else if (!currentResource.description) {
        // If no description yet, treat as description
        currentResource.description = trimmed
      }
    }
  }
  
  // Don't forget the last resource
  if (currentResource?.title) {
    resources.push({
      title: currentResource.title,
      type: currentResource.type || 'article',
      url: currentResource.url,
      description: currentResource.description || '',
      tags: currentResource.tags || []
    })
  }
  
  // Limit to 0-3 resources as per spec
  return resources.slice(0, 3)
}

// Helper function to parse resources from JSON
function parseResourcesFromJSON(jsonString: string): ParsedResource[] {
  try {
    const parsed = JSON.parse(jsonString)
    if (Array.isArray(parsed)) {
      return parsed.slice(0, 3).map(r => ({
        title: r.title || '',
        type: r.type || 'article',
        url: r.url,
        description: r.description || '',
        tags: Array.isArray(r.tags) ? r.tags : []
      }))
    }
  } catch {
    // Not valid JSON, return empty
  }
  return []
}

// Generate full session analysis - simplified approach
export async function generateSessionAnalysis(
  sessionId: string,
  userId: string
): Promise<AnalysisResult> {
  try {
    // Get session with transcript
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId },
      select: {
        transcript: true,
        user: {
          select: {
            analysisPrompt: true
          }
        }
      }
    })

    if (!session || !session.transcript) {
      return { error: 'Session not found or no transcript available' }
    }

    // Generate all components in parallel - no smart detection needed
    const [
      summaryResult,
      emailResult,
      resourcesResult,
      analysisResult,
      tagsResult
    ] = await Promise.all([
      // Always generate summary
      generateWithContext(SUMMARY_PROMPT, session.transcript, userId),
      
      // Always generate follow-up email
      generateWithContext(FOLLOWUP_EMAIL_PROMPT, session.transcript, userId),
      
      // Always generate resources (0-3)
      generateWithContext(RESOURCE_DISCOVERY_PROMPT, session.transcript, userId, false),
      
      // Generate custom analysis if user has a prompt
      session.user.analysisPrompt
        ? generateWithContext(session.user.analysisPrompt, session.transcript, userId)
        : Promise.resolve({ content: '', error: undefined }),
      
      // Always generate tags
      generateWithContext(SESSION_TAGS_PROMPT, session.transcript, userId, false)
    ])

    // Check for any errors
    if (summaryResult.error) return { error: summaryResult.error }
    if (emailResult.error) return { error: emailResult.error }
    if (resourcesResult.error) return { error: resourcesResult.error }
    if (analysisResult.error) return { error: analysisResult.error }
    if (tagsResult.error) return { error: tagsResult.error }

    // Parse resources - try JSON first, then text
    let resources: ParsedResource[] = parseResourcesFromJSON(resourcesResult.content)
    if (resources.length === 0) {
      resources = parseResourcesFromText(resourcesResult.content)
    }

    // Parse tags
    const tagNames = tagsResult.content
      .split(',')
      .map((tag: string) => tag.trim().toLowerCase())
      .filter((tag: string) => tag.length > 0)

    // Update session with analysis results
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        summary: summaryResult.content || null,
        followUpEmail: emailResult.content || null,
        analysis: analysisResult.content || null
      }
    })

    // Assign tags if we got any
    if (tagNames.length > 0) {
      await assignSessionTags(sessionId, tagNames)
    }
    
    // Save resources if we discovered any
    if (resources.length > 0) {
      await saveSessionResources(sessionId, resources)
    }

    return {
      summary: summaryResult.content,
      followUpEmail: emailResult.content,
      customAnalysis: analysisResult.content,
      tags: tagNames,
      resources
    }
  } catch (error) {
    console.error('Error generating session analysis:', error)
    return { error: 'Failed to generate analysis' }
  }
}

// Assign tags to a session
async function assignSessionTags(sessionId: string, tagNames: string[]) {
  try {
    // Get valid tags from database
    const tags = await prisma.tag.findMany({
      where: {
        name: { in: tagNames },
        category: 'session'
      }
    })

    if (tags.length === 0) return

    // Delete existing session tags
    await prisma.sessionTag.deleteMany({
      where: { sessionId }
    })

    // Create new session tags
    await prisma.sessionTag.createMany({
      data: tags.map(tag => ({
        sessionId,
        tagId: tag.id
      }))
    })
  } catch (error) {
    console.error('Error assigning session tags:', error)
  }
}

// Save resources to database and link to session
async function saveSessionResources(sessionId: string, resources: ParsedResource[]) {
  try {
    // Get session to link to client
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { clientId: true }
    })
    
    if (!session) return
    
    for (const resource of resources) {
      // Check if resource already exists (by title and type)
      let existingResource = await prisma.resource.findFirst({
        where: {
          title: resource.title,
          type: resource.type
        }
      })
      
      // Create resource if it doesn't exist
      if (!existingResource) {
        existingResource = await prisma.resource.create({
          data: {
            title: resource.title,
            type: resource.type,
            url: resource.url,
            description: resource.description
          }
        })
        
        // Assign tags to the resource
        if (resource.tags.length > 0) {
          const resourceTags = await prisma.tag.findMany({
            where: {
              name: { in: resource.tags },
              category: 'resource'
            }
          })
          
          if (resourceTags.length > 0) {
            await prisma.resourceTag.createMany({
              data: resourceTags.map(tag => ({
                resourceId: existingResource!.id,
                tagId: tag.id
              })),
              skipDuplicates: true
            })
          }
        }
      }
      
      // Link resource to client and session (avoid duplicates)
      await prisma.clientResource.create({
        data: {
          clientId: session.clientId,
          resourceId: existingResource.id,
          sessionId: sessionId,  // Link to the session that triggered this
          suggestedBy: 'ai'
        }
      }).catch(() => {
        // Ignore if already exists
      })
    }
  } catch (error) {
    console.error('Error saving session resources:', error)
  }
}

// Generate preparation notes for an upcoming session
export async function generatePreparationNotes(
  clientId: string,
  userId: string
): Promise<{ preparationNotes: string; error?: string }> {
  try {
    // Get recent sessions for this client
    const recentSessions = await prisma.session.findMany({
      where: {
        clientId,
        userId,
        transcript: { not: null }
      },
      orderBy: { date: 'desc' },
      take: 3,
      select: {
        title: true,
        date: true,
        summary: true,
        transcript: true
      }
    })

    if (recentSessions.length === 0) {
      return { 
        preparationNotes: 'No previous sessions found. This appears to be the first session with this client.' 
      }
    }

    // Build context from recent sessions
    const sessionContext = recentSessions
      .map(s => `
Session: ${s.title} (${s.date ? new Date(s.date).toLocaleDateString() : 'No date'})
${s.summary || s.transcript?.substring(0, 500)}
`)
      .join('\n---\n')

    // Get user's preparation prompt or use default from templates
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preparationPrompt: true }
    })

    let prompt = user?.preparationPrompt
    
    // If no user prompt, try to get default from templates
    if (!prompt) {
      const defaultTemplate = await prisma.promptTemplate.findFirst({
        where: {
          type: 'preparation',
          isDefault: true
        }
      })
      prompt = defaultTemplate?.content
    }
    
    // Fallback prompt if no template exists
    if (!prompt) {
      prompt = `Based on the client's history and upcoming session, provide preparation insights including key themes from recent sessions, open action items, and suggested areas to explore.`
    }

    // Generate preparation notes
    const result = await generateWithContext(
      prompt,
      sessionContext,
      userId
    )

    if (result.error) {
      return { preparationNotes: '', error: result.error }
    }

    return { preparationNotes: result.content }
  } catch (error) {
    console.error('Error generating preparation notes:', error)
    return { 
      preparationNotes: '', 
      error: 'Failed to generate preparation notes' 
    }
  }
}

// Type for discovered resource
interface DiscoveredResource {
  title: string
  type: string
  url?: string
  description: string
  tags: string[]
}

// Discover and suggest resources based on session content
export async function discoverResources(
  sessionId: string,
  userId: string
): Promise<{ resources: DiscoveredResource[]; error?: string }> {
  try {
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId },
      select: { transcript: true }
    })

    if (!session || !session.transcript) {
      return { resources: [], error: 'Session not found or no transcript' }
    }

    const result = await generateWithContext(
      RESOURCE_DISCOVERY_PROMPT,
      session.transcript,
      userId,
      false // No context needed for resource discovery
    )

    if (result.error) {
      return { resources: [], error: result.error }
    }

    // Parse JSON response
    try {
      const resources = JSON.parse(result.content)
      return { resources: Array.isArray(resources) ? resources : [] }
    } catch {
      // If not valid JSON, return empty array
      return { resources: [] }
    }
  } catch (error) {
    console.error('Error discovering resources:', error)
    return { resources: [], error: 'Failed to discover resources' }
  }
}
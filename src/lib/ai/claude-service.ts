import { safeDecrypt } from '@/lib/encryption'
import { DEFAULT_CLAUDE_MODEL } from '@/lib/constants/session-prompts'

interface ClaudeResponse {
  content: string
  error?: string
}

export async function callClaudeAPI(
  prompt: string,
  apiKey: string,
  model: string = DEFAULT_CLAUDE_MODEL
): Promise<ClaudeResponse> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Claude API error:', error)
      
      // Handle specific error cases
      if (response.status === 401) {
        return { 
          content: '', 
          error: 'Invalid API key. Please check your Claude API key in settings.' 
        }
      }
      if (response.status === 429) {
        return { 
          content: '', 
          error: 'Rate limit exceeded. Please try again in a moment.' 
        }
      }
      if (response.status === 400) {
        return { 
          content: '', 
          error: 'Invalid request. Please check your settings and try again.' 
        }
      }
      
      return { 
        content: '', 
        error: `API error: ${response.status}` 
      }
    }

    const data = await response.json()
    
    // Extract text content from Claude's response
    const content = data.content?.[0]?.text || ''
    
    return { content }
  } catch (error) {
    console.error('Error calling Claude API:', error)
    return { 
      content: '', 
      error: 'Failed to connect to Claude API. Please check your internet connection.' 
    }
  }
}

// Helper to validate API key exists and is decryptable
export async function validateApiKey(encryptedKey: string | null): Promise<{
  valid: boolean
  apiKey: string | null
  error?: string
}> {
  if (!encryptedKey) {
    return { 
      valid: false, 
      apiKey: null, 
      error: 'No API key configured. Please add your Claude API key in settings.' 
    }
  }

  const apiKey = safeDecrypt(encryptedKey)
  if (!apiKey) {
    return { 
      valid: false, 
      apiKey: null, 
      error: 'Failed to decrypt API key. Please reconfigure your Claude API key in settings.' 
    }
  }

  return { valid: true, apiKey }
}
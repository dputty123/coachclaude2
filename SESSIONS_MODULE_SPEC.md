# Sessions Module Specification Document

## Overview
This document captures the complete specification for implementing the Sessions module in Coach Claude, including all discussions, decisions, and implementation details.

## Table of Contents
1. [Initial Requirements & Questions](#initial-requirements--questions)
2. [Key Decisions & Clarifications](#key-decisions--clarifications)
3. [Technical Architecture](#technical-architecture)
4. [Implementation Plan](#implementation-plan)
5. [Integration Points](#integration-points)
6. [UI/UX Specifications](#uiux-specifications)

---

## Initial Requirements & Questions

### User's Original Request
The user wanted to implement a sessions module with the following capabilities:
- Keep the existing UI design
- Add functionality for creating new sessions
- Session creation should include:
  - Session title
  - Client selection (dropdown)
  - Session date
  - Session transcript
  - NO manual tag selection during creation
- After creation, sessions should appear in the sessions page
- "View Analysis" button to analyze sessions using Claude API
- Possible chat functionality for discussing the analysis

### Key Questions Raised

1. **Tags Strategy**: Should we allow unlimited tags or use predefined tags?
   - **Decision**: Use 20-30 predefined tags for consistency and to prevent tag explosion

2. **Tag Selection Method**: Should users select tags or AI auto-tag?
   - **Initial consideration**: User selects during creation
   - **Final Decision**: AI auto-tags during analysis, users can edit afterward (simpler flow)

3. **Session Creation Flow**: Should analysis happen during creation or separately?
   - **Decision**: Create session first, then analyze separately for better UX

4. **Chat Architecture**: Should chat be embedded in analysis or separate?
   - **Decision**: Separate chat page for better organization

5. **Resource Generation**: How many resources and when to generate?
   - **Decision**: Generate 0-3 resources based on relevance, not forced

6. **Duplicate Content**: What if user's prompt already includes follow-ups/resources?
   - **Decision**: Smart parsing to avoid duplication, extract from analysis if present

---

## Key Decisions & Clarifications

### 1. Tags Management
- **Sessions**: 20-30 predefined coaching-relevant tags
- **Resources**: 20-30 predefined tags including types and topics
- **Session Tags**: AI auto-selects during analysis (no user selection during creation)
- **User Editing**: Users can edit/modify tags after analysis
- Tags are seeded in database during setup
- AI can only select from existing tags, cannot create new ones

**Session Tags** (from existing UI + additions):
```
leadership, strategy, team management, career, goals, planning,
communication, presence, confidence, decision making, analysis,
conflict, relationships, development, delegation, performance,
promotion, feedback, work-life-balance, stress-management,
mindset, vision, change-management
```

**Resource Tags** (from existing UI + additions):
```
leadership, framework, executive, emotional-intelligence,
assessment, development, strategy, decision-making,
communication, feedback, goals, planning, teams, organizational,
article, tool, book, video, template, worksheet, guide, pdf
```

### 2. AI Generation Strategy

#### Always Generated (Separate Fields)
- **Summary**: Always generated using dedicated prompt
- **Follow-up Email**: Always generated unless already in user's analysis
- **Tags**: Auto-selected by AI from predefined list during analysis

#### Conditionally Generated
- **Resources**: 0-3 resources based on session relevance
- **Analysis**: Using user's custom prompt or default

#### Smart Duplicate Prevention
```typescript
// Pseudocode for handling duplicates
1. Run user's analysis prompt (may include everything)
2. Check if analysis contains follow-up email or resources
3. If follow-up NOT in analysis → generate separately
4. If follow-up IN analysis → extract from analysis
5. If resources NOT in analysis → generate separately (0-3)
6. If resources IN analysis → extract and parse
7. Summary always generated separately (it's distinct)
```

### 3. Resource Management

#### Deduplication Strategy
- Check if resource exists by URL (primary)
- If no URL, check by title + type combination
- If exists, reuse existing resource
- Always create ClientResource link for tracking
- Multiple clients can share the same resource

#### Resource Creation Flow
```typescript
async function createOrLinkResource(resourceData, clientId, sessionId) {
  // 1. Check if resource already exists
  let resource = await findExistingResource(resourceData);
  
  // 2. Create new if doesn't exist
  if (!resource) {
    resource = await createResource(resourceData);
    await assignTags(resource.id, resourceData.tags);
  }
  
  // 3. Always create ClientResource link
  await linkToClient(resource.id, clientId, sessionId);
}
```

### 4. Context Documents Integration
- ALL AI generations must include context documents
- Use `getAllUserContextDocuments()` to fetch
- Prepend to prompts for better AI context
- Documents contain coaching frameworks, principles, etc.

### 5. API Key Security
- Claude API keys are encrypted using AES-256-GCM
- Use `decrypt()` from `/lib/encryption.ts` when calling Claude
- Use `safeDecrypt()` for non-throwing decryption
- Proper error handling if key is missing/invalid

### 6. Chat Feature Design (Using Vercel AI SDK)
- **Separate Page**: `/sessions/[id]/chat`
- **Not Embedded**: Chat is not part of analysis view
- **Multiple Sessions**: Can have multiple chat sessions per coaching session
- **Persistence**: Store in generic Chat table (not SessionChat)
- **Context**: Includes transcript, analysis, summary, resources
- **Implementation**: Using Vercel AI SDK for streaming responses
- **Reusable**: Same chat component used for session, client, and global contexts

### 7. Client Integration Points
- Update session counts everywhere clients appear
- "New Session" button in client detail pre-fills client
- Timeline shows sessions, follow-ups, resources (NO notes)
- Resources appear in both library and client timeline

---

## Technical Architecture

### Database Schema Additions

```prisma
// Already exists in schema
model Session {
  id               String    @id @default(cuid())
  clientId         String
  userId           String
  title            String
  date             DateTime?
  transcript       String?   @db.Text
  summary          String?   @db.Text
  followUpEmail    String?   @db.Text
  analysis         String?   @db.Text
  preparationNotes String?   @db.Text
  calendarEventId  String?
  
  // Relations
  client           Client    @relation(...)
  user             User      @relation(...)
  tags             SessionTag[]
  resources        ClientResource[]
}

// Generic chat model for all contexts (session, client, global)
model Chat {
  id          String   @id @default(cuid())
  userId      String
  contextType String   // 'session' | 'client' | 'global'
  contextId   String?  // sessionId or clientId (null for global)
  title       String?  // Auto-generated or user-defined
  messages    Json     // Array of {role, content, timestamp}
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User     @relation(fields: [userId], references: [id])
  
  @@index([userId, contextType, contextId])
}
```

### AI Integration Architecture

```typescript
// Core AI generation function with context
async function generateWithContext(
  prompt: string, 
  transcript: string, 
  userId: string
) {
  // 1. Get user and decrypt API key
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const apiKey = safeDecrypt(user.claudeApiKey);
  if (!apiKey) throw new Error('Configure API key in settings');
  
  // 2. Get context documents
  const contextDocs = await getAllUserContextDocuments();
  
  // 3. Build full prompt with context
  const fullPrompt = `
${contextDocs.data?.combinedContent || ''}

${prompt}

Session Transcript:
${transcript}
`;
  
  // 4. Call Claude API
  return await callClaudeAPI(
    fullPrompt, 
    apiKey, 
    user.claudeModel || DEFAULT_CLAUDE_MODEL
  );
}
```

### Prompt Management

```typescript
// New file: /lib/constants/session-prompts.ts
export const SUMMARY_PROMPT = `
Provide a concise summary (150-200 words) of this coaching session including:
- Main topics discussed
- Key insights and breakthroughs
- Client's current challenges
- Progress made
`;

export const FOLLOWUP_EMAIL_PROMPT = `
Generate a professional follow-up email for the client including:
- Warm appreciation for their time and engagement
- 2-3 key takeaways from today's session
- Specific action items with clear next steps
- Encouragement and support for their journey
- Closing with next session reminder if applicable
`;

export const RESOURCE_DISCOVERY_PROMPT = `
Based on this session, suggest 0-3 highly relevant resources.
Only suggest resources if they directly address topics discussed.
For each resource provide:
- Title
- Type (article/framework/tool/book/video)
- URL (if publicly available) or where to find it
- One-sentence description of why it's relevant
- 2-3 relevant tags from our predefined list

Return empty array if no relevant resources found.
`;

export const SESSION_TAGS_PROMPT = `
Based on this coaching session transcript and analysis, select the most relevant tags.
Choose 3-5 tags from this predefined list that best capture the session's themes:

Available tags: leadership, strategy, team management, career, goals, planning,
communication, presence, confidence, decision making, analysis, conflict, 
relationships, development, delegation, performance, promotion, feedback,
work-life-balance, stress-management, mindset, vision, change-management

Return only the tag names that apply, as a comma-separated list.
`;
```

---

## Implementation Plan

### Phase 1: Foundation (Day 1-2)

#### 1.1 Database Setup
- [ ] Run migration to seed predefined tags
- [ ] Add SessionChat model to schema
- [ ] Update Prisma client generation

#### 1.2 Server Actions (`/app/actions/sessions.ts`)
```typescript
export async function getSessions(userId: string)
export async function getSession(id: string, userId: string)
export async function createSession(data: SessionFormData, userId: string)
export async function updateSession(id: string, data: Partial<Session>)
export async function deleteSession(id: string, userId: string)
export async function analyzeSession(id: string, userId: string)
```

#### 1.3 React Query Hooks (`/hooks/use-sessions.ts`)
```typescript
export function useSessions(userId: string)
export function useSession(id: string, userId: string)
export function useCreateSession()
export function useUpdateSession()
export function useDeleteSession()
export function useAnalyzeSession()
```

### Phase 2: Core UI (Day 2-3)

#### 2.1 Session Creation Page (`/app/sessions/new/page.tsx`)
- Form with React Hook Form + Zod validation
- Fields: title, client dropdown, date picker, transcript (NO tags field)
- Tags will be auto-assigned by AI during analysis
- Optimistic updates with React Query
- Consistent with client form patterns

#### 2.2 Session List Updates (`/components/sessions/session-list.tsx`)
- Replace hardcoded data with real data fetching
- Implement search functionality
- Client filter dropdown with real clients
- Skeleton loaders during fetch
- Show analysis status indicators

#### 2.3 Session Detail Page (`/app/sessions/[id]/page.tsx`)
- Tabs: Overview, Analysis, Resources, Chat
- Overview: Summary and follow-up email with copy button
- Analysis: Full analysis text (may contain user's custom content)
- Resources: List of generated/extracted resources
- Chat: Link to separate chat page

### Phase 3: AI Integration (Day 3-4)

#### 3.1 Claude API Integration (`/lib/ai/claude.ts`)
```typescript
export async function callClaudeAPI(
  prompt: string,
  apiKey: string,
  model: string
): Promise<string>

export async function streamClaudeResponse(
  prompt: string,
  apiKey: string,
  model: string,
  onChunk: (chunk: string) => void
): Promise<void>
```

#### 3.2 Analysis Generation
- Implement smart duplicate detection
- Extract follow-ups/resources from analysis if present
- Generate missing pieces separately
- Auto-assign tags based on session content
- Handle context documents
- Proper error handling for missing API keys
- Allow users to edit tags after analysis

#### 3.3 Resource Creation
- Implement deduplication logic
- Create Resource records
- Link to client and session
- Auto-assign tags

### Phase 4: Chat Feature Using Vercel AI SDK (Day 4-5)

#### 4.1 Setup Vercel AI SDK
```bash
npm install ai react-markdown
```

#### 4.2 Session Chat Page (`/app/sessions/[id]/chat/page.tsx`)
- Use Vercel AI SDK's `useChat` hook for streaming
- Pass `contextType: 'session'` and `contextId: sessionId`
- Full session context (transcript, analysis, resources) in system prompt
- Message history display with markdown support
- Real-time streaming responses from Claude
- Option to start new chat or continue existing

#### 4.3 Reusable Chat Implementation
```typescript
// Using the generic AIChat component
<AIChat 
  contextType="session" 
  contextId={sessionId}
  placeholder="Ask about this session..."
/>
```

#### 4.4 Chat Management
- Create/update Chat records (generic model)
- Handle multiple chat sessions per context
- Implement chat title generation
- Add chat session selector
- Store messages in JSON format

### Phase 5: Integration & Polish (Day 5)

#### 5.1 Client Integration
- Update client detail page "New Session" button
- Add sessions to client timeline
- Update session counts in client cards
- Ensure bidirectional navigation

#### 5.2 Resource Library Updates
- Display AI-generated resources
- Show source (manual vs AI)
- Filter by generation type
- Show linked sessions and clients

#### 5.3 Dashboard Updates
- Update "Upcoming Sessions" with real data
- Include sessions in "Recent Activity"
- Update metrics calculations

---

## Integration Points

### 1. Client Module
- **Client Detail Page**: 
  - "New Session" button → `/sessions/new?clientId={id}`
  - Timeline shows sessions with summaries, follow-ups, resources
  - Session count displayed in header
- **Client List**: 
  - Session count in client cards
  - Last session date display

### 2. Resources Module
- **Resource Library**:
  - AI-generated resources appear automatically
  - Show generation source and linked session
  - Filter by AI vs manual
- **ClientResource Linking**:
  - Resources linked to both client and session
  - Tracking via `suggestedBy` field

### 3. Settings Module
- **API Configuration**:
  - Claude API key required for analysis
  - Model selection affects generation
- **Prompts**:
  - User's analysis prompt used for generation
  - Fallback to defaults if not configured

### 4. Context Documents
- **All AI Calls**:
  - Include context documents in prompts
  - Better coaching insights based on frameworks
  - Consistent approach across features

---

## UI/UX Specifications

### Session List Page
```
[Search Bar] [Client Filter Dropdown]

[Session Card 1]            [Session Card 2]
- Title                     - Title
- Client name               - Client name  
- Date                      - Date
- [Tags badges]             - [Tags badges]
- ✓ Analysis complete       - ⏳ Analysis pending
- 3 resources               - 0 resources
[View Analysis] [Chat]      [Analyze Now]

[+ New Session Button]
```

### Session Creation Form
```
Create New Session

Title: [_______________]

Client: [Dropdown with search]

Date: [Date picker]

Transcript:
[Large textarea for session notes/transcript]

Note: Tags will be automatically assigned during analysis

[Cancel] [Create Session]
```

### Session Detail Page
```
[Session Title]
Client: [Name] | Date: [Date]

Tags: [leadership] [strategy] [communication] [Edit Tags]
(AI-assigned tags with edit button)

[Overview] [Analysis] [Resources] [Chat]

--- Overview Tab ---
Summary:
[Generated summary text]

Follow-up Email:
[Generated email text]
[Copy to Clipboard]

--- Analysis Tab ---
[Full analysis with user's custom insights]

--- Resources Tab ---
Resource 1: [Title]
Type: Article | [View] [Link to Client]

Resource 2: [Title]
Type: Framework | [View] [Link to Client]

--- Chat Tab ---
[Start New Chat] [Continue Previous Chat]
```

### Client Timeline (Updated)
```
Timeline (NO NOTES - only sessions, follow-ups, resources)

[May 10] Session: Leadership Strategy
  Summary: Discussed quarterly goals...
  [View Full Analysis]

[May 10] Follow-up Email Sent
  [View Email] [Copy]

[May 10] Resources Added (3)
  - Leadership Framework
  - Decision Making Model
  - Team Assessment Tool
```

---

## File Structure

```
src/
├── app/
│   ├── actions/
│   │   ├── sessions.ts (new)
│   │   └── resources.ts (update)
│   └── sessions/
│       ├── page.tsx (update existing)
│       ├── new/
│       │   └── page.tsx (new)
│       └── [id]/
│           ├── page.tsx (new - overview)
│           ├── analysis/
│           │   └── page.tsx (new)
│           └── chat/
│               └── page.tsx (new)
├── app/
│   └── api/
│       └── chat/
│           └── route.ts (new - Vercel AI SDK endpoint)
├── components/
│   ├── sessions/
│   │   ├── session-list.tsx (update)
│   │   ├── session-form.tsx (new)
│   │   ├── session-detail.tsx (new)
│   │   ├── session-analysis.tsx (new)
│   │   └── session-chat.tsx (new - wrapper for AIChat)
│   ├── chat/
│   │   └── ai-chat.tsx (new - reusable chat component)
│   └── clients/
│       └── client-timeline.tsx (update)
├── hooks/
│   ├── use-sessions.ts (new)
│   ├── use-resources.ts (update)
│   └── use-ai-chat.ts (new - Vercel AI SDK hook)
└── lib/
    ├── ai/
    │   └── claude.ts (new)
    └── constants/
        └── session-prompts.ts (new)
```

---

## Vercel AI SDK Implementation for Session Chat

### Installation
```bash
npm install ai react-markdown
```

### Session-Specific Chat Implementation

#### 1. Session Chat Hook Usage
```typescript
// /app/sessions/[id]/chat/page.tsx
'use client';

import { AIChat } from '@/components/chat/ai-chat';

export default function SessionChatPage({ params }: { params: { id: string } }) {
  return (
    <div className="h-[600px] max-w-4xl mx-auto">
      <h2 className="mb-4">Chat about this session</h2>
      <AIChat 
        contextType="session" 
        contextId={params.id}
        placeholder="Ask questions about this coaching session..."
      />
    </div>
  );
}
```

#### 2. Session Context Building
When `contextType` is 'session', the API route will:
1. Fetch the session with transcript, analysis, summary, and resources
2. Include all session-specific data in the system prompt
3. Add context documents for coaching frameworks
4. Stream responses with full session awareness

```typescript
// In /app/api/chat/route.ts
case 'session':
  const session = await prisma.session.findUnique({
    where: { id: contextId },
    include: {
      client: true,
      tags: true,
      resources: {
        include: { resource: true }
      }
    }
  });
  
  context = `
    Session Information:
    - Title: ${session.title}
    - Client: ${session.client.name}
    - Date: ${session.date}
    - Tags: ${session.tags.map(t => t.tag.name).join(', ')}
    
    Transcript:
    ${session.transcript}
    
    Analysis:
    ${session.analysis}
    
    Summary:
    ${session.summary}
    
    Resources Discussed:
    ${session.resources.map(r => `- ${r.resource.title}`).join('\n')}
  `;
  break;
```

#### 3. Session Chat Features
- **Multiple Chat Sessions**: Users can have multiple separate conversations about the same session
- **Context Awareness**: Every message includes full session context
- **Markdown Support**: Responses are rendered with proper formatting
- **Streaming**: Real-time token streaming for better UX
- **History Persistence**: All chats saved in the Chat table
- **Session Switching**: UI to switch between different chat sessions

#### 4. Chat UI Integration in Session Detail
```typescript
// In session detail tabs
<TabsContent value="chat">
  <div className="space-y-4">
    <p className="text-muted-foreground">
      Discuss this session with AI to gain deeper insights
    </p>
    <Link href={`/sessions/${session.id}/chat`}>
      <Button>
        <MessageSquare className="mr-2 h-4 w-4" />
        Open Chat
      </Button>
    </Link>
    {/* Show recent chat sessions if any */}
    {recentChats.length > 0 && (
      <div>
        <h3 className="text-sm font-medium mb-2">Recent Conversations</h3>
        {recentChats.map(chat => (
          <Link key={chat.id} href={`/sessions/${session.id}/chat?chatId=${chat.id}`}>
            <Card className="p-3 mb-2 hover:bg-muted cursor-pointer">
              <div className="text-sm">{chat.title || 'Untitled Chat'}</div>
              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(chat.updatedAt)} ago
              </div>
            </Card>
          </Link>
        ))}
      </div>
    )}
  </div>
</TabsContent>
```

---

## Important Reminders

1. **Never run build** unless explicitly requested
2. **Component organization**: 
   - `/components/ui/` - ONLY shadcn components
   - `/components/` - All custom components
3. **Server components by default** - only use "use client" when necessary
4. **Follow existing patterns**:
   - React Query for data fetching
   - Server actions for mutations
   - Zod for validation
   - Toast notifications for feedback
5. **Security**:
   - Always decrypt API keys when needed
   - Never log sensitive data
   - Validate all user inputs
6. **Context documents** must be included in all AI generations
7. **Resource deduplication** is critical to prevent duplicates
8. **Timeline does NOT include notes** - only sessions, follow-ups, resources

---

## Success Criteria

- [ ] Users can create sessions with all required fields (no tag selection)
- [ ] Sessions appear in list with real-time search/filter
- [ ] Analysis generates summary, follow-up, resources, and auto-assigns tags
- [ ] AI correctly selects 3-5 relevant tags from predefined list
- [ ] Users can edit tags after analysis
- [ ] Smart duplicate prevention works correctly
- [ ] Resources are deduplicated across clients
- [ ] Chat feature allows discussion about sessions
- [ ] Client integration shows accurate session counts
- [ ] Timeline displays sessions without notes
- [ ] Context documents are included in AI generation
- [ ] API keys are properly encrypted/decrypted

---

## Notes from Discussion

### User's Specific Concerns
1. "Should we give unlimited tags or fixed?" → Fixed (20-30)
2. "Should users select tags or AI?" → AI auto-tags, users can edit later
3. "Should we analyze during creation?" → No, separate step
4. "How many resources?" → 0-3, not forced
5. "What about duplicate generation?" → Smart parsing and extraction
6. "Timeline should not include notes" → Confirmed, only sessions/resources
7. "Chat in same window or separate?" → Separate page

### Technical Clarifications
1. API keys are already encrypted in database
2. Default prompts exist in default-templates.ts
3. Context documents feature already implemented
4. Resource library exists but needs integration
5. Client module has timeline that needs updating

This specification serves as the complete guide for implementing the Sessions module with all discussed requirements and decisions.
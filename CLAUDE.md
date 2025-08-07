# Coach Claude Insights - Development Guidelines

** IMPORTANT NOTE **: DO NOT RUN THE BUILD COMMAND UNLESS I ASK YOU TO.

## IMPORTANT: Component Organization Rules

1. **UI Folder (`/components/ui/`)**: 
   - ONLY for shadcn/ui components
   - Do NOT create custom components here
   - This folder is reserved for components installed via `npx shadcn-ui@latest add`

2. **Components Folder (`/components/`)**: 
   - For ALL custom components
   - Examples: PasswordInput, DeleteConfirmationDialog, etc.
   - Organize by feature (e.g., `/components/clients/`, `/components/sessions/`)

3. **Remember**: If you're creating a new component that's not from shadcn/ui, it goes in `/components/`, NOT `/components/ui/`

## Product Specification

For complete product specifications, features, and user workflows, please refer to:
**[Coach Claude: Product Specification Document](./Coach%20Claude_%20Product%20Specification%20Document.md)**

This document contains:
- Problem statement and solution overview
- Detailed feature specifications
- User journey and workflows
- Technical implementation details
- Success criteria and investment information

## Implementation Roadmap

**IMPORTANT**: This roadmap should be updated whenever we deviate from the plan or make implementation decisions that differ from what's outlined below.

### Phase 1: Foundation (Week 1)

**1. Database Schema & Prisma Setup**
- Install Prisma and configure with Supabase PostgreSQL
- Create comprehensive schema (see details below)

**2. Supabase Configuration**
- Set up Supabase project
- Configure authentication (email/password)
- Set up Row Level Security (RLS) policies
- Configure storage buckets for file uploads

**3. Authentication Implementation**
- Create auth context and providers
- Build login/signup pages
- Implement protected route middleware
- Add user session management

### Phase 2: Core Features (Week 2)

**4. Settings Page (Start Here!)**
- This is the logical first page since users need API keys
- Implement API key management (Claude, Google Calendar)
- Add coaching philosophy prompt configuration
- Create prompt templates management

**5. Clients Module** ✅ COMPLETED
- `/clients` - List view with client cards
  - Search functionality by name, company, or role
  - Display client count and last session info
  - "Add Client" button routes to full page form
- `/clients/new` - Add new client form (full page, not dialog)
  - Only name field is required
  - All other fields optional
  - Uses React Query for optimistic updates
- `/clients/[id]` - Client detail page with comprehensive features:
  - **Edit Mode**: Toggle between view/edit for all client fields
  - **Team Members**: Bidirectional relationships with multi-select
  - **Reports To**: Dropdown selector with "Add Client" option
  - **Timeline Tab**: Shows sessions, notes, and resources
  - **Notes Tab**: Create, edit, delete client notes
  - **Real-time Updates**: Using React Query mutations
- CRUD operations with Prisma/Supabase server actions

**6. Sessions Foundation**
- `/sessions` - Sessions list view
- `/sessions/new` - Create session (select client)
- `/sessions/[id]` - Session detail view
- Basic CRUD without AI features yet

### Phase 3: AI Integration (Week 3)

**7. Google Calendar Integration**
- OAuth flow for Google Calendar
- Sync upcoming sessions
- Filter by coaching keywords
- Auto-create session records

**8. AI Analysis Features**
- Claude API integration
- Session preparation insights
- Post-session analysis
- Action items extraction
- Follow-up email generation
- Resource recommendations

### Phase 4: Advanced Features (Week 4)

**9. Resources Management**
- `/resources` - Resource library
- Upload and categorize resources
- Client-specific resource assignment
- AI-powered resource discovery

**10. Dashboard Completion**
- Wire up real data to dashboard cards
- Client metrics calculations
- Recent activity feed
- Upcoming sessions widget

### Technical Implementation Order

```
1. Backend Setup
   ├── Prisma schema
   ├── Supabase config
   └── tRPC routes setup

2. Auth Flow
   ├── Login/Signup pages
   ├── Auth context
   └── Protected routes

3. Settings (First functional page!)
   ├── API keys CRUD
   └── Prompt management

4. Clients
   ├── List → Add → Edit → Delete
   └── Client profiles

5. Sessions
   ├── Basic CRUD
   ├── Calendar sync
   └── AI analysis

6. Resources
   └── Complete the loop
```

### Why This Order?

1. **Foundation First**: Database and auth are prerequisites
2. **Settings Before Features**: Users need API keys configured
3. **Clients Before Sessions**: Sessions belong to clients
4. **Basic CRUD Before AI**: Get data flow working first
5. **AI Features Together**: Better to implement all AI at once
6. **Dashboard Last**: Needs all data to be meaningful

### Next Immediate Steps

1. **Install Prisma**: `npm install prisma @prisma/client`
2. **Initialize Prisma**: `npx prisma init`
3. **Create schema.prisma** with all models
4. **Set up Supabase** project and get connection string
5. **Run migrations**: `npx prisma migrate dev`

## Database Schema Design

### Client Schema Key Features

The Client schema has been carefully designed to handle the complex relationships between coaches and their clients:

1. **Basic Information**
   - Standard fields: name, role, company, email, phone, birthday
   - `coachingSince` is optional - coaches may not remember exact start dates
   - All clients belong to a specific coach (userId)

2. **Custom Fields**
   - `careerGoal` - Client's career aspirations
   - `keyChallenge` - Main challenge they're working on
   - `keyStakeholders` - Text field for roles like "CEO, CTO, Sales Director"

3. **Organizational Relationships**
   - **Reports To**: Unidirectional relationship using simple foreign key
     - `reportsToId` links to another client who is their manager
     - `directReports` automatically gives you all subordinates
   - **Team Members**: Simplified bidirectional relationship using Prisma's automatic many-to-many
     - Uses Prisma's built-in self-referencing many-to-many (no manual join table needed)
     - When A adds B as team member, both A and B see each other automatically
     - Prevents self-references (a client cannot be their own team member)

4. **Related Data**
   - **Notes**: Multiple timestamped notes per client (ClientNote table)
   - **Resources**: AI-suggested or manually added resources linked to clients
   - **Sessions**: All coaching sessions with this client

### Implementation Notes

- All relationships stay within a coach's client roster (enforced by userId)
- Cascade deletes ensure data integrity when removing clients
- Timestamp fields track when records are created and updated
- The schema avoids complex self-referencing many-to-many relations in favor of cleaner join tables

### Example Usage

```typescript
// Adding a team member relationship (simplified!)
await prisma.client.update({
  where: { id: clientA.id },
  data: {
    teamMembers: {
      connect: { id: clientB.id }
    }
  }
});

// Finding all team members for a client
const client = await prisma.client.findUnique({
  where: { id: clientId },
  include: {
    teamMembers: true,      // Clients who are team members with this client
    teamMemberOf: true      // Same relationship from the other perspective
  }
});

// Display logic combines both for true bidirectional view
const allTeamMembers = [...client.teamMembers, ...client.teamMemberOf];
```

### Team Members Schema Evolution

**Original Schema Issue:**
- Used explicit `TeamMembership` join table with confusing relation names
- `teamMembers` relation actually showed where client was the MEMBER (backwards!)
- Led to clients seeing themselves as their own team members

**New Simplified Schema:**
```prisma
model Client {
  // ... other fields ...
  
  // Self-referencing many-to-many for team members
  teamMembers   Client[]  @relation("TeamMembers")
  teamMemberOf  Client[]  @relation("TeamMembers")
}
```

**Benefits:**
- Prisma automatically handles the join table
- True symmetric relationship - no "direction" confusion
- Impossible to add self as team member
- Much cleaner code and queries

## Client Module Implementation Details

### Key Features Implemented:

1. **Client List Page (`/clients`)**
   - Real-time search across name, company, and role
   - Client cards showing session count
   - Responsive grid layout
   - "Add Client" button (full page navigation, not dialog)

2. **Client Detail Page (`/clients/[id]`)**
   - **View Mode**: Clean display of all client information
   - **Edit Mode**: In-place editing with save/cancel
   - **Relationships**:
     - Reports To: Single select with badge display
     - Team Members: Multi-select with bidirectional display
   - **Tabs**:
     - Timeline: Chronological view of sessions and notes
     - Notes: Full CRUD for client notes
   - **Actions**: New Session, Schedule Meeting, Delete Client

3. **Data Flow Architecture**
   - Server Actions for all CRUD operations
   - React Query for caching and optimistic updates
   - Real-time updates without page refresh
   - Type-safe with Prisma generated types

### UI/UX Decisions:

1. **Edit Pattern**: Single edit mode for all fields (not individual field editing)
   - Consistent with user expectations
   - Clear save/cancel flow
   - Prevents accidental changes

2. **Selectors**: Custom dropdowns with integrated "Add Client" option
   - Appears when no clients match search
   - Consistent behavior across all dropdowns
   - Shows client names as badges when selected

3. **Team Members Display**:
   - Shows all team relationships (both directions)
   - Prevents duplicate selections
   - Clear visual feedback with badges

### Technical Implementation:

1. **Next.js 15 App Router**
   - Server components for data fetching
   - Client components only for interactivity
   - Async params handling

2. **React Query Integration**
   - Custom hooks for each operation
   - Optimistic updates for better UX
   - Automatic cache invalidation

3. **Type Safety**
   - Zod schemas for validation
   - Prisma generated types
   - Proper error handling

### Calendar Integration Approach (MVP)

**Phase 1 - Read-Only Integration:**
1. Coach connects Google Calendar via OAuth
2. System displays all upcoming calendar events
3. Auto-detection: Events containing existing client names are flagged
4. Coach manually confirms which events are coaching sessions
5. Confirmed sessions pre-populate: date, title, client link

**Why This Approach:**
- Simple MVP implementation
- No complex filtering logic needed initially
- Coaches maintain control over session identification
- Supports gradual adoption (can work without calendar)

**Future Enhancements:**
- Event filtering by keywords/labels
- Two-way sync (create calendar events)
- Automatic session creation rules

## Tag System Architecture

### Implementation Strategy

1. **Single Tag Table**: One table for all tag types with category field
2. **Pre-defined Tags Only**: ~20-30 curated coaching-relevant tags
3. **AI Selection Only**: AI selects from existing tags, cannot create new ones

### Example Tags

```typescript
const COACHING_TAGS = [
  // Leadership & Management
  "leadership", "delegation", "team-building", "decision-making",
  
  // Career Development
  "career-growth", "goal-setting", "performance", "promotion",
  
  // Communication
  "communication", "presentation", "conflict-resolution", "feedback",
  
  // Personal Development
  "confidence", "work-life-balance", "stress-management", "mindset",
  
  // Strategy & Planning
  "strategy", "planning", "vision", "change-management"
];
```

### Benefits
- Prevents tag explosion and inconsistency
- Enables meaningful filtering and analytics
- Maintains quality of AI categorization

## Session Workflow

### Pre-Session Flow (Preparation)

1. **Trigger**: Coach views upcoming session (calendar or manual)
2. **Action**: Clicks "Prepare" button
3. **AI Process**:
   - Analyzes all previous sessions with client
   - Reviews client profile and notes
   - Generates preparation insights
4. **Output**: Preparation notes with context and suggested talking points

### Post-Session Flow (Analysis)

1. **Create/Select Session**: Coach creates new session or selects from calendar
2. **Upload Transcript**: Paste or upload session notes/transcript
3. **AI Analysis**:
   - **Always Generated**:
     - Summary: Concise overview of session
     - Follow-up Email: Draft for client
   - **Custom Analysis**: Based on coach's prompts
4. **Resource Discovery**:
   - AI analyzes session content
   - Suggests relevant resources
   - Links resources to both client and session
5. **Tag Assignment**: AI selects relevant tags from predefined list

### Data Flow Example

```typescript
// Post-session processing
async function processSession(sessionId: string, transcript: string) {
  // 1. Generate standard outputs
  const summary = await generateSummary(transcript);
  const followUpEmail = await generateFollowUp(transcript);
  
  // 2. Run custom analysis based on coach's prompts
  const analysis = await runCustomAnalysis(transcript, coach.prompts);
  
  // 3. Assign tags from predefined list
  const tags = await selectRelevantTags(transcript, COACHING_TAGS);
  
  // 4. Discover and suggest resources
  const resources = await discoverResources(transcript);
  
  // 5. Update session with all generated content
  await updateSession(sessionId, {
    summary,
    followUpEmail,
    analysis,
    tags,
    resources
  });
}
```

## Settings Architecture

### API Configuration Strategy

API keys and configuration are stored directly in the User model for MVP simplicity:

1. **Claude API Configuration**
   - `claudeApiKey`: Encrypted API key storage
   - `claudeModel`: User's preferred model (defaults to claude-3-sonnet)
   - Automatic fallback handled by Claude API (Opus → Sonnet)

2. **Google Calendar Integration**
   - `googleRefreshToken`: OAuth refresh token for persistent access
   - Enables calendar sync without repeated authentication

### Prompt Management System

Two-tier prompt system for flexibility:

1. **Active Prompts** (in User model)
   - `analysisPrompt`: Currently active prompt for post-session analysis
   - `preparationPrompt`: Currently active prompt for pre-session preparation
   - Stored as text, can be edited directly

2. **Prompt Templates** (PromptTemplate model)
   - Library of saved prompts
   - Types: "analysis" or "preparation"
   - `isDefault`: Marks system-provided templates
   - Users can create custom templates

### Workflow Example

```typescript
// Using a template
async function applyTemplate(templateId: string) {
  const template = await prisma.promptTemplate.findUnique({
    where: { id: templateId }
  });
  
  // Copy template content to active prompt
  if (template.type === 'analysis') {
    await prisma.user.update({
      where: { id: userId },
      data: { analysisPrompt: template.content }
    });
  }
}

// Default templates created on signup
const defaultTemplates = [
  {
    name: "Standard Analysis",
    type: "analysis",
    content: "Analyze this coaching session...",
    isDefault: true
  },
  {
    name: "Session Preparation",
    type: "preparation", 
    content: "Prepare for upcoming session...",
    isDefault: true
  }
];
```

### Security Considerations

- API keys must be encrypted before storage
- Use environment variables for encryption keys
- Never expose raw API keys in responses
- Implement proper key rotation mechanisms

### API Key Security

- All API keys (Claude, Google) are encrypted using AES-256-GCM before storage
- Encryption key must be set in ENCRYPTION_KEY environment variable
- Keys are decrypted only when needed for API calls
- Never log or expose decrypted keys
- When implementing the settings page or any feature that stores/uses API keys, just:
  - encrypt(apiKey) before saving to database
  - decrypt(encryptedKey) when you need to use it with APIs

## Design System & Theming

### globals.css - Single Source of Truth

The `src/app/globals.css` file contains all design tokens and theme variables:

1. **Color System**: All colors use CSS custom properties (variables)
   - Primary: `--primary: 221.2 83.2% 53.3%` (HSL format)
   - Supports light/dark themes automatically
   - Components should use `hsl(var(--primary))` syntax

2. **Component Styling**: Always use CSS variables from globals.css
   - Never hardcode colors
   - Ensures consistency across the app
   - Theme changes automatically apply everywhere

3. **Key Variables**:
   - `--background`, `--foreground`: Main app colors
   - `--primary`, `--secondary`: Brand colors
   - `--muted`, `--accent`: UI state colors
   - `--sidebar-*`: Sidebar-specific theming

## Tech Stack

### Core Framework
- **Next.js 15** - App Router, Server Components, Server Actions
- **React 19** - UI library
- **TypeScript** - Type safety

### UI & Styling
- **shadcn/ui** - Headless UI components built on Radix UI
- **Tailwind CSS v4** - Utility-first CSS framework
- **Lucide React** - Icon library

### Database & Backend
- **Prisma** - Type-safe ORM for database queries
- **Supabase** - Backend as a Service
  - **Database** - PostgreSQL database
  - **Auth** - Authentication and user management
  - **Storage** - File storage for documents/images
- **tRPC** - End-to-end typesafe APIs
- **Zod** - Schema validation (works with tRPC and React Hook Form)

### State Management & Data Fetching
- **React Query (TanStack Query)** - Server state management
- **Zustand** - Client state management (for UI state, user preferences)

### AI Integration
- **Claude API** - AI-powered coaching insights and analysis

### Form Handling
- **React Hook Form** - Performant forms with Zod validation
- **@hookform/resolvers** - Zod resolver for form validation

## Server Components vs Client Components

### Default to Server Components
- **All components are server components by default** in Next.js 13+ App Router
- Only add `"use client"` when absolutely necessary
- Server components = better performance, smaller JS bundle, direct database access

### When to use Client Components (`"use client"`):

1. **Interactive UI Elements**
   - Components with `onClick`, `onChange`, `onSubmit` handlers
   - Forms with controlled inputs
   - Modals, dropdowns, accordions that users interact with

2. **Browser APIs**
   - Components using `window`, `document`, `localStorage`
   - Components that need to know viewport size, scroll position

3. **React Hooks**
   - Components using `useState`, `useEffect`, `useReducer`
   - Custom hooks that use client-side features
   - Components using `useRouter`, `usePathname` from Next.js

4. **Third-party Libraries**
   - Libraries that require browser environment
   - React Query providers, Context providers
   - Animation libraries that need DOM access

### When to use Server Components (default):

1. **Data Fetching**
   - Pages that fetch data from database
   - Components that display static data
   - Direct Supabase queries

2. **Static Content**
   - Headers, footers (unless they have interactive elements)
   - Text content, blog posts, documentation
   - Lists that just display data

3. **Layout Components**
   - Page layouts that just structure content
   - Wrappers that don't have state

### Current Component Status in Our App:

#### Client Components (correctly using "use client"):
- `providers.tsx` - Uses React Query context
- `sidebar.tsx` - Has useState for collapse/expand
- `header.tsx` - Could be server but has search input (will need interactivity)

#### Components that SHOULD BE Server Components:
- `app/page.tsx` (Dashboard) - Just displays data
- `client-metrics-card.tsx` - Static data display
- `recent-activity-card.tsx` - Static data display  
- `upcoming-sessions-card.tsx` - Static data display (Button is already a client component internally)

### Best Practices:

1. **Start with server components** - Only add "use client" when you get an error
2. **Push "use client" down** - Keep it on the smallest component possible
3. **Split components** - Separate interactive parts into small client components
4. **Data fetching on server** - Use async/await directly in server components

### Example Pattern:

```tsx
// app/clients/page.tsx - Server Component ✅
export default async function ClientsPage() {
  const clients = await getClientsFromSupabase(); // Direct DB access!
  
  return (
    <div>
      <h1>Clients</h1>
      <ClientsList clients={clients} /> {/* Server component displaying data */}
      <AddClientDialog /> {/* Client component for interactivity */}
    </div>
  );
}

// components/clients/clients-list.tsx - Server Component ✅
export function ClientsList({ clients }) {
  return (
    <div>
      {clients.map(client => (
        <ClientCard key={client.id} client={client} />
      ))}
    </div>
  );
}

// components/clients/add-client-dialog.tsx - Client Component ✅
"use client"
export function AddClientDialog() {
  const [open, setOpen] = useState(false);
  // Interactive component needs "use client"
}
```

### Remember:
- A client component can render server components as children
- But a server component cannot import a client component directly (only as children)
- Props passed from server to client components must be serializable (no functions)
# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

## Context Documents Feature

### Overview
Coaches can upload PDF, TXT, and MD files as context documents that are automatically included in all AI-generated analyses and preparations. This allows coaches to provide:
- Coaching frameworks
- Book summaries
- Personal principles and goals
- Client-specific background

### Implementation Details

1. **Storage**: Files are stored in Supabase Storage bucket `context-documents` with user-specific folders
2. **Text Extraction**: 
   - PDFs are parsed using `pdf-parse` library
   - Text/MD files are read directly
   - Content is stored in database for quick access
3. **AI Integration**: When generating analysis/preparation:
   ```typescript
   const contextResult = await getAllUserContextDocuments()
   const fullPrompt = `
   ${contextResult.data?.combinedContent}
   
   ${userCustomPrompt}
   
   ${transcript}
   `
   ```

### React Query Usage Pattern

All data fetching uses React Query with these conventions:
- **Query hooks**: `use[Resource]()` (e.g., `useContextDocuments()`)
- **Mutation hooks**: `use[Action][Resource]()` (e.g., `useDeleteDocument()`)
- **5-minute stale time** for caching
- **Optimistic updates** for delete operations
- **Toast notifications** for all mutations

Example:
```typescript
export function useDeleteDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => { /* ... */ },
    onMutate: async (deletedId) => {
      // Cancel queries and snapshot previous value
      await queryClient.cancelQueries({ queryKey: ['context-documents'] })
      const previousDocuments = queryClient.getQueryData(['context-documents'])
      
      // Optimistically update
      queryClient.setQueryData(['context-documents'], (old) => 
        old ? old.filter(doc => doc.id !== deletedId) : []
      )
      
      return { previousDocuments }
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousDocuments) {
        queryClient.setQueryData(['context-documents'], context.previousDocuments)
      }
    }
  })
}
```
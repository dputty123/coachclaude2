# Coach Claude Insights - Development Guidelines

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
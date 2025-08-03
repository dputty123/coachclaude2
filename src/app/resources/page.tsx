import { ResourceLibrary } from "@/components/resources/resource-library";

// Server Component - no "use client" needed
// In a real app, we could fetch resources data here:
// const resources = await getResourcesFromSupabase();

export default function ResourcesPage() {
  return (
    <div className="animate-in">
      <ResourceLibrary />
    </div>
  );
}
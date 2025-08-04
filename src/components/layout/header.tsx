"use client"

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-border bg-card p-4 flex justify-between items-center">
      <div className="flex items-center w-full max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            name="app-search"
            id="app-search"
            placeholder="Search clients, sessions, or resources..."
            className="w-full rounded-md border border-input pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coaching-500"
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
            data-1p-ignore
          />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <Button size="sm" variant="outline">Help</Button>
        <Link href="/new-session">
          <Button size="sm">+ New Session</Button>
        </Link>
      </div>
    </header>
  );
}
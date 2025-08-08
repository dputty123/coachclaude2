"use client"

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MessageSquare, FileText } from 'lucide-react';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSessions } from '@/hooks/use-sessions';
import { useClients } from '@/hooks/use-clients';
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

interface SessionListProps {
  userId: string;
}

export function SessionList({ userId }: SessionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  
  // Fetch sessions and clients data
  const { data: sessions, isLoading: sessionsLoading } = useSessions(userId);
  const { data: clients } = useClients(userId);
  
  // Get unique client names for the filter
  const clientOptions = useMemo(() => {
    if (!clients) return [];
    return clients.map(client => ({ id: client.id, name: client.name }));
  }, [clients]);
  
  // Filter sessions based on search and client
  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    
    return sessions.filter(session => {
      const matchesSearch = 
        session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.tags?.some(st => st.tag.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesClient = clientFilter === 'all' || session.clientId === clientFilter;
      
      return matchesSearch && matchesClient;
    });
  }, [sessions, searchTerm, clientFilter]);
  
  if (sessionsLoading) {
    return <SessionListSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <h2>Coaching Sessions</h2>
        </div>
        <Link href="/sessions/new">
          <Button>+ New Session</Button>
        </Link>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sessions..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clientOptions.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="session-card-grid">
        {filteredSessions.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">No sessions found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || clientFilter !== 'all' 
                  ? "Try adjusting your search or filters"
                  : "Create your first session to get started"}
              </p>
              {!searchTerm && clientFilter === 'all' && (
                <Link href="/sessions/new">
                  <Button>Create Session</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredSessions.map(session => (
            <Card key={session.id} className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-coaching-100 text-coaching-600 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">{session.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">{session.client.name}</p>
                  </div>
                </div>
                <div className="text-sm mb-4 space-y-1">
                  {session.date && (
                    <div>
                      <span className="font-medium">Date:</span> {format(new Date(session.date), 'MMM d, yyyy')}
                    </div>
                  )}
                  {session._count?.resources > 0 && (
                    <div>
                      <span className="font-medium">Resources:</span> {session._count.resources}
                    </div>
                  )}
                </div>
                {session.tags && session.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {session.tags.slice(0, 3).map((st) => (
                      <Badge key={st.tag.id} variant="secondary" className="text-xs">
                        {st.tag.name}
                      </Badge>
                    ))}
                    {session.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{session.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  <Link href={`/sessions/${session.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      {session.analysis ? 'View Details' : 'View Session'}
                    </Button>
                  </Link>
                  {!session.analysis && session.transcript && (
                    <Button variant="default" size="sm" disabled className="flex-1">
                      Analyze
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// Skeleton loader for sessions
function SessionListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <h2>Coaching Sessions</h2>
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-full sm:w-48" />
      </div>
      
      <div className="session-card-grid">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-4 w-2/3 mb-4" />
              <div className="flex gap-1 mb-4">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-14" />
              </div>
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
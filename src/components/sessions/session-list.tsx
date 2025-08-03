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
import { Search, MessageSquare } from 'lucide-react';
import { useState } from 'react';

// Mock data for sessions - would come from Supabase in the real app
const initialSessions = [
  { id: 1, client: 'Jane Smith', date: '2024-05-10', title: 'Leadership Strategy Session', themes: ['leadership', 'strategy', 'team management'] },
  { id: 2, client: 'Tom Johnson', date: '2024-05-08', title: 'Career Development Planning', themes: ['career', 'goals', 'planning'] },
  { id: 3, client: 'Maria Garcia', date: '2024-05-01', title: 'Executive Presence Workshop', themes: ['communication', 'presence', 'confidence'] },
  { id: 4, client: 'Alex Wong', date: '2024-04-25', title: 'Strategic Decision Making', themes: ['decision making', 'analysis', 'leadership'] },
  { id: 5, client: 'Sarah Lee', date: '2024-04-20', title: 'Conflict Resolution', themes: ['communication', 'conflict', 'relationships'] },
  { id: 6, client: 'David Kim', date: '2024-04-15', title: 'Team Leadership Growth', themes: ['leadership', 'team management', 'development'] },
];

export function SessionList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  
  // Get unique client names for the filter
  const clients = ['all', ...new Set(initialSessions.map(session => session.client))];
  
  const filteredSessions = initialSessions.filter(session => {
    const matchesSearch = 
      session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.themes.some(theme => theme.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesClient = clientFilter === 'all' || session.client === clientFilter;
    
    return matchesSearch && matchesClient;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <h2>Coaching Sessions</h2>
        </div>
        <Button>+ New Session</Button>
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
              {clients.map((client, index) => (
                <SelectItem key={index} value={client}>
                  {client === 'all' ? 'All Clients' : client}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="session-card-grid">
        {filteredSessions.map(session => (
          <Card key={session.id} className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-coaching-100 text-coaching-600 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">{session.title}</h3>
                  <p className="text-sm text-muted-foreground">{session.client}</p>
                </div>
              </div>
              <div className="text-sm mb-4">
                <span className="font-medium">Date:</span> {new Date(session.date).toLocaleDateString()}
              </div>
              <div className="flex flex-wrap gap-1 mb-4">
                {session.themes.map((theme, index) => (
                  <span key={index} className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md">
                    {theme}
                  </span>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full">View Analysis</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
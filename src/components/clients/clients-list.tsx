"use client"

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Users } from 'lucide-react';

// Mock data for clients - would come from Supabase in the real app
const initialClients = [
  { id: 1, name: 'Jane Smith', company: 'ABC Corp', role: 'Chief Marketing Officer', startDate: '2023-01-15' },
  { id: 2, name: 'Tom Johnson', company: 'XYZ Tech', role: 'VP of Product', startDate: '2023-03-22' },
  { id: 3, name: 'Maria Garcia', company: 'Global Foods', role: 'CEO', startDate: '2022-11-05' },
  { id: 4, name: 'Alex Wong', company: 'Innovative Solutions', role: 'CTO', startDate: '2023-06-10' },
  { id: 5, name: 'Sarah Lee', company: 'Finance Partners', role: 'COO', startDate: '2023-04-30' },
  { id: 6, name: 'David Kim', company: 'Digital Media', role: 'Director of Operations', startDate: '2023-02-18' },
];

export function ClientsList() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredClients = initialClients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <h2>Clients</h2>
        </div>
        <Button>+ Add Client</Button>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clients by name, company or role..." 
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <Link href={`/clients/${client.id}`} key={client.id}>
            <Card className="h-full card-hover">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-coaching-100 text-coaching-600 flex items-center justify-center font-medium text-lg">
                    {client.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-semibold">{client.name}</h3>
                    <p className="text-sm text-muted-foreground">{client.role}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Company:</span> {client.company}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Since:</span> {new Date(client.startDate).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
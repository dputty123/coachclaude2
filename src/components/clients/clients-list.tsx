"use client"

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users } from 'lucide-react';
import { useClients } from '@/hooks/use-clients';
import { useUser } from '@/hooks/use-user';

export function ClientsList() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { data: user } = useUser();
  const { data: clients, isLoading } = useClients(user?.id || '');
  
  const filteredClients = clients?.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (client.company?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (client.role?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <h2>Clients</h2>
        </div>
        <Button onClick={() => router.push('/clients/new')}>+ Add Client</Button>
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
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-full">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'No clients found matching your search.' : 'No clients yet.'}
          </p>
          {!searchTerm && (
            <Button onClick={() => router.push('/clients/new')}>
              Add Your First Client
            </Button>
          )}
        </div>
      ) : (
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
                      <p className="text-sm text-muted-foreground">{client.role || 'No role specified'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Company:</span> {client.company || 'Not specified'}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Sessions:</span> {client._count?.sessions || 0}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Since:</span> {new Date(client.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
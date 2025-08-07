'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useRouter } from 'next/navigation'
import type { Client } from '@/generated/prisma'

interface ClientSelectorProps {
  clients: Client[]
  value?: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  disabled?: boolean
  excludeId?: string // Exclude a client from the list (e.g., current client)
  onNavigateToNewClient?: () => void // Optional callback for custom navigation
}

export function ClientSelector({
  clients,
  value,
  onChange,
  placeholder = 'Select a client...',
  disabled = false,
  excludeId,
  onNavigateToNewClient
}: ClientSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const router = useRouter()

  // Filter out excluded client
  const availableClients = clients.filter(c => c.id !== excludeId)
  
  // Find selected client
  const selectedClient = availableClients.find(c => c.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedClient ? selectedClient.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput 
            placeholder="Search clients..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty>
            {availableClients.length > 0 && (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  No client found.
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    setOpen(false)
                    if (onNavigateToNewClient) {
                      onNavigateToNewClient()
                    } else {
                      router.push('/clients/new')
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Client
                </Button>
              </div>
            )}
          </CommandEmpty>
          <CommandGroup>
            {availableClients.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  No clients available.
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    setOpen(false)
                    if (onNavigateToNewClient) {
                      onNavigateToNewClient()
                    } else {
                      router.push('/clients/new')
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Client
                </Button>
              </div>
            ) : (
              <>
                <CommandItem
                  value=""
                  onSelect={() => {
                    onChange(null)
                    setOpen(false)
                  }}
                >
                  <span className="text-muted-foreground">None</span>
                </CommandItem>
                {availableClients.map((client) => (
              <CommandItem
                key={client.id}
                value={client.name}
                onSelect={() => {
                  onChange(client.id)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === client.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span>{client.name}</span>
                  {client.role && (
                    <span className="text-xs text-muted-foreground">{client.role}</span>
                  )}
                </div>
              </CommandItem>
            ))}
              </>
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

interface MultiClientSelectorProps {
  clients: Client[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  disabled?: boolean
  excludeId?: string
  onNavigateToNewClient?: () => void // Optional callback for custom navigation
}

export function MultiClientSelector({
  clients,
  value,
  onChange,
  placeholder = 'Select team members...',
  disabled = false,
  excludeId,
  onNavigateToNewClient
}: MultiClientSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const router = useRouter()

  // Filter out excluded client
  const availableClients = clients.filter(c => c.id !== excludeId)
  
  // Find selected clients
  const selectedClients = availableClients.filter(c => value.includes(c.id))

  const handleSelect = (clientId: string) => {
    if (value.includes(clientId)) {
      onChange(value.filter(id => id !== clientId))
    } else {
      onChange([...value, clientId])
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <span className="truncate">
            {selectedClients.length > 0
              ? selectedClients.length <= 2
                ? selectedClients.map(c => c.name).join(', ')
                : `${selectedClients[0].name} + ${selectedClients.length - 1} more`
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput 
            placeholder="Search clients..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty>
            {availableClients.length > 0 && (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  No client found.
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    setOpen(false)
                    if (onNavigateToNewClient) {
                      onNavigateToNewClient()
                    } else {
                      router.push('/clients/new')
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Client
                </Button>
              </div>
            )}
          </CommandEmpty>
          <CommandGroup>
            {availableClients.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  No clients available.
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    setOpen(false)
                    if (onNavigateToNewClient) {
                      onNavigateToNewClient()
                    } else {
                      router.push('/clients/new')
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Client
                </Button>
              </div>
            ) : (
              availableClients.map((client) => (
              <CommandItem
                key={client.id}
                value={client.name}
                onSelect={() => handleSelect(client.id)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value.includes(client.id) ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span>{client.name}</span>
                  {client.role && (
                    <span className="text-xs text-muted-foreground">{client.role}</span>
                  )}
                </div>
              </CommandItem>
            ))
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
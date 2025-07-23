"use client"

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Share2, Plus } from 'lucide-react';
import { AddResourceForm, ResourceFormData } from './add-resource-form';
import { toast } from 'sonner';

// Type for resources
interface Resource {
  id: number;
  title: string;
  description: string;
  url: string;
  tags: string[];
  shared: number;
}

// Mock data for resources - would come from Supabase in the real app
const initialResources = [
  { 
    id: 1, 
    title: 'Leadership Framework PDF', 
    description: 'A comprehensive framework for developing leadership skills at the executive level',
    url: 'https://example.com/leadership-framework.pdf',
    tags: ['leadership', 'framework', 'executive'],
    shared: 5,
  },
  { 
    id: 2, 
    title: 'Emotional Intelligence Assessment', 
    description: 'Tool for assessing emotional intelligence in professional settings',
    url: 'https://example.com/eq-assessment.pdf',
    tags: ['emotional-intelligence', 'assessment', 'development'],
    shared: 8,
  },
  { 
    id: 3, 
    title: 'Strategic Decision Making Model', 
    description: 'A model for approaching complex strategic decisions systematically',
    url: 'https://example.com/decision-model.pdf',
    tags: ['strategy', 'decision-making', 'framework'],
    shared: 3,
  },
  { 
    id: 4, 
    title: 'Effective Feedback Techniques', 
    description: 'Guide to giving and receiving constructive feedback',
    url: 'https://example.com/feedback-guide.pdf',
    tags: ['communication', 'feedback', 'leadership'],
    shared: 7,
  },
  { 
    id: 5, 
    title: 'Goal Setting Worksheet', 
    description: 'Template for setting SMART goals and tracking progress',
    url: 'https://example.com/goal-worksheet.docx',
    tags: ['goals', 'planning', 'development'],
    shared: 10,
  },
  { 
    id: 6, 
    title: 'Team Dynamics Analysis', 
    description: 'Framework for understanding and improving team dynamics',
    url: 'https://example.com/team-dynamics.pdf',
    tags: ['teams', 'leadership', 'organizational'],
    shared: 4,
  },
];

// Get all unique tags from resources
const getAllTags = (resources: Resource[]) => {
  const tagSet = new Set<string>();
  resources.forEach(resource => {
    resource.tags.forEach((tag: string) => tagSet.add(tag));
  });
  return Array.from(tagSet);
};

export const ResourceLibrary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const allTags = getAllTags(resources);
  
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddResource = (formData: ResourceFormData) => {
    const newResource: Resource = {
      id: Date.now(),
      title: formData.title,
      description: formData.description,
      url: formData.url,
      tags: formData.tags,
      shared: 0,
    };

    setResources([newResource, ...resources]);
    setShowAddForm(false);
    toast.success("Resource added successfully");
  };
  
  const filteredResources = resources.filter(resource => {
    const matchesSearch = 
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTags = 
      selectedTags.length === 0 || 
      selectedTags.some(tag => resource.tags.includes(tag));
    
    return matchesSearch && matchesTags;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <h2>Resource Library</h2>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Resource
        </Button>
      </div>
      
      {showAddForm ? (
        <AddResourceForm 
          onAdd={handleAddResource} 
          onCancel={() => setShowAddForm(false)} 
        />
      ) : (
        <>
          <div className="flex flex-col space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag, index) => (
                <Badge 
                  key={index}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map(resource => (
              <Card key={resource.id} className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                        <FileText className="h-5 w-5" />
                      </div>
                      <h3 className="font-semibold text-base">{resource.title}</h3>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      <Share2 className="h-3 w-3 mr-1" /> {resource.shared}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{resource.description}</p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {resource.tags.map((tag: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(resource.url, '_blank')}>
                      View
                    </Button>
                    <Button size="sm" className="flex-1">Share</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { X } from "lucide-react";

interface AddResourceFormProps {
  onAdd: (resource: ResourceFormData) => void;
  onCancel: () => void;
}

export interface ResourceFormData {
  title: string;
  url: string;
  description: string;
  tags: string[];
}

export const AddResourceForm = ({ onAdd, onCancel }: AddResourceFormProps) => {
  const [title, setTitle] = useState<string>("");
  const [url, setUrl] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [tagInput, setTagInput] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    
    if (!url.trim()) {
      toast.error("URL is required");
      return;
    }
    
    const newResource: ResourceFormData = {
      title,
      url,
      description,
      tags
    };
    
    onAdd(newResource);
    
    // Reset form
    setTitle("");
    setUrl("");
    setDescription("");
    setTags([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Resource</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resource-title">Title *</Label>
            <Input
              id="resource-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Resource title"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="resource-url">URL *</Label>
            <Input
              id="resource-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/resource"
              type="url"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="resource-description">Description</Label>
            <Textarea
              id="resource-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this resource contains and how it's useful"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="resource-tags">Tags</Label>
            <div className="flex space-x-2">
              <Input
                id="resource-tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tags"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" onClick={handleAddTag}>Add</Button>
            </div>
          </div>
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {tags.map((tag, index) => (
                <div key={index} className="flex items-center bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-secondary-foreground/70 hover:text-secondary-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">Save Resource</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
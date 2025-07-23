"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PromptTemplate } from "./types";

interface TemplateFormProps {
  activeTemplate: PromptTemplate | null;
  isEditing: boolean;
  onEditTemplate: (template: PromptTemplate) => void;
  onSaveTemplate: () => void;
  onCancelEdit: () => void;
  onStartEdit: () => void;
}

export const TemplateForm = ({
  activeTemplate,
  isEditing,
  onEditTemplate,
  onSaveTemplate,
  onCancelEdit,
  onStartEdit,
}: TemplateFormProps) => {
  if (!activeTemplate) {
    return (
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Select a template</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Select a template from the list to view or edit
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>
          {isEditing ? `Editing: ${activeTemplate.name}` : activeTemplate.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={activeTemplate.name}
                  onChange={(e) => onEditTemplate({
                    ...activeTemplate,
                    name: e.target.value
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="template-description">Description</Label>
                <Input
                  id="template-description"
                  value={activeTemplate.description}
                  onChange={(e) => onEditTemplate({
                    ...activeTemplate,
                    description: e.target.value
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="system-prompt">System Prompt</Label>
                <Textarea
                  id="system-prompt"
                  rows={5}
                  value={activeTemplate.systemPrompt}
                  onChange={(e) => onEditTemplate({
                    ...activeTemplate,
                    systemPrompt: e.target.value
                  })}
                  placeholder="Enter system prompt here..."
                />
                <p className="text-xs text-muted-foreground">
                  This defines Claude's persona and how it should approach the analysis
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="user-prompt">User Prompt Template</Label>
                <Textarea
                  id="user-prompt"
                  rows={8}
                  value={activeTemplate.userPrompt}
                  onChange={(e) => onEditTemplate({
                    ...activeTemplate,
                    userPrompt: e.target.value
                  })}
                  placeholder="Enter user prompt template here..."
                />
                <p className="text-xs text-muted-foreground">
                  Use {"{{transcript}}"} as placeholder for the session transcript
                </p>
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button onClick={onSaveTemplate}>
                  Save Template
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onCancelEdit}
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium">Description</h4>
                  <p className="text-muted-foreground">
                    {activeTemplate.description}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium">System Prompt</h4>
                  <div className="p-3 bg-muted/30 rounded-md mt-1 whitespace-pre-wrap">
                    {activeTemplate.systemPrompt}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium">User Prompt Template</h4>
                  <div className="p-3 bg-muted/30 rounded-md mt-1 whitespace-pre-wrap">
                    {activeTemplate.userPrompt.replace(/\{\{transcript\}\}/g, "[TRANSCRIPT]")}
                  </div>
                </div>
                
                <Button onClick={onStartEdit}>
                  Edit Template
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PromptTemplate } from "./types";
import { Loader2 } from "lucide-react";

interface TemplateFormProps {
  activeTemplate: PromptTemplate | null;
  isEditing: boolean;
  onEditTemplate: (template: PromptTemplate) => void;
  onSaveTemplate: () => void;
  onCancelEdit: () => void;
  onStartEdit: () => void;
  saving?: boolean;
}

export const TemplateForm = ({
  activeTemplate,
  isEditing,
  onEditTemplate,
  onSaveTemplate,
  onCancelEdit,
  onStartEdit,
  saving,
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
                <Label htmlFor="template-type">Template Type</Label>
                <Select
                  value={activeTemplate.type}
                  onValueChange={(value: 'analysis' | 'preparation') => onEditTemplate({
                    ...activeTemplate,
                    type: value
                  })}
                >
                  <SelectTrigger id="template-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="analysis">Analysis</SelectItem>
                    <SelectItem value="preparation">Preparation</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose whether this template is for post-session analysis or pre-session preparation
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="template-content">Template Content</Label>
                <Textarea
                  id="template-content"
                  rows={12}
                  value={activeTemplate.content}
                  onChange={(e) => onEditTemplate({
                    ...activeTemplate,
                    content: e.target.value
                  })}
                  placeholder="Enter your prompt template here..."
                />
                <p className="text-xs text-muted-foreground">
                  This prompt will guide Claude in analyzing sessions or preparing for upcoming meetings
                </p>
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button onClick={onSaveTemplate} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Template'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onCancelEdit}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium">Template Type</h4>
                  <p className="text-muted-foreground capitalize">
                    {activeTemplate.type}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium">Template Content</h4>
                  <div className="p-3 bg-muted/30 rounded-md mt-1 whitespace-pre-wrap">
                    {activeTemplate.content}
                  </div>
                </div>
                
                <Button onClick={onStartEdit} disabled={activeTemplate.id === 'new'}>
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
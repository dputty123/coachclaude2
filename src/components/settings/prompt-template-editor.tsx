"use client"

import { useState } from "react";
import { toast } from "sonner";
import { TemplateList } from "./template-list";
import { TemplateForm } from "./template-form";
import { PromptTemplate } from "./types";

// Mock data for initial templates
const initialTemplates: PromptTemplate[] = [
  {
    id: "1",
    name: "Standard Analysis",
    description: "Default analysis for coaching sessions",
    systemPrompt: 
      "You are Coach Claude, a master-level executive coaching supervisor. " +
      "Your job: turn coaching session transcripts into concise, structured insight. " +
      "Output must be valid JSON matching the provided schema.",
    userPrompt: 
      "- transcript: |\n" +
      "    {{transcript}}\n" +
      "- schema:\n" +
      "    {\n" +
      "      \"key_themes\": [string],\n" +
      "      \"coach_feedback\": [string],\n" +
      "      \"improvement_opportunities\": [string],\n" +
      "      \"follow_up_recommendations\": [string],\n" +
      "      \"supervisor_perspective\": string\n" +
      "    }"
  },
  {
    id: "2",
    name: "Quick Summary",
    description: "Brief summary of key points",
    systemPrompt: 
      "You are a concise coaching supervisor who extracts only the most important information.",
    userPrompt: 
      "Provide a brief summary of the key points from this coaching transcript:\n\n{{transcript}}"
  }
];

export const PromptTemplateEditor = () => {
  const [templates, setTemplates] = useState<PromptTemplate[]>(initialTemplates);
  const [activeTemplate, setActiveTemplate] = useState<PromptTemplate | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const handleAddTemplate = () => {
    const newTemplate: PromptTemplate = {
      id: Date.now().toString(),
      name: "New Template",
      description: "Description goes here",
      systemPrompt: "You are Coach Claude, a master-level executive coaching supervisor.",
      userPrompt: "Analyze the following coaching transcript: {{transcript}}"
    };
    
    setTemplates([...templates, newTemplate]);
    setActiveTemplate(newTemplate);
    setIsEditing(true);
  };

  const handleDeleteTemplate = (id: string) => {
    if (templates.length <= 1) {
      toast.error("You must have at least one template");
      return;
    }
    
    setTemplates(templates.filter(t => t.id !== id));
    if (activeTemplate?.id === id) {
      setActiveTemplate(null);
      setIsEditing(false);
    }
    toast.success("Template deleted");
  };

  const handleSaveTemplate = () => {
    if (!activeTemplate) return;
    
    setTemplates(templates.map(t => 
      t.id === activeTemplate.id ? activeTemplate : t
    ));
    setIsEditing(false);
    toast.success("Template saved successfully");
  };

  const handleSelectTemplate = (template: PromptTemplate) => {
    setActiveTemplate(template);
    setIsEditing(false);
  };

  const handleEditTemplate = (updatedTemplate: PromptTemplate) => {
    setActiveTemplate(updatedTemplate);
  };

  const handleCancelEdit = () => {
    if (!activeTemplate) return;
    
    const originalTemplate = templates.find(t => t.id === activeTemplate.id);
    if (originalTemplate) {
      setActiveTemplate(originalTemplate);
    }
    setIsEditing(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <TemplateList
        templates={templates}
        activeTemplateId={activeTemplate?.id || null}
        onSelectTemplate={handleSelectTemplate}
        onAddTemplate={handleAddTemplate}
        onDeleteTemplate={handleDeleteTemplate}
      />
      <TemplateForm
        activeTemplate={activeTemplate}
        isEditing={isEditing}
        onEditTemplate={handleEditTemplate}
        onSaveTemplate={handleSaveTemplate}
        onCancelEdit={handleCancelEdit}
        onStartEdit={() => setIsEditing(true)}
      />
    </div>
  );
};
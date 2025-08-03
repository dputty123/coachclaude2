"use client"

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { TemplateList } from "./template-list";
import { TemplateForm } from "./template-form";
import { PromptTemplate } from "./types";
import {
  getPromptTemplates,
  createPromptTemplate,
  updatePromptTemplate,
  deletePromptTemplate,
  setTemplateAsDefault,
  getUserSettings
} from "@/app/actions/settings";
import { Loader2 } from "lucide-react";

export const PromptTemplateEditor = () => {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<PromptTemplate | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeAnalysisId, setActiveAnalysisId] = useState<string | null>(null);
  const [activePreparationId, setActivePreparationId] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    const [templatesResult, settingsResult] = await Promise.all([
      getPromptTemplates(),
      getUserSettings()
    ]);
    
    if (templatesResult.success && templatesResult.data) {
      setTemplates(templatesResult.data);
    }
    
    if (settingsResult.success && settingsResult.data) {
      // Find which templates are currently active
      const analysisTemplate = templatesResult.data?.find(
        t => t.type === 'analysis' && t.content === settingsResult.data.analysisPrompt
      );
      const prepTemplate = templatesResult.data?.find(
        t => t.type === 'preparation' && t.content === settingsResult.data.preparationPrompt
      );
      
      setActiveAnalysisId(analysisTemplate?.id || null);
      setActivePreparationId(prepTemplate?.id || null);
    }
    
    setLoading(false);
  };

  const handleAddTemplate = () => {
    const newTemplate: PromptTemplate = {
      id: 'new',
      name: "New Template",
      type: 'analysis', // Default to analysis
      content: "",
      isDefault: false
    };
    
    setActiveTemplate(newTemplate);
    setIsEditing(true);
  };

  const handleDeleteTemplate = async (id: string) => {
    // Check if this is an active template
    const template = templates.find(t => t.id === id);
    if (!template) return;
    
    const isActive = (template.type === 'analysis' && id === activeAnalysisId) ||
                    (template.type === 'preparation' && id === activePreparationId);
    
    if (isActive) {
      toast.error("Cannot delete active template. Please set a different template as default first.");
      return;
    }
    
    setSaving(true);
    const result = await deletePromptTemplate(id);
    
    if (result.success) {
      await loadTemplates();
      if (activeTemplate?.id === id) {
        setActiveTemplate(null);
        setIsEditing(false);
      }
      toast.success("Template deleted");
    } else {
      toast.error(result.error || "Failed to delete template");
    }
    setSaving(false);
  };

  const handleSaveTemplate = async () => {
    if (!activeTemplate) return;
    
    setSaving(true);
    
    try {
      if (activeTemplate.id === 'new') {
        // Create new template
        const result = await createPromptTemplate(
          activeTemplate.name,
          activeTemplate.type,
          activeTemplate.content
        );
        
        if (result.success) {
          await loadTemplates();
          setActiveTemplate(result.data!);
          setIsEditing(false);
          toast.success("Template created successfully");
        } else {
          toast.error(result.error || "Failed to create template");
        }
      } else {
        // Update existing template
        const result = await updatePromptTemplate(
          activeTemplate.id,
          activeTemplate.name,
          activeTemplate.content
        );
        
        if (result.success) {
          await loadTemplates();
          setIsEditing(false);
          toast.success("Template saved successfully");
        } else {
          toast.error(result.error || "Failed to save template");
        }
      }
    } finally {
      setSaving(false);
    }
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
  
  const handleSetAsDefault = async (id: string) => {
    setSaving(true);
    const result = await setTemplateAsDefault(id);
    
    if (result.success) {
      await loadTemplates();
      toast.success("Template set as default");
    } else {
      toast.error(result.error || "Failed to set as default");
    }
    setSaving(false);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <TemplateList
        templates={templates}
        activeTemplateId={activeTemplate?.id || null}
        activeAnalysisId={activeAnalysisId}
        activePreparationId={activePreparationId}
        onSelectTemplate={handleSelectTemplate}
        onAddTemplate={handleAddTemplate}
        onDeleteTemplate={handleDeleteTemplate}
        onSetAsDefault={handleSetAsDefault}
        loading={saving}
      />
      <TemplateForm
        activeTemplate={activeTemplate}
        isEditing={isEditing}
        onEditTemplate={handleEditTemplate}
        onSaveTemplate={handleSaveTemplate}
        onCancelEdit={handleCancelEdit}
        onStartEdit={() => setIsEditing(true)}
        saving={saving}
      />
    </div>
  );
};
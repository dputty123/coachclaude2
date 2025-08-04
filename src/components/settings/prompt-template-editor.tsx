"use client"

import { useState } from "react";
import { toast } from "sonner";
import { TemplateList } from "./template-list";
import { TemplateForm } from "./template-form";
import { PromptTemplate } from "./types";
import { Loader2 } from "lucide-react";
import { 
  usePromptTemplates,
  useCreatePromptTemplate,
  useUpdatePromptTemplate,
  useDeletePromptTemplate,
  useSetTemplateAsDefault
} from "@/hooks/use-prompt-templates";
import { useUserSettings } from "@/hooks/use-settings";

export const PromptTemplateEditor = () => {
  // React Query hooks
  const { data: templates = [], isLoading: templatesLoading } = usePromptTemplates();
  const { data: settings } = useUserSettings();
  const createTemplate = useCreatePromptTemplate();
  const updateTemplate = useUpdatePromptTemplate();
  const deleteTemplate = useDeletePromptTemplate();
  const setAsDefault = useSetTemplateAsDefault();

  // Local state
  const [activeTemplate, setActiveTemplate] = useState<PromptTemplate | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Determine which templates are currently active
  const activeAnalysisId = templates.find(
    t => t.type === 'analysis' && t.content === settings?.analysisPrompt
  )?.id || null;
  
  const activePreparationId = templates.find(
    t => t.type === 'preparation' && t.content === settings?.preparationPrompt
  )?.id || null;

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
    
    await deleteTemplate.mutateAsync(id, {
      onSuccess: () => {
        if (activeTemplate?.id === id) {
          setActiveTemplate(null);
          setIsEditing(false);
        }
      }
    });
  };

  const handleSaveTemplate = async () => {
    if (!activeTemplate) return;
    
    if (activeTemplate.id === 'new') {
      // Create new template
      await createTemplate.mutateAsync(
        {
          name: activeTemplate.name,
          type: activeTemplate.type,
          content: activeTemplate.content
        },
        {
          onSuccess: (data) => {
            setActiveTemplate(data as PromptTemplate);
            setIsEditing(false);
          }
        }
      );
    } else {
      // Update existing template
      await updateTemplate.mutateAsync(
        {
          id: activeTemplate.id,
          name: activeTemplate.name,
          content: activeTemplate.content
        },
        {
          onSuccess: () => {
            setIsEditing(false);
          }
        }
      );
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
    await setAsDefault.mutateAsync(id);
  };
  
  if (templatesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const saving = createTemplate.isPending || updateTemplate.isPending || 
                 deleteTemplate.isPending || setAsDefault.isPending;

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
"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Trash, Check } from "lucide-react";
import { PromptTemplate } from "./types";

interface TemplateListProps {
  templates: PromptTemplate[];
  activeTemplateId: string | null;
  activeAnalysisId: string | null;
  activePreparationId: string | null;
  onSelectTemplate: (template: PromptTemplate) => void;
  onAddTemplate: () => void;
  onDeleteTemplate: (id: string) => void;
  onSetAsDefault: (id: string) => void;
  loading?: boolean;
}

export const TemplateList = ({
  templates,
  activeTemplateId,
  activeAnalysisId,
  activePreparationId,
  onSelectTemplate,
  onAddTemplate,
  onDeleteTemplate,
  onSetAsDefault,
  loading,
}: TemplateListProps) => {
  return (
    <Card className="md:col-span-1">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Templates
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onAddTemplate}
            className="h-8 w-8 p-0"
          >
            <PlusCircle className="h-5 w-5" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {templates.map(template => (
            <div 
              key={template.id}
              className={`p-3 rounded-md cursor-pointer flex justify-between items-center ${
                activeTemplateId === template.id 
                  ? "bg-coaching-100 border border-coaching-300" 
                  : "hover:bg-muted/50 border"
              }`}
              onClick={() => onSelectTemplate(template)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{template.name}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {template.type}
                  </Badge>
                  {((template.type === 'analysis' && template.id === activeAnalysisId) ||
                    (template.type === 'preparation' && template.id === activePreparationId)) && (
                    <Badge variant="default" className="text-xs">
                      <Check className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 px-2"
                    disabled={loading || 
                      ((template.type === 'analysis' && template.id === activeAnalysisId) ||
                       (template.type === 'preparation' && template.id === activePreparationId))}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetAsDefault(template.id);
                    }}
                  >
                    Set as Default
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-50 hover:opacity-100 h-7 w-7 p-0"
                    disabled={loading}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTemplate(template.id);
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
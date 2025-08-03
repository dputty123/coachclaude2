"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash } from "lucide-react";
import { PromptTemplate } from "./types";

interface TemplateListProps {
  templates: PromptTemplate[];
  activeTemplateId: string | null;
  onSelectTemplate: (template: PromptTemplate) => void;
  onAddTemplate: () => void;
  onDeleteTemplate: (id: string) => void;
}

export const TemplateList = ({
  templates,
  activeTemplateId,
  onSelectTemplate,
  onAddTemplate,
  onDeleteTemplate,
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
              <div>
                <h4 className="font-medium">{template.name}</h4>
                <p className="text-sm text-muted-foreground truncate">
                  {template.description}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-50 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteTemplate(template.id);
                }}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
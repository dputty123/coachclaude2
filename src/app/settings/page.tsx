"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PromptTemplateEditor } from "@/components/settings/prompt-template-editor";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState<string>("");
  const [isApiKeySaved, setIsApiKeySaved] = useState<boolean>(false);
  const [systemPrompt, setSystemPrompt] = useState<string>(
    "You are Coach Claude, a master-level executive coaching supervisor with expertise in leadership development, emotional intelligence, and strategic decision-making. Your job is to analyze coaching session transcripts and provide structured, actionable insights that help coaches improve their practice and better serve their clients.\n\nWhen analyzing transcripts, consider:\n- The coach's questioning techniques and active listening skills\n- Client insights and breakthroughs\n- Emotional patterns and underlying themes\n- Opportunities for deeper exploration\n- Potential resources that might benefit the client\n- Follow-up strategies to reinforce learning"
  );
  const [isSystemPromptSaved, setIsSystemPromptSaved] = useState<boolean>(false);
  const [lastSavedPrompt, setLastSavedPrompt] = useState<string>("");

  useEffect(() => {
    // Load saved system prompt and API key from localStorage
    const savedApiKey = localStorage.getItem("claudeApiKey");
    const savedSystemPrompt = localStorage.getItem("systemPrompt");
    
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setIsApiKeySaved(true);
    }
    
    if (savedSystemPrompt) {
      setSystemPrompt(savedSystemPrompt);
      setLastSavedPrompt(savedSystemPrompt);
      setIsSystemPromptSaved(true);
    } else {
      setLastSavedPrompt(systemPrompt);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast.error("Please enter a valid API key");
      return;
    }
    
    // In a real implementation, this would securely store the API key in Supabase
    localStorage.setItem("claudeApiKey", apiKey);
    setIsApiKeySaved(true);
    toast.success("API key saved successfully");
  };

  const handleSaveSystemPrompt = () => {
    if (!systemPrompt.trim()) {
      toast.error("Please enter a system prompt");
      return;
    }
    
    // In a real implementation, this would securely store the system prompt in Supabase
    localStorage.setItem("systemPrompt", systemPrompt);
    setLastSavedPrompt(systemPrompt);
    setIsSystemPromptSaved(true);
    toast.success("System prompt saved successfully");
  };

  const hasUnsavedChanges = systemPrompt !== lastSavedPrompt;

  return (
    <div className="animate-in">
      <div className="mb-6">
        <h2>Settings</h2>
        <p className="text-muted-foreground">
          Configure your Coach Claude application
        </p>
      </div>

      <Tabs defaultValue="api" className="space-y-6">
        <TabsList>
          <TabsTrigger value="api">API Configuration</TabsTrigger>
          <TabsTrigger value="system-prompt">System Prompt</TabsTrigger>
          <TabsTrigger value="templates">Prompt Templates</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Claude API Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">Claude API Key</Label>
                <div className="flex space-x-2">
                  <Input
                    id="api-key"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Claude API key"
                    className="flex-1"
                  />
                  <Button onClick={handleSaveApiKey}>Save Key</Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your API key is stored securely and is used to access Claude's services.
                  {isApiKeySaved && " Your API key has been saved."}
                </p>
              </div>
              
              <div className="space-y-2 pt-4">
                <Label htmlFor="api-model">Default Model</Label>
                <select 
                  id="api-model" 
                  className="w-full p-2 border rounded-md"
                  defaultValue="claude-3-opus-20240229"
                >
                  <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                  <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                  <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                </select>
                <p className="text-sm text-muted-foreground">
                  Select the Claude model to use for generating coaching insights.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system-prompt" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System-Level Prompt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="system-prompt">Master Coaching Philosophy</Label>
                <Textarea
                  id="system-prompt"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Enter your coaching philosophy, approaches, and methodologies..."
                  className="min-h-[300px]"
                />
                <p className="text-sm text-muted-foreground">
                  This system-level prompt will be applied to all analyses. It should capture your coaching 
                  philosophy, methodologies, and the lens through which you want Claude to analyze sessions.
                </p>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm">
                  {isSystemPromptSaved && !hasUnsavedChanges ? (
                    <span className="text-green-600">System prompt is saved</span>
                  ) : (
                    <span className="text-amber-600">You have unsaved changes</span>
                  )}
                </div>
                <Button 
                  onClick={handleSaveSystemPrompt} 
                  disabled={!hasUnsavedChanges}
                >
                  Save System Prompt
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <PromptTemplateEditor />
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Application Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-session-duration">
                  Default Session Duration (minutes)
                </Label>
                <Input
                  id="default-session-duration"
                  type="number"
                  defaultValue={60}
                  min={15}
                  step={15}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <select 
                  id="theme" 
                  className="w-full p-2 border rounded-md"
                  defaultValue="light"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System Default</option>
                </select>
              </div>
              
              <Button className="mt-4">Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
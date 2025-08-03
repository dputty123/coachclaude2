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
import { CLAUDE_MODELS, DEFAULT_CLAUDE_MODEL } from "@/lib/constants/claude-models";
import { 
  getUserSettings, 
  updateApiConfiguration, 
  updateSystemPrompt 
} from "@/app/actions/settings";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState<string>("");
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_CLAUDE_MODEL);
  const [analysisPrompt, setAnalysisPrompt] = useState<string>("");
  const [preparationPrompt, setPreparationPrompt] = useState<string>("");
  const [lastSavedAnalysis, setLastSavedAnalysis] = useState<string>("");
  const [lastSavedPreparation, setLastSavedPreparation] = useState<string>("");
  const [savingApi, setSavingApi] = useState(false);
  const [savingPrompt, setSavingPrompt] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const result = await getUserSettings();
      if (result.success && result.data) {
        setHasApiKey(result.data.hasApiKey || false);
        setSelectedModel(result.data.claudeModel || DEFAULT_CLAUDE_MODEL);
        setAnalysisPrompt(result.data.analysisPrompt || "");
        setPreparationPrompt(result.data.preparationPrompt || "");
        setLastSavedAnalysis(result.data.analysisPrompt || "");
        setLastSavedPreparation(result.data.preparationPrompt || "");
      }
      setLoading(false);
    };
    loadSettings();
  }, []);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error("Please enter a valid API key");
      return;
    }
    
    setSavingApi(true);
    const result = await updateApiConfiguration(apiKey, selectedModel);
    
    if (result.success) {
      setHasApiKey(true);
      setApiKey(""); // Clear the input after saving
      toast.success("API configuration saved successfully");
    } else {
      toast.error(result.error || "Failed to save API configuration");
    }
    setSavingApi(false);
  };

  const handleSaveAnalysisPrompt = async () => {
    if (!analysisPrompt.trim()) {
      toast.error("Please enter an analysis prompt");
      return;
    }
    
    setSavingPrompt(true);
    const result = await updateSystemPrompt('analysis', analysisPrompt);
    
    if (result.success) {
      setLastSavedAnalysis(analysisPrompt);
      toast.success("Analysis prompt saved successfully");
    } else {
      toast.error(result.error || "Failed to save analysis prompt");
    }
    setSavingPrompt(false);
  };

  const handleSavePreparationPrompt = async () => {
    if (!preparationPrompt.trim()) {
      toast.error("Please enter a preparation prompt");
      return;
    }
    
    setSavingPrompt(true);
    const result = await updateSystemPrompt('preparation', preparationPrompt);
    
    if (result.success) {
      setLastSavedPreparation(preparationPrompt);
      toast.success("Preparation prompt saved successfully");
    } else {
      toast.error(result.error || "Failed to save preparation prompt");
    }
    setSavingPrompt(false);
  };

  const hasUnsavedAnalysis = analysisPrompt !== lastSavedAnalysis;
  const hasUnsavedPreparation = preparationPrompt !== lastSavedPreparation;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
          <TabsTrigger value="system-prompt">System Prompts</TabsTrigger>
          <TabsTrigger value="templates">Prompt Templates</TabsTrigger>
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
                  <Button onClick={handleSaveApiKey} disabled={savingApi}>
                    {savingApi ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Configuration'
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your API key is stored securely and is used to access Claude&apos;s services.
                  {hasApiKey && " API key is configured."}
                </p>
              </div>
              
              <div className="space-y-2 pt-4">
                <Label htmlFor="api-model">Default Model</Label>
                <select 
                  id="api-model" 
                  className="w-full p-2 border rounded-md"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  {CLAUDE_MODELS.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-muted-foreground">
                  Select the Claude model to use for generating coaching insights.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system-prompt" className="space-y-6">
          <Tabs defaultValue="analysis" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="analysis">Analysis Prompt</TabsTrigger>
              <TabsTrigger value="preparation">Preparation Prompt</TabsTrigger>
            </TabsList>
            
            <TabsContent value="analysis" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Post-Session Analysis Prompt</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="analysis-prompt">Analysis Guidelines</Label>
                    <Textarea
                      id="analysis-prompt"
                      value={analysisPrompt}
                      onChange={(e) => setAnalysisPrompt(e.target.value)}
                      placeholder="Enter your analysis prompt..."
                      className="min-h-[300px]"
                    />
                    <p className="text-sm text-muted-foreground">
                      This prompt guides how Claude analyzes coaching session transcripts, including summary, 
                      insights, action items, and follow-up emails.
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm">
                      {!hasUnsavedAnalysis ? (
                        <span className="text-green-600">Analysis prompt is saved</span>
                      ) : (
                        <span className="text-amber-600">You have unsaved changes</span>
                      )}
                    </div>
                    <Button 
                      onClick={handleSaveAnalysisPrompt} 
                      disabled={!hasUnsavedAnalysis || savingPrompt}
                    >
                      {savingPrompt ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Analysis Prompt'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="preparation" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pre-Session Preparation Prompt</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="preparation-prompt">Preparation Guidelines</Label>
                    <Textarea
                      id="preparation-prompt"
                      value={preparationPrompt}
                      onChange={(e) => setPreparationPrompt(e.target.value)}
                      placeholder="Enter your preparation prompt..."
                      className="min-h-[300px]"
                    />
                    <p className="text-sm text-muted-foreground">
                      This prompt guides how Claude prepares you for upcoming coaching sessions based on 
                      client history and previous sessions.
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm">
                      {!hasUnsavedPreparation ? (
                        <span className="text-green-600">Preparation prompt is saved</span>
                      ) : (
                        <span className="text-amber-600">You have unsaved changes</span>
                      )}
                    </div>
                    <Button 
                      onClick={handleSavePreparationPrompt} 
                      disabled={!hasUnsavedPreparation || savingPrompt}
                    >
                      {savingPrompt ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Preparation Prompt'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="templates">
          <PromptTemplateEditor />
        </TabsContent>

      </Tabs>
    </div>
  );
}
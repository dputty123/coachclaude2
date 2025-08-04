"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { updateUserProfile } from "@/app/actions/profile";
import { Lock } from "lucide-react";

interface ProfileClientProps {
  initialData: {
    id: string;
    email: string;
    name: string | null;
  };
}

export default function ProfileClient({ initialData }: ProfileClientProps) {
  const [name, setName] = useState<string>(initialData.name || "");
  const [email] = useState<string>(initialData.email);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const supabase = createClient();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateUserProfile(name);
      
      if (result.success) {
        toast.success("Profile updated successfully!");
        setIsEditing(false);
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Profile update error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName(initialData.name || "");
    setIsEditing(false);
  };

  const handleSignOut = async () => {
    // Navigate immediately to prevent flash
    window.location.href = "/auth";
    // Sign out in the background (the redirect will happen before this completes)
    await supabase.auth.signOut();
  };

  return (
    <div className="animate-in">
      <div className="mb-6">
        <h2>Your Profile</h2>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  disabled={isSaving}
                />
              ) : (
                <div className="p-2 border rounded-md bg-muted/20">
                  {name || "No name set"}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="flex items-center gap-2">
                Email Address
                <Lock className="h-3 w-3 text-muted-foreground" />
              </Label>
              <div className="p-2 border rounded-md bg-muted/20 text-muted-foreground">
                {email}
              </div>
              <p className="text-xs text-muted-foreground">
                Contact support to change your email address
              </p>
            </div>

            <div className="pt-2">
              {isEditing ? (
                <div className="flex space-x-2">
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <Button onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Sign Out</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
                        <AlertDialogDescription>
                          You will be redirected to the login page and will need to sign in again to access your account.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSignOut}>
                          Sign Out
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
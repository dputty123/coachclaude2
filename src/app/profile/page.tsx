"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

export default function ProfilePage() {
  const [name, setName] = useState<string>("Coach User");
  const [email, setEmail] = useState<string>("coach@example.com");
  const [timeZone, setTimeZone] = useState<string>("America/New_York");
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const handleSave = () => {
    // This would connect to Supabase in the real implementation
    toast.success("Profile updated successfully!");
    setIsEditing(false);
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
                />
              ) : (
                <div className="p-2 border rounded-md bg-muted/20">{name}</div>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">Email Address</Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              ) : (
                <div className="p-2 border rounded-md bg-muted/20">{email}</div>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="timezone">Time Zone</Label>
              {isEditing ? (
                <Input
                  id="timezone"
                  value={timeZone}
                  onChange={(e) => setTimeZone(e.target.value)}
                />
              ) : (
                <div className="p-2 border rounded-md bg-muted/20">{timeZone}</div>
              )}
            </div>

            <div className="pt-2">
              {isEditing ? (
                <div className="flex space-x-2">
                  <Button onClick={handleSave}>Save Changes</Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
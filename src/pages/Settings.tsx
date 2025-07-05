
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newEmail, setNewEmail] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [voiceResponses, setVoiceResponses] = useState(true);
  const [voiceInterruption, setVoiceInterruption] = useState(true);
  const [localStorageOnly, setLocalStorageOnly] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  const [dailyCheckIns, setDailyCheckIns] = useState(false);
  const [breathingReminders, setBreathingReminders] = useState(false);

  const handleUpdateEmail = async () => {
    if (!newEmail || newEmail === user?.email) {
      toast({
        title: "Error",
        description: "Please enter a different email address",
        variant: "destructive"
      });
      return;
    }

    setIsUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) {
        toast({
          title: "Error updating email",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Email update requested",
          description: "Check both your old and new email addresses for confirmation links to complete the change.",
          duration: 8000
        });
        setNewEmail('');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleClearAllData = () => {
    // This would clear all user data
    console.log('Clearing all data...');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Customize your experience and manage your preferences.</p>
        </div>

        <div className="space-y-6">
          {/* Account Section */}
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Manage your account information and settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="current-email" className="text-sm font-medium text-gray-900">Current Email</Label>
                <Input
                  id="current-email"
                  value={user?.email || 'Not signed in'}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-email" className="text-sm font-medium text-gray-900">New Email Address</Label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="Enter new email address"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={!user}
                />
              </div>

              <Button 
                onClick={handleUpdateEmail}
                disabled={!user || !newEmail || isUpdatingEmail}
                className="w-full sm:w-auto"
              >
                {isUpdatingEmail ? 'Updating...' : 'Update Email'}
              </Button>

              {user && (
                <p className="text-sm text-gray-500">
                  You'll receive confirmation emails at both your current and new email addresses to complete the change.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Voice & Language Section */}
          <Card>
            <CardHeader>
              <CardTitle>Voice & Language</CardTitle>
              <CardDescription>Configure how the AI speaks and responds to you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Language</label>
                <Select defaultValue="english">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English (Vanessa)</SelectItem>
                    <SelectItem value="spanish">Spanish</SelectItem>
                    <SelectItem value="french">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Voice Responses</h4>
                  <p className="text-sm text-gray-500">Enable AI to speak responses aloud</p>
                </div>
                <Switch
                  checked={voiceResponses}
                  onCheckedChange={setVoiceResponses}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Voice Interruption</h4>
                  <p className="text-sm text-gray-500">Allow interrupting AI by speaking</p>
                </div>
                <Switch
                  checked={voiceInterruption}
                  onCheckedChange={setVoiceInterruption}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Data Section */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy & Data</CardTitle>
              <CardDescription>Control how your data is stored and used.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Local Storage Only</h4>
                  <p className="text-sm text-gray-500">Keep all data on your device</p>
                </div>
                <Switch
                  checked={localStorageOnly}
                  onCheckedChange={setLocalStorageOnly}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Analytics</h4>
                  <p className="text-sm text-gray-500">Help improve the app with anonymous usage data</p>
                </div>
                <Switch
                  checked={analytics}
                  onCheckedChange={setAnalytics}
                />
              </div>

              <div className="pt-4 border-t">
                <Button 
                  variant="destructive" 
                  onClick={handleClearAllData}
                  className="mb-2"
                >
                  Clear All Data
                </Button>
                <p className="text-sm text-gray-500">
                  This will permanently delete all your conversation history and settings.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notifications Section */}
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage how and when you receive notifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Daily Check-ins</h4>
                  <p className="text-sm text-gray-500">Gentle reminders to track your mood</p>
                </div>
                <Switch
                  checked={dailyCheckIns}
                  onCheckedChange={setDailyCheckIns}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Breathing Reminders</h4>
                  <p className="text-sm text-gray-500">Periodic reminders for breathing exercises</p>
                </div>
                <Switch
                  checked={breathingReminders}
                  onCheckedChange={setBreathingReminders}
                />
              </div>
            </CardContent>
          </Card>

          {/* About Section */}
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
              <CardDescription>Information about the application and support.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Version</h4>
                  <p className="text-sm text-gray-500">1.0.0</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Last Updated</h4>
                  <p className="text-sm text-gray-500">Today</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" size="sm">Privacy Policy</Button>
                <Button variant="outline" size="sm">Terms of Service</Button>
                <Button variant="outline" size="sm">Support</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;

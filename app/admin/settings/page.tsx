"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth-context"
import { adminApi } from "@/lib/api"
import { toast } from "sonner"

interface Settings {
  notificationSettings: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    warrantyExpiryAlerts: boolean;
    systemAlerts: boolean;
  };
  emailSettings: {
    smtpHost: string;
    smtpPort: string;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
  };
  systemSettings: {
    maintenanceMode: boolean;
    allowRegistration: boolean;
    maxLoginAttempts: number;
    sessionTimeout: number;
  };
}

export default function AdminSettingsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [settings, setSettings] = useState<Settings>({
    notificationSettings: {
      emailNotifications: true,
      pushNotifications: true,
      warrantyExpiryAlerts: true,
      systemAlerts: true
    },
    emailSettings: {
      smtpHost: "",
      smtpPort: "",
      smtpUser: "",
      smtpPassword: "",
      fromEmail: "",
      fromName: ""
    },
    systemSettings: {
      maintenanceMode: false,
      allowRegistration: true,
      maxLoginAttempts: 5,
      sessionTimeout: 30
    }
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === 'admin') {
      fetchSettings()
    }
  }, [authLoading, isAuthenticated, user])

  const fetchSettings = async () => {
    try {
      const response = await adminApi.getSettings()
      if (response.error) {
        toast.error('Failed to fetch settings: ' + response.error)
        return
      }
      if (response.data) {
        setSettings(response.data)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('An error occurred while fetching settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await adminApi.updateSettings(settings)
      if (response.error) {
        toast.error('Failed to update settings: ' + response.error)
        return
      }
      toast.success('Settings updated successfully')
    } catch (error) {
      console.error('Error updating settings:', error)
      toast.error('An error occurred while updating settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleNotificationChange = (key: keyof Settings['notificationSettings']) => {
    setSettings(prev => ({
      ...prev,
      notificationSettings: {
        ...prev.notificationSettings,
        [key]: !prev.notificationSettings[key]
      }
    }))
  }

  const handleEmailChange = (key: keyof Settings['emailSettings'], value: string) => {
    setSettings(prev => ({
      ...prev,
      emailSettings: {
        ...prev.emailSettings,
        [key]: value
      }
    }))
  }

  const handleSystemChange = (key: keyof Settings['systemSettings'], value: boolean | number) => {
    setSettings(prev => ({
      ...prev,
      systemSettings: {
        ...prev.systemSettings,
        [key]: value
      }
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-amber-800 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-amber-900">System Settings</h1>
        <p className="text-amber-800 mt-2">Configure system-wide settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Notification Settings */}
        <Card className="border-2 border-amber-800 bg-amber-100">
          <CardHeader>
            <CardTitle className="text-amber-900">Notification Settings</CardTitle>
            <CardDescription className="text-amber-800">
              Configure how and when notifications are sent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="emailNotifications" className="text-amber-900">
                Email Notifications
              </Label>
              <Switch
                id="emailNotifications"
                checked={settings.notificationSettings.emailNotifications}
                onCheckedChange={() => handleNotificationChange('emailNotifications')}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="pushNotifications" className="text-amber-900">
                Push Notifications
              </Label>
              <Switch
                id="pushNotifications"
                checked={settings.notificationSettings.pushNotifications}
                onCheckedChange={() => handleNotificationChange('pushNotifications')}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="warrantyExpiryAlerts" className="text-amber-900">
                Warranty Expiry Alerts
              </Label>
              <Switch
                id="warrantyExpiryAlerts"
                checked={settings.notificationSettings.warrantyExpiryAlerts}
                onCheckedChange={() => handleNotificationChange('warrantyExpiryAlerts')}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="systemAlerts" className="text-amber-900">
                System Alerts
              </Label>
              <Switch
                id="systemAlerts"
                checked={settings.notificationSettings.systemAlerts}
                onCheckedChange={() => handleNotificationChange('systemAlerts')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card className="border-2 border-amber-800 bg-amber-100">
          <CardHeader>
            <CardTitle className="text-amber-900">Email Settings</CardTitle>
            <CardDescription className="text-amber-800">
              Configure email server settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtpHost" className="text-amber-900">SMTP Host</Label>
                <Input
                  id="smtpHost"
                  value={settings.emailSettings.smtpHost}
                  onChange={(e) => handleEmailChange('smtpHost', e.target.value)}
                  className="border-2 border-amber-800 bg-amber-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPort" className="text-amber-900">SMTP Port</Label>
                <Input
                  id="smtpPort"
                  value={settings.emailSettings.smtpPort}
                  onChange={(e) => handleEmailChange('smtpPort', e.target.value)}
                  className="border-2 border-amber-800 bg-amber-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpUser" className="text-amber-900">SMTP Username</Label>
                <Input
                  id="smtpUser"
                  value={settings.emailSettings.smtpUser}
                  onChange={(e) => handleEmailChange('smtpUser', e.target.value)}
                  className="border-2 border-amber-800 bg-amber-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPassword" className="text-amber-900">SMTP Password</Label>
                <Input
                  id="smtpPassword"
                  type="password"
                  value={settings.emailSettings.smtpPassword}
                  onChange={(e) => handleEmailChange('smtpPassword', e.target.value)}
                  className="border-2 border-amber-800 bg-amber-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromEmail" className="text-amber-900">From Email</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  value={settings.emailSettings.fromEmail}
                  onChange={(e) => handleEmailChange('fromEmail', e.target.value)}
                  className="border-2 border-amber-800 bg-amber-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromName" className="text-amber-900">From Name</Label>
                <Input
                  id="fromName"
                  value={settings.emailSettings.fromName}
                  onChange={(e) => handleEmailChange('fromName', e.target.value)}
                  className="border-2 border-amber-800 bg-amber-50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card className="border-2 border-amber-800 bg-amber-100">
          <CardHeader>
            <CardTitle className="text-amber-900">System Settings</CardTitle>
            <CardDescription className="text-amber-800">
              Configure system-wide behavior and security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="maintenanceMode" className="text-amber-900">
                Maintenance Mode
              </Label>
              <Switch
                id="maintenanceMode"
                checked={settings.systemSettings.maintenanceMode}
                onCheckedChange={(checked) => handleSystemChange('maintenanceMode', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="allowRegistration" className="text-amber-900">
                Allow New Registrations
              </Label>
              <Switch
                id="allowRegistration"
                checked={settings.systemSettings.allowRegistration}
                onCheckedChange={(checked) => handleSystemChange('allowRegistration', checked)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxLoginAttempts" className="text-amber-900">
                Maximum Login Attempts
              </Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                min="1"
                max="10"
                value={settings.systemSettings.maxLoginAttempts}
                onChange={(e) => handleSystemChange('maxLoginAttempts', parseInt(e.target.value))}
                className="border-2 border-amber-800 bg-amber-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout" className="text-amber-900">
                Session Timeout (minutes)
              </Label>
              <Input
                id="sessionTimeout"
                type="number"
                min="5"
                max="120"
                value={settings.systemSettings.sessionTimeout}
                onChange={(e) => handleSystemChange('sessionTimeout', parseInt(e.target.value))}
                className="border-2 border-amber-800 bg-amber-50"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-amber-800 hover:bg-amber-900 text-amber-100 border-2 border-amber-900"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
"use client"

/** @jsxRuntime automatic */
/** @jsxImportSource react */
import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Bell, 
  Lock, 
  Save, 
  Mail, 
  Globe,
  Palette,
  AlertTriangle,
  AlertCircle
} from "lucide-react"
import WarrantySidebar from "../warranties/components/sidebar"
import { useAuth } from "@/lib/auth-context"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { authApi } from "@/lib/auth-api"
import { toast } from "sonner"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Form validation schemas
const passwordFormSchema = z.object({
  currentPassword: z.string()
    .min(8, "Current password must be at least 8 characters"),
  newPassword: z.string()
    .min(8, "New password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string()
    .min(8, "Confirm password must be at least 8 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

const preferencesFormSchema = z.object({
  emailNotifications: z.boolean().default(true),
  reminderDays: z.number()
    .min(1, "Reminder days must be at least 1")
    .max(365, "Reminder days must not exceed 365")
    .default(30),
  theme: z.enum(["light", "dark", "system"]).default("system"),
  language: z.enum(["en", "es", "fr", "de", "ja"]).default("en"),
  notifications: z.boolean().default(true),
})

// Add password strength indicator component
const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const getStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  }

  const strength = getStrength(password);
  const getColor = () => {
    switch (strength) {
      case 0:
      case 1:
        return "bg-red-500";
      case 2:
      case 3:
        return "bg-yellow-500";
      case 4:
      case 5:
        return "bg-green-500";
      default:
        return "bg-gray-200";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1 h-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`h-full w-full rounded-full ${i < strength ? getColor() : "bg-gray-200"}`}
          />
        ))}
      </div>
      <p className="text-sm text-amber-700">
        {strength === 0 && "Very weak"}
        {strength === 1 && "Weak"}
        {strength === 2 && "Fair"}
        {strength === 3 && "Good"}
        {strength === 4 && "Strong"}
        {strength === 5 && "Very strong"}
      </p>
    </div>
  );
};

export default function UserSettingsPage() {
  const router = useRouter()
  const { user: authUser, isAuthenticated, isLoading: authLoading, updateProfile } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isPasswordSaving, setIsPasswordSaving] = useState(false)
  const [isPreferencesSaving, setIsPreferencesSaving] = useState(false)

  // Initialize forms
  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  })

  const preferencesForm = useForm<z.infer<typeof preferencesFormSchema>>({
    resolver: zodResolver(preferencesFormSchema),
    defaultValues: {
      emailNotifications: true,
      reminderDays: 30,
      theme: "system",
      language: "en",
      notifications: true
    }
  })

  // Update form values when user data is loaded
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.replace('/login')
      } else if (authUser && authUser.role !== 'user') {
        router.replace(authUser.role === 'admin' ? '/admin' : '/login')
      } else if (authUser) {
        preferencesForm.reset({
          emailNotifications: authUser.preferences?.emailNotifications ?? true,
          reminderDays: authUser.preferences?.reminderDays ?? 30,
          theme: authUser.preferences?.theme ?? "system",
          language: authUser.preferences?.language ?? "en",
          notifications: authUser.preferences?.notifications ?? true
        })
      }
    }
  }, [router, authLoading, isAuthenticated, authUser, preferencesForm])

  // Form submission handlers
  const onPasswordSubmit = async (data: z.infer<typeof passwordFormSchema>) => {
    setIsPasswordSaving(true)
    setError(null)

    try {
      const response = await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      })

      if (response.error) {
        setError(response.error)
        return
      }

      toast.success("Password updated successfully")
      passwordForm.reset()
    } catch (err) {
      console.error("Password update error:", err)
      setError("An unexpected error occurred")
    } finally {
      setIsPasswordSaving(false)
    }
  }

  const onPreferencesSubmit = async (data: z.infer<typeof preferencesFormSchema>) => {
    setIsPreferencesSaving(true)
    setError(null)

    try {
      const success = await updateProfile({
        preferences: {
          emailNotifications: data.emailNotifications,
          reminderDays: data.reminderDays,
          theme: data.theme,
          language: data.language,
          notifications: data.notifications
        }
      })

      if (success) {
        toast.success("Preferences updated successfully!")
      } else {
        setError("Failed to update preferences. Please try again.")
      }
    } catch (err) {
      console.error("Preferences update error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsPreferencesSaving(false)
    }
  }

  if (!authUser) {
    return (
      <div className="flex min-h-screen bg-amber-50">
        <div className="flex-1 p-8">
          <div className="max-w-2xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-amber-50">
      <WarrantySidebar />
      <div className="flex-1 p-6 ml-64">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-amber-900 mb-6">Account Settings</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border-2 border-red-400 rounded-md flex items-center text-red-800">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <Tabs defaultValue="preferences" className="w-full">
            <TabsList className="grid grid-cols-2 mb-6 bg-amber-200 border-2 border-amber-800">
              <TabsTrigger 
                value="preferences" 
                className="data-[state=active]:bg-amber-800 data-[state=active]:text-amber-100"
              >
                <Globe className="mr-2 h-4 w-4" />
                Preferences
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="data-[state=active]:bg-amber-800 data-[state=active]:text-amber-100"
              >
                <Lock className="mr-2 h-4 w-4" />
                Security
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preferences">
              <Card className="border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100">
                <CardHeader className="border-b-4 border-amber-800 bg-amber-200 px-6 py-4">
                  <CardTitle className="text-2xl font-bold text-amber-900">
                    <Globe className="inline-block mr-2 h-6 w-6" />
                    Preferences
                  </CardTitle>
                  <CardDescription className="text-amber-800">
                    Customize your application experience
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="p-6">
                  <Form {...preferencesForm}>
                    <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)} className="space-y-6">
                      <div className="space-y-4">
                        <FormField
                          control={preferencesForm.control}
                          name="theme"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-amber-900">Theme</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="border-2 border-amber-800 bg-amber-50">
                                    <SelectValue placeholder="Select theme" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="light">Light</SelectItem>
                                  <SelectItem value="dark">Dark</SelectItem>
                                  <SelectItem value="system">System</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription className="text-amber-700">
                                Choose your preferred theme
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={preferencesForm.control}
                          name="language"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-amber-900">Language</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="border-2 border-amber-800 bg-amber-50">
                                    <SelectValue placeholder="Select language" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="en">English</SelectItem>
                                  <SelectItem value="es">Spanish</SelectItem>
                                  <SelectItem value="fr">French</SelectItem>
                                  <SelectItem value="de">German</SelectItem>
                                  <SelectItem value="ja">Japanese</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription className="text-amber-700">
                                Choose your preferred language
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={preferencesForm.control}
                          name="emailNotifications"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-4 border-2 border-amber-800 rounded-lg bg-amber-50">
                              <div>
                                <FormLabel className="text-lg font-semibold text-amber-900">Email Notifications</FormLabel>
                                <p className="text-sm text-amber-700">Receive email notifications about your warranties</p>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="data-[state=checked]:bg-amber-800"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={preferencesForm.control}
                          name="notifications"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-4 border-2 border-amber-800 rounded-lg bg-amber-50">
                              <div>
                                <FormLabel className="text-lg font-semibold text-amber-900">Push Notifications</FormLabel>
                                <p className="text-sm text-amber-700">Receive push notifications about your warranties</p>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="data-[state=checked]:bg-amber-800"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={preferencesForm.control}
                          name="reminderDays"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-amber-900">Reminder Days</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1}
                                  max={365}
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  className="border-2 border-amber-800 bg-amber-50"
                                />
                              </FormControl>
                              <FormDescription className="text-amber-700">
                                Number of days before warranty expiration to receive notifications
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button 
                        type="submit" 
                        disabled={isPreferencesSaving}
                        className="bg-amber-800 hover:bg-amber-900 text-amber-100 border-2 border-amber-900"
                      >
                        {isPreferencesSaving ? (
                          <div className="flex items-center">
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-amber-100 border-t-transparent rounded-full" />
                            Saving...
                          </div>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Preferences
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card className="border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100">
                <CardHeader className="border-b-4 border-amber-800 bg-amber-200 px-6 py-4">
                  <CardTitle className="text-2xl font-bold text-amber-900">
                    <Lock className="inline-block mr-2 h-6 w-6" />
                    Security
                  </CardTitle>
                  <CardDescription className="text-amber-800">
                    Manage your password and security settings
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="p-6">
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-amber-900">Change Password</h3>
                        
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-amber-900">Current Password</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="password"
                                  className="border-2 border-amber-800 bg-amber-50"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-amber-900">New Password</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="password"
                                  className="border-2 border-amber-800 bg-amber-50"
                                />
                              </FormControl>
                              <PasswordStrengthIndicator password={field.value} />
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-amber-900">Confirm New Password</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="password"
                                  className="border-2 border-amber-800 bg-amber-50"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button 
                        type="submit" 
                        disabled={isPasswordSaving}
                        className="bg-amber-800 hover:bg-amber-900 text-amber-100 border-2 border-amber-900"
                      >
                        {isPasswordSaving ? (
                          <div className="flex items-center">
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-amber-100 border-t-transparent rounded-full" />
                            Updating...
                          </div>
                        ) : (
                          <>
                            <Lock className="mr-2 h-4 w-4" />
                            Update Password
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
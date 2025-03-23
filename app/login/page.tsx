"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LogIn, User, Lock, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, user, isLoading: authLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  // Check if user is already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      // Get the return URL from the query parameters
      const params = new URLSearchParams(window.location.search);
      const returnUrl = params.get('returnUrl');
      
      if (returnUrl) {
        // Validate the return URL to ensure it's a relative path
        if (returnUrl.startsWith('/')) {
          router.replace(returnUrl);
        } else {
          console.error('Invalid return URL:', returnUrl);
          router.replace(user.role === 'admin' ? '/admin' : '/user');
        }
      } else {
        router.replace(user.role === 'admin' ? '/admin' : '/user');
      }
    }
  }, [isAuthenticated, user, router]);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    
    // Validate form
    if (!email || !password) {
      setError("Please enter both email and password")
      return
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address")
      return
    }
    
    // Basic password validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }
    
    setIsLoading(true)
    
    try {
      console.log("Attempting login with:", { email }) // Don't log password
      
      // Get the return URL from the query parameters
      const params = new URLSearchParams(window.location.search);
      const returnUrl = params.get('returnUrl');
      
      // Validate returnUrl to prevent open redirect vulnerabilities
      const isValidReturnUrl = returnUrl && (
        returnUrl.startsWith('/') && 
        !returnUrl.startsWith('//') && 
        !returnUrl.includes('http') &&
        !returnUrl.includes('javascript:')
      );
      
      // Only redirect to dashboard if there's no return URL
      const success = await login(email, password, !returnUrl)
      
      if (success) {
        console.log("Login successful")
        if (isValidReturnUrl) {
          router.replace(returnUrl)
        }
        // If no returnUrl or invalid returnUrl, the auth context will handle redirection
      } else {
        console.log("Login failed")
        setError("Invalid email or password. Please try again.")
      }
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err?.message || "An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }
  
  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-6">
        <div className="text-amber-800 text-xl flex items-center">
          <div className="animate-spin mr-3 h-5 w-5 border-2 border-amber-800 border-t-transparent rounded-full" />
          Loading...
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100">
        <CardHeader className="border-b-4 border-amber-800 bg-amber-200 px-6 py-4">
          <CardTitle className="text-3xl font-bold text-amber-900 font-mono tracking-tight text-center">
            Warrity
          </CardTitle>
          <CardDescription className="text-amber-800 font-medium text-center">
            Login to your account
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border-2 border-red-400 rounded-md flex items-center text-red-800">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-amber-900">
                  Email
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-amber-800" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 border-2 border-amber-800 bg-amber-50"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-amber-900">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-amber-800" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 border-2 border-amber-800 bg-amber-50"
                  />
                </div>
              </div>
              
              <div>
                <Button 
                  variant="link" 
                  className="px-0 text-amber-800 hover:text-amber-900"
                  asChild
                >
                  <Link href="/forgot-password">Forgot your password?</Link>
                </Button>
              </div>

              <div>
                <Button 
                  variant="link" 
                  className="px-0 text-amber-800 hover:text-amber-900"
                  asChild
                >
                  <Link href="/auth/verify">Verify Email / Resend Verification</Link>
                </Button>
              </div>

              <Button 
                type="submit"
                className="w-full bg-amber-800 hover:bg-amber-900 text-amber-100 border-2 border-amber-900"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-amber-100 border-t-transparent rounded-full" />
                    Logging in...
                  </div>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
        
        <CardFooter className="border-t-2 border-amber-300 p-6 flex flex-col space-y-4">
          <div className="text-center text-amber-800">
            <p className="text-sm">
              Demo Credentials:
            </p>
            <p className="text-xs mt-1">
              Admin: admin@example.com / admin123
            </p>
            <p className="text-xs">
              User: user@example.com / user123
            </p>
          </div>
          
          <div className="text-center text-sm text-amber-800">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-amber-900 font-medium hover:underline">
              Register
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}


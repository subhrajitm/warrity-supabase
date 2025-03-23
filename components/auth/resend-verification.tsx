"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { sendVerificationEmail } from '@/lib/supabase-auth'
import { Mail, AlertCircle, CheckCircle } from 'lucide-react'

export default function ResendVerification() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !email.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' })
      return
    }
    
    setIsLoading(true)
    setMessage(null)
    
    try {
      const result = await sendVerificationEmail(email)
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Verification email sent! Please check your inbox.' })
        setEmail('')
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to send verification email. Please try again.' })
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.' 
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Card className="w-full max-w-md border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100">
      <CardHeader className="border-b-4 border-amber-800 bg-amber-200 px-6 py-4">
        <CardTitle className="text-2xl font-bold text-amber-900">Resend Verification Email</CardTitle>
        <CardDescription className="text-amber-700">
          Enter your email address to receive a new verification link.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {message && (
              <Alert className={
                message.type === 'success' 
                  ? "bg-green-100 border-green-500 text-green-800" 
                  : "bg-red-100 border-red-500 text-red-800"
              }>
                {message.type === 'success' ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : (
                  <AlertCircle className="h-4 w-4 mr-2" />
                )}
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-amber-800">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="border-2 border-amber-800 bg-amber-50"
              />
            </div>
          </div>
          
          <Button
            type="submit"
            className="mt-6 w-full bg-amber-800 hover:bg-amber-900 text-amber-100 border-2 border-amber-900"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-amber-100 border-t-transparent rounded-full"></div>
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send Verification Email
              </>
            )}
          </Button>
        </form>
      </CardContent>
      
      <CardFooter className="border-t-4 border-amber-800 p-6 bg-amber-200 flex flex-col items-center">
        <p className="text-sm text-amber-700 text-center">
          Already verified your email? <a href="/login" className="text-amber-900 font-bold hover:underline">Log in</a>
        </p>
      </CardFooter>
    </Card>
  )
} 
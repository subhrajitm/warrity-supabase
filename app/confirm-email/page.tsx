"use client"

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, ArrowRight } from 'lucide-react'

export default function ConfirmEmailPage() {
  const router = useRouter()
  
  // Redirect to the verification page after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/auth/verify')
    }, 3000)
    
    return () => clearTimeout(timer)
  }, [router])
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-amber-50 p-4">
      <Card className="w-full max-w-md border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100">
        <CardHeader className="border-b-4 border-amber-800 bg-amber-200 px-6 py-4">
          <CardTitle className="text-2xl font-bold text-amber-900">
            Check Your Email
          </CardTitle>
          <CardDescription className="text-amber-700">
            Please verify your account to continue
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-amber-200 p-4 mb-6">
              <Mail className="h-16 w-16 text-amber-800" />
            </div>
            
            <p className="text-lg font-medium text-amber-900 mb-2">
              Verification Email Sent
            </p>
            
            <p className="text-amber-700 mb-6">
              We've sent a verification link to your email address. 
              Please check your inbox and click the link to complete your registration.
            </p>
            
            <div className="flex items-center justify-center text-amber-700 text-sm animate-pulse mt-4">
              <p>Redirecting to verification page</p>
              <ArrowRight className="ml-2 h-4 w-4" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
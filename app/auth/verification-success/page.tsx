"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle } from 'lucide-react'
import { isEmailVerified } from '@/lib/supabase-auth'

export default function VerificationSuccessPage() {
  const router = useRouter()
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'verified' | 'not-verified'>('loading')
  
  useEffect(() => {
    async function checkVerification() {
      const verified = await isEmailVerified()
      setVerificationStatus(verified ? 'verified' : 'not-verified')
    }
    
    checkVerification()
  }, [])
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-amber-50 p-4">
      <Card className="w-full max-w-md border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100">
        <CardHeader className="border-b-4 border-amber-800 bg-amber-200 px-6 py-4">
          <CardTitle className="text-2xl font-bold text-amber-900">
            {verificationStatus === 'loading' && 'Checking verification status...'}
            {verificationStatus === 'verified' && 'Email Verified Successfully!'}
            {verificationStatus === 'not-verified' && 'Verification Pending'}
          </CardTitle>
          <CardDescription className="text-amber-700">
            {verificationStatus === 'loading' && 'Please wait while we check your verification status.'}
            {verificationStatus === 'verified' && 'Your email has been verified. You can now use all features of your account.'}
            {verificationStatus === 'not-verified' && 'We\'re still waiting for your email verification to complete.'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          {verificationStatus === 'loading' && (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-12 w-12 border-4 border-amber-800 border-t-transparent rounded-full"></div>
            </div>
          )}
          
          {verificationStatus === 'verified' && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-green-100 p-3 mb-4">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
              <p className="text-lg text-amber-900 mb-2">
                Thank you for verifying your email address.
              </p>
              <p className="text-amber-700">
                Your account is now fully activated and you can access all features.
              </p>
            </div>
          )}
          
          {verificationStatus === 'not-verified' && (
            <div className="py-8 text-center">
              <p className="text-lg text-amber-900 mb-2">
                Please check your email inbox and click on the verification link.
              </p>
              <p className="text-amber-700 mb-4">
                If you don't see the email, check your spam folder or request a new verification email.
              </p>
              <Button 
                className="bg-amber-800 hover:bg-amber-900 text-amber-100 border-2 border-amber-900"
                onClick={() => window.location.reload()}
              >
                Check Again
              </Button>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="border-t-4 border-amber-800 p-6 bg-amber-200 flex justify-center">
          <Button
            className="bg-amber-800 hover:bg-amber-900 text-amber-100 border-2 border-amber-900"
            onClick={() => router.push('/login')}
          >
            Go to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 
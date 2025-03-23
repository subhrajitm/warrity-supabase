"use client"

import React from 'react'
import ResendVerification from '@/components/auth/resend-verification'

export default function VerifyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-amber-50 p-4">
      <ResendVerification />
    </div>
  )
} 
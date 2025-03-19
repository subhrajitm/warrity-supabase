"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { warrantyApi } from "@/lib/api"
import type { WarrantyInput } from '@/types/warranty'

// Using shared types

export default function AddWarrantyPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [error, setError] = useState("")
  const [formData, setFormData] = useState<Omit<WarrantyInput, 'documents'>>({    
    product: "",
    purchaseDate: "",
    expirationDate: "",
    warrantyProvider: "",
    warrantyNumber: "",
    coverageDetails: "",
    notes: "",
    status: "active"
  })

  // Handle authentication
  useEffect(() => {
    if (authLoading) return
    
    if (!isAuthenticated) {
      router.replace('/login')
      return
    }
    if (user?.role !== 'admin') {
      router.replace(user?.role === 'user' ? '/user' : '/login')
      return
    }
  }, [isAuthenticated, user?.role, router, authLoading])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    try {
      const response = await warrantyApi.createWarranty({
        ...formData,
        documents: []
      })
      if (response.error) {
        setError(response.error)
        toast.error('Failed to create warranty: ' + response.error)
        return
      }
      
      toast.success('Warranty created successfully!')
      // Use replace instead of push to prevent back navigation
      router.replace('/admin/warranties')
    } catch (error) {
      console.error('Error creating warranty:', error)
      toast.error('An error occurred while creating the warranty')
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-amber-800 text-xl">Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-amber-900 mb-6">Add New Warranty</h1>
      
      <Card className="border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100">
        <CardHeader className="border-b-4 border-amber-800 bg-amber-200">
          <CardTitle className="text-xl font-bold text-amber-900">Warranty Details</CardTitle>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="product" className="text-amber-900">Product ID</Label>
              <Input
                id="product"
                name="product"
                value={formData.product}
                onChange={handleInputChange}
                className="border-2 border-amber-800 bg-amber-50"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="warrantyProvider" className="text-amber-900">Warranty Provider</Label>
              <Input
                id="warrantyProvider"
                name="warrantyProvider"
                value={formData.warrantyProvider}
                onChange={handleInputChange}
                className="border-2 border-amber-800 bg-amber-50"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="warrantyNumber" className="text-amber-900">Warranty Number</Label>
              <Input
                id="warrantyNumber"
                name="warrantyNumber"
                value={formData.warrantyNumber}
                onChange={handleInputChange}
                className="border-2 border-amber-800 bg-amber-50"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="purchaseDate" className="text-amber-900">Purchase Date</Label>
              <Input
                type="date"
                id="purchaseDate"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleInputChange}
                className="border-2 border-amber-800 bg-amber-50"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="expirationDate" className="text-amber-900">Expiration Date</Label>
              <Input
                type="date"
                id="expirationDate"
                name="expirationDate"
                value={formData.expirationDate}
                onChange={handleInputChange}
                className="border-2 border-amber-800 bg-amber-50"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="coverageDetails" className="text-amber-900">Coverage Details</Label>
              <Textarea
                id="coverageDetails"
                name="coverageDetails"
                value={formData.coverageDetails}
                onChange={handleInputChange}
                className="border-2 border-amber-800 bg-amber-50 min-h-[100px]"
                placeholder="Enter warranty coverage details..."
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-amber-900">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="border-2 border-amber-800 bg-amber-50 min-h-[100px]"
                placeholder="Add any additional notes about this warranty..."
              />
            </div>
            
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="border-2 border-amber-800 text-amber-800 hover:bg-amber-100"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-amber-800 hover:bg-amber-900 text-amber-100 border-2 border-amber-900"
              >
                Create Warranty
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

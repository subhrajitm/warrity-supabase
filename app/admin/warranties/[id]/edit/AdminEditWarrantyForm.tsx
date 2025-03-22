"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Shield } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { warrantyApi } from "@/lib/api"
import type { Warranty, WarrantyInput } from "@/types/warranty"

// Mock data for demonstration
const mockWarranty = {
  id: 3,
  product: "MacBook Pro",
  category: "Electronics",
  purchaseDate: "2022-05-20",
  startDate: "2022-05-20",
  endDate: "2023-08-25",
  price: "1999",
  status: "expiring",
  provider: "Apple Inc.",
  type: "limited",
  terms: "1 year limited warranty with option to extend",
  extendable: "yes",
  claimProcess: "Contact Apple Support or visit an Apple Store with proof of purchase.",
  coverageDetails: "Covers manufacturing defects, battery service, and up to two incidents of accidental damage protection every 12 months.",
  userId: 5
}

// Mock users for dropdown
const mockUsers = [
  { id: "1", name: "John Smith", email: "john@example.com" },
  { id: "2", name: "Sarah Johnson", email: "sarah@example.com" },
  { id: "3", name: "Michael Brown", email: "michael@example.com" },
  { id: "4", name: "Robert Davis", email: "robert@example.com" },
  { id: "5", name: "Emily Johnson", email: "emily@example.com" }
]

interface FormData {
  product: string;
  category: string;
  purchaseDate: string;
  startDate: string;
  endDate: string;
  price: string;
  status: string;
  provider: string;
  type: string;
  terms: string;
  extendable: string;
  claimProcess: string;
  coverageDetails: string;
  userId: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Props {
  warrantyId: string;
}

export default function AdminEditWarrantyForm({ warrantyId }: Props) {
  const router = useRouter()
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth()
  const [formData, setFormData] = useState<Partial<Warranty>>({
    product: { _id: "", name: "", manufacturer: "" },
    purchaseDate: "",
    expirationDate: "",
    warrantyProvider: "",
    warrantyNumber: "",
    coverageDetails: "",
    notes: "",
    status: "active",
    documents: []
  })
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Check if admin is logged in and fetch warranty data
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.replace('/login')
        return
      }

      fetchWarrantyData()
    }
  }, [router, warrantyId, authLoading, isAuthenticated])

  const fetchWarrantyData = async () => {
    try {
      const response = await warrantyApi.getWarrantyById(warrantyId)
      if (response.error) {
        toast.error('Failed to fetch warranty: ' + response.error)
        router.push('/admin/warranties')
        return
      }
      if (response.data) {
        setFormData(response.data)
      }
    } catch (error) {
      console.error('Error fetching warranty:', error)
      toast.error('An error occurred while fetching the warranty')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    try {
      const response = await warrantyApi.updateWarranty(warrantyId, formData)
      if (response.error) {
        toast.error('Failed to update warranty: ' + response.error)
        return
      }
      
      toast.success('Warranty updated successfully')
      router.refresh() // Refresh router cache
      router.push(`/admin/warranties/${warrantyId}`)
    } catch (error) {
      console.error('Error updating warranty:', error)
      toast.error('An error occurred while updating the warranty')
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-amber-800 text-xl">Loading warranty data...</p>
      </div>
    )
  }
  
  return (
    <div>
      <div className="mb-6">
        <Link href={`/admin/warranties/${warrantyId}`} className="flex items-center text-amber-800 hover:text-amber-600 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Warranty Details
        </Link>
      </div>
      
      <Card className="max-w-4xl mx-auto border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100">
        <CardHeader className="border-b-4 border-amber-800 bg-amber-200 px-6 py-4">
          <CardTitle className="text-2xl font-bold text-amber-900">
            Edit Warranty
          </CardTitle>
          <CardDescription className="text-amber-800">
            Update the warranty information
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="warrantyProvider" className="text-amber-900">Warranty Provider</Label>
                  <Input
                    id="warrantyProvider"
                    name="warrantyProvider"
                    value={formData.warrantyProvider || ""}
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
                    value={formData.warrantyNumber || ""}
                    onChange={handleInputChange}
                    className="border-2 border-amber-800 bg-amber-50"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate" className="text-amber-900">Purchase Date</Label>
                  <Input
                    id="purchaseDate"
                    name="purchaseDate"
                    type="date"
                    value={formData.purchaseDate ? formData.purchaseDate.split('T')[0] : ""}
                    onChange={handleInputChange}
                    className="border-2 border-amber-800 bg-amber-50"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expirationDate" className="text-amber-900">Expiration Date</Label>
                  <Input
                    id="expirationDate"
                    name="expirationDate"
                    type="date"
                    value={formData.expirationDate ? formData.expirationDate.split('T')[0] : ""}
                    onChange={handleInputChange}
                    className="border-2 border-amber-800 bg-amber-50"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-amber-900">Status</Label>
                  <Select 
                    value={formData.status || "active"} 
                    onValueChange={(value) => handleSelectChange("status", value)}
                  >
                    <SelectTrigger className="border-2 border-amber-800 bg-amber-50">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expiring">Expiring Soon</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="coverageDetails" className="text-amber-900">Coverage Details</Label>
                  <Textarea
                    id="coverageDetails"
                    name="coverageDetails"
                    value={formData.coverageDetails || ""}
                    onChange={handleInputChange}
                    className="border-2 border-amber-800 bg-amber-50 min-h-[100px]"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-amber-900">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes || ""}
                    onChange={handleInputChange}
                    className="border-2 border-amber-800 bg-amber-50 min-h-[100px]"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-4">
              <Link href={`/admin/warranties/${warrantyId}`}>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="border-2 border-amber-800 text-amber-800"
                >
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                className="bg-amber-800 hover:bg-amber-900 text-amber-100 border-2 border-amber-900"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 
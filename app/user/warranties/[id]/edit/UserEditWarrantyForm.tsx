"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from 'next/dynamic'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, AlertTriangle } from "lucide-react"
import { Warranty, WarrantyApiResponse, ValidationError } from "@/types/warranty"
import { warrantyApi } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

// Dynamically import the sidebar to reduce initial bundle size
const WarrantySidebar = dynamic(() => import("../../components/sidebar"), {
  loading: () => <div className="w-64 bg-amber-100 border-r-4 border-amber-800" />
})

// Default empty warranty data for initialization
const emptyWarranty = {
  id: "",
  _id: "",
  product: { 
    name: "", 
    manufacturer: "",
    _id: "" 
  },
  purchaseDate: "",
  expirationDate: "",
  warrantyProvider: "",
  warrantyNumber: "",
  coverageDetails: "",
  documents: [],
  status: "active" as const,
  notes: "",
  user: "",
  createdAt: "",
  updatedAt: ""
}

// Utility function to format ISO date strings to yyyy-MM-dd format for date inputs
const formatDateForInput = (isoDateString: string | undefined): string => {
  if (!isoDateString) return '';
  const date = new Date(isoDateString);
  return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
}

// Utility function to safely get nested property values
const safelyGetNestedValue = (obj: any, path: string, defaultValue: string = ''): string => {
  if (!obj) return defaultValue;
  
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current === undefined || current === null) return defaultValue;
    current = current[key];
  }
  
  return current !== undefined && current !== null ? String(current) : defaultValue;
}

interface ApiError {
  message: string;
  errors?: string[];
}

interface Props {
  warrantyId: string;
}

export default function UserEditWarrantyForm({ warrantyId }: Props) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [formData, setFormData] = useState<Partial<Warranty>>(emptyWarranty)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Fetch warranty details when component mounts
  useEffect(() => {
    const fetchWarrantyDetails = async () => {
      if (!warrantyId) {
        setError("No warranty ID provided")
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        
        // Use the warrantyApi utility which handles authentication automatically
        const response = await warrantyApi.getWarrantyById(warrantyId)
        
        if (response.error) {
          console.error('Error fetching warranty details:', response.error)
          setError(response.error)
          setIsLoading(false)
          return
        }
        
        // The response data might be the warranty object directly or nested in a property
        const warrantyData = response.data
        console.log('Fetched warranty data:', warrantyData)
        
        if (!warrantyData) {
          setError("No warranty data found")
          setIsLoading(false)
          return
        }
        
        setFormData(warrantyData)
        setIsLoading(false)
      } catch (err) {
        console.error('Error in fetchWarrantyDetails:', err)
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
        setIsLoading(false)
      }
    }

    if (!authLoading && isAuthenticated) {
      fetchWarrantyDetails()
    } else if (!authLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [warrantyId, authLoading, isAuthenticated, router])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    // Special handling for date inputs
    if (e.target.type === 'date') {
      // Convert YYYY-MM-DD to ISO format for storage
      const isoDate = value ? new Date(value).toISOString() : '';
      setFormData(prev => ({
        ...prev,
        [name]: isoDate
      }))
    } else if (name.includes('.')) {
      // Handle nested properties like product.name
      const [parent, child] = name.split('.')
      
      if (parent === 'product') {
        setFormData(prev => {
          // Ensure prev.product exists and has the required properties
          const currentProduct = prev.product || { _id: "", name: "", manufacturer: "" };
          
          return {
            ...prev,
            product: {
              ...currentProduct,
              [child]: value
            }
          };
        });
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null) // Clear any previous errors
    
    try {
      // Format the data according to the API requirements
      const updateData: Record<string, any> = {
        product: formData.product?._id, // Send only the product ID
        purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate).toISOString().split('T')[0] : undefined,
        expirationDate: formData.expirationDate ? new Date(formData.expirationDate).toISOString().split('T')[0] : undefined,
        warrantyProvider: formData.warrantyProvider || undefined,
        warrantyNumber: formData.warrantyNumber || undefined,
        coverageDetails: formData.coverageDetails || undefined,
        notes: formData.notes || undefined
      }
      
      // Remove undefined values
      Object.keys(updateData).forEach(key => 
        updateData[key] === undefined && delete updateData[key]
      )
      
      // Ensure required fields are present
      if (!updateData.product) {
        setError('Product is required')
        setIsSubmitting(false)
        return
      }
      
      if (!updateData.purchaseDate) {
        setError('Purchase date is required')
        setIsSubmitting(false)
        return
      }
      
      if (!updateData.expirationDate) {
        setError('Expiration date is required')
        setIsSubmitting(false)
        return
      }
      
      if (!updateData.warrantyProvider) {
        setError('Warranty provider is required')
        setIsSubmitting(false)
        return
      }
      
      if (!updateData.warrantyNumber) {
        setError('Warranty number is required')
        setIsSubmitting(false)
        return
      }
      
      if (!updateData.coverageDetails) {
        setError('Coverage details are required')
        setIsSubmitting(false)
        return
      }
      
      console.log('Sending update data:', updateData) // Debug log
      
      const response = await warrantyApi.updateWarranty(warrantyId, updateData)
      
      if (response.error) {
        // Handle validation errors
        const error = typeof response.error === 'string' 
          ? { message: response.error }
          : response.error as ApiError

        if (error.message === 'Validation error' && 'errors' in error && error.errors) {
          const errorMessages = Array.isArray(error.errors) 
            ? error.errors.join(', ')
            : 'Please check all required fields'
          setError(errorMessages)
        } else {
          setError(error.message || 'Failed to update warranty')
        }
        setIsSubmitting(false)
        return
      }
      
      // Navigate to the details page using replace to prevent back navigation to the form
      router.replace(`/user/warranties/${warrantyId}`)
    } catch (error) {
      console.error('Error updating warranty:', error)
      setError(error instanceof Error ? error.message : 'Failed to update warranty. Please try again.')
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="flex min-h-screen bg-amber-50">
      <WarrantySidebar />
      
      <div className="flex-1 p-6 ml-64">
        <div className="mb-6">
          <Link href={`/user/warranties/${warrantyId}`} className="flex items-center text-amber-800 hover:text-amber-600 transition-colors">
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
              Update the details of your warranty
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="product" className="text-amber-900">Product Name</Label>
                    <Input
                      id="product"
                      name="product.name"
                      value={safelyGetNestedValue(formData, 'product.name')}
                      onChange={handleInputChange}
                      className="border-2 border-amber-800 bg-amber-50"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="manufacturer" className="text-amber-900">Manufacturer</Label>
                    <Input
                      id="manufacturer"
                      name="product.manufacturer"
                      value={safelyGetNestedValue(formData, 'product.manufacturer')}
                      onChange={handleInputChange}
                      className="border-2 border-amber-800 bg-amber-50"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="warrantyProvider" className="text-amber-900">Warranty Provider</Label>
                    <Input
                      id="warrantyProvider"
                      name="warrantyProvider"
                      value={safelyGetNestedValue(formData, 'warrantyProvider')}
                      onChange={handleInputChange}
                      className="border-2 border-amber-800 bg-amber-50"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="warrantyNumber" className="text-amber-900">Warranty Number</Label>
                    <Input
                      id="warrantyNumber"
                      name="warrantyNumber"
                      value={safelyGetNestedValue(formData, 'warrantyNumber')}
                      onChange={handleInputChange}
                      className="border-2 border-amber-800 bg-amber-50"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-amber-900">Status</Label>
                    <Select
                      value={safelyGetNestedValue(formData, 'status')}
                      onValueChange={(value) => handleSelectChange('status', value)}
                      disabled={isSubmitting}
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
                    <Label htmlFor="purchaseDate" className="text-amber-900">Purchase Date</Label>
                    <Input
                      id="purchaseDate"
                      name="purchaseDate"
                      type="date"
                      value={formatDateForInput(formData.purchaseDate)}
                      onChange={handleInputChange}
                      className="border-2 border-amber-800 bg-amber-50"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="expirationDate" className="text-amber-900">Expiration Date</Label>
                    <Input
                      id="expirationDate"
                      name="expirationDate"
                      type="date"
                      value={formatDateForInput(formData.expirationDate)}
                      onChange={handleInputChange}
                      className="border-2 border-amber-800 bg-amber-50"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="coverageDetails" className="text-amber-900">Coverage Details</Label>
                    <Textarea
                      id="coverageDetails"
                      name="coverageDetails"
                      value={safelyGetNestedValue(formData, 'coverageDetails')}
                      onChange={handleInputChange}
                      className="border-2 border-amber-800 bg-amber-50 min-h-[100px]"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-amber-900">Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={safelyGetNestedValue(formData, 'notes')}
                      onChange={handleInputChange}
                      className="border-2 border-amber-800 bg-amber-50 min-h-[100px]"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="mt-4 p-4 bg-red-50 border-2 border-red-800 rounded-lg flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-800 mr-2" />
                  <p className="text-red-800">{error}</p>
                </div>
              )}
              
              <CardFooter className="px-0 pt-6">
                <Button
                  type="submit"
                  className="w-full bg-amber-800 hover:bg-amber-900 text-amber-100 border-2 border-amber-900"
                  disabled={isSubmitting}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

// Import API and types
import { productApi } from '@/lib/api'

interface Product {
  id: string
  name: string
  category: string
  manufacturer?: string
  model?: string
  serialNumber: string
  purchaseDate?: string
  price?: string
  purchaseLocation?: string
  receiptNumber?: string
  description?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

// Product categories
const categories = [
  "Electronics",
  "Appliances",
  "Furniture",
  "Automotive",
  "Tools",
  "Clothing",
  "Sports & Outdoors",
  "Toys & Games",
  "Health & Beauty",
  "Other"
];

interface FormData {
  name: string;
  category: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  price: string;
  purchaseLocation: string;
  receiptNumber: string;
  description: string;
  notes: string;
}

interface Props {
  productId: string;
}

export default function AdminEditProductForm({ productId }: Props) {
  const router = useRouter()
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth()
  
  const handleCancel = () => {
    router.back()
  }
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    category: "",
    manufacturer: "",
    model: "",
    serialNumber: "",
    purchaseDate: "",
    price: "",
    purchaseLocation: "",
    receiptNumber: "",
    description: "",
    notes: ""
  })

  // Validate product ID
  useEffect(() => {
    if (!productId) {
      toast.error('Invalid product ID')
      router.replace('/admin/products')
    }
  }, [productId, router])
  
  // Check if admin is logged in and fetch product data
  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated || authUser?.role !== 'admin') {
      router.replace('/login')
      return
    }

    if (!productId) {
      router.replace('/admin/products')
      return
    }

    // Fetch the product data
    const fetchProduct = async () => {
      try {
        const response = await productApi.getProductById(productId)
        if (response.error) {
          toast.error('Failed to fetch product: ' + response.error)
          router.replace('/admin/products')
          return
        }
        if (response.data?.product) {
          const product = response.data.product as Product
          setProduct(product)
          setFormData({
            name: product.name,
            category: product.category,
            manufacturer: product.manufacturer || "",
            model: product.model || "",
            serialNumber: product.serialNumber,
            purchaseDate: product.purchaseDate || "",
            price: product.price || "",
            purchaseLocation: product.purchaseLocation || "",
            receiptNumber: product.receiptNumber || "",
            description: product.description || "",
            notes: product.notes || ""
          })
        } else {
          toast.error('Product not found')
          router.replace('/admin/products')
          return
        }
      } catch (error) {
        console.error('Error fetching product:', error)
        toast.error('Failed to fetch product details')
        router.replace('/admin/products')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProduct()
  }, [router, productId, authLoading, isAuthenticated, authUser])
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  // Handle category selection
  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }))
  }
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      // Send the updated data to the backend
      const response = await productApi.updateProduct(productId, formData)
      if (response.error) {
        throw new Error(response.error)
      }
      
      toast.success("Product updated successfully!")
      
      // Navigate to details page
      router.push(`/admin/products/${productId}`)
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error("Failed to update product. Please try again.")
      setIsSaving(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-amber-800 text-xl">Loading product data...</p>
      </div>
    )
  }
  
  return (
    <div>
      <div className="mb-6">
        <Link href={`/admin/products/${productId}`} className="flex items-center text-amber-800 hover:text-amber-600 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Product Details
        </Link>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <Card className="border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100">
          <CardHeader className="border-b-4 border-amber-800 bg-amber-200 px-6 py-4">
            <CardTitle className="text-2xl font-bold text-amber-900">Edit Product</CardTitle>
            <CardDescription className="text-amber-700">
              Update the product information
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-amber-900">
                      Product Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="border-2 border-amber-800 bg-amber-50"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-amber-900">
                      Category <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      name="category" 
                      value={formData.category}
                      onValueChange={handleCategoryChange}
                      required
                    >
                      <SelectTrigger className="border-2 border-amber-800 bg-amber-50">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="manufacturer" className="text-amber-900">Manufacturer</Label>
                    <Input
                      id="manufacturer"
                      name="manufacturer"
                      value={formData.manufacturer}
                      onChange={handleChange}
                      className="border-2 border-amber-800 bg-amber-50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="model" className="text-amber-900">Model</Label>
                    <Input
                      id="model"
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      className="border-2 border-amber-800 bg-amber-50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="serialNumber" className="text-amber-900">Serial Number</Label>
                    <Input
                      id="serialNumber"
                      name="serialNumber"
                      value={formData.serialNumber}
                      onChange={handleChange}
                      className="border-2 border-amber-800 bg-amber-50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="purchaseDate" className="text-amber-900">Purchase Date</Label>
                    <Input
                      id="purchaseDate"
                      name="purchaseDate"
                      type="date"
                      value={formData.purchaseDate}
                      onChange={handleChange}
                      className="border-2 border-amber-800 bg-amber-50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-amber-900">Price</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={handleChange}
                      className="border-2 border-amber-800 bg-amber-50"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-amber-900">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className="min-h-[100px] border-2 border-amber-800 bg-amber-50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-amber-900">Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      className="min-h-[100px] border-2 border-amber-800 bg-amber-50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="purchaseLocation" className="text-amber-900">Purchase Location</Label>
                    <Input
                      id="purchaseLocation"
                      name="purchaseLocation"
                      value={formData.purchaseLocation}
                      onChange={handleChange}
                      className="border-2 border-amber-800 bg-amber-50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="receiptNumber" className="text-amber-900">Receipt Number</Label>
                    <Input
                      id="receiptNumber"
                      name="receiptNumber"
                      value={formData.receiptNumber}
                      onChange={handleChange}
                      className="border-2 border-amber-800 bg-amber-50"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="bg-amber-200 border-t-4 border-amber-800 px-6 py-4 flex justify-between">
              <Button 
                type="button"
                variant="outline" 
                className="border-2 border-amber-800 text-amber-800"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              
              <Button 
                type="submit"
                className="bg-amber-800 hover:bg-amber-900 text-amber-100"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
} 
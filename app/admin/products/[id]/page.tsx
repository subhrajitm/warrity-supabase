"use client"

import { Suspense, use } from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminProductDetails from "./AdminProductDetails"
import { productApi } from "@/lib/api"
import { toast } from "sonner"
import { Product } from "@/types/product"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Package } from "lucide-react"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default function AdminProductPage({ params }: PageProps) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { id } = use(params)

  // Handle authentication first
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login')
      return
    }
    if (user?.role !== 'admin') {
      router.replace(user?.role === 'user' ? '/user' : '/login')
      return
    }
  }, [isAuthenticated, user?.role, router])

  const fetchProduct = async () => {
    if (!isAuthenticated || user?.role !== 'admin') return
    
    try {
      // Force a fresh fetch by adding a timestamp
      const timestamp = new Date().getTime()
      const response = await productApi.getProduct(id)
      
      if (response.error) {
        toast.error('Failed to fetch product: ' + response.error)
        return
      }
      if (response.data) {
        // Map MongoDB _id to frontend id and add timestamp
        const productData = {
          ...response.data,
          id: response.data._id,
          _timestamp: timestamp // Add timestamp to force re-render
        } as Product
        setProduct(productData)
      }
    } catch (error) {
      toast.error('An error occurred while fetching the product')
      console.error('Error fetching product:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch on mount and when id changes
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      router.refresh() // Refresh router cache
      fetchProduct()
    }
  }, [isAuthenticated, user?.role, id])

  // Add effect to refresh data when page becomes visible
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated && user?.role === 'admin') {
        router.refresh() // Refresh router cache
        fetchProduct()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [isAuthenticated, user?.role])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-amber-800 text-xl">Loading product details...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-amber-800 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-amber-900 mb-2">Product not found</h3>
            <p className="text-amber-800">The requested product could not be found.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return <AdminProductDetails product={product} />
}
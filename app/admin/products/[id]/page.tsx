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

  useEffect(() => {
    const fetchProduct = async () => {
      if (!isAuthenticated) return
      if (user?.role !== 'admin') return
      
      try {
        const response = await productApi.getProductById(id)
        if (response.error) {
          toast.error('Failed to fetch product: ' + response.error)
          return
        }
        if (response.data?.product) {
          // Map MongoDB _id to frontend id
          const productData = {
            ...response.data.product,
            id: response.data.product._id
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

    fetchProduct()
  }, [isAuthenticated, user?.role, id])

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
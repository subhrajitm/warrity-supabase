"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Edit, Trash2 } from "lucide-react"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { Product } from "@/types/product"
import { productApi } from "@/lib/api"
import { toast } from "sonner"

interface Props {
  product: Product;
}

export default function AdminProductDetails({ product }: Props) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      const response = await productApi.deleteProduct(product.id)
      if (response.error) {
        toast.error('Failed to delete product: ' + response.error)
        return
      }
      toast.success('Product deleted successfully')
      router.push('/admin/products')
    } catch (error) {
      toast.error('An error occurred while deleting the product')
      console.error('Error deleting product:', error)
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }
  
  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/products" className="flex items-center text-amber-800 hover:text-amber-600 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Link>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-amber-900">{product.name}</h1>
        
        <div className="flex space-x-3">
          <Link href={`/admin/products/${product.id}/edit`}>
            <Button className="bg-amber-800 hover:bg-amber-900 text-amber-100 border-2 border-amber-900">
              <Edit className="mr-2 h-4 w-4" />
              Edit Product
            </Button>
          </Link>
          
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-2 border-red-800 text-red-800 hover:bg-red-100">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent className="border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-amber-900">Confirm Deletion</DialogTitle>
                <DialogDescription className="text-amber-800">
                  Are you sure you want to delete this product? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setDeleteDialogOpen(false)}
                  className="border-2 border-amber-800 text-amber-800"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleDelete}
                  className="bg-red-800 hover:bg-red-900 text-white border-2 border-red-900"
                >
                  Delete Product
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100 mb-6">
            <CardHeader className="border-b-4 border-amber-800 bg-amber-200 px-6 py-4">
              <CardTitle className="text-2xl font-bold text-amber-900">
                Product Information
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-amber-700">Category</h3>
                    <p className="text-amber-900 font-semibold">{product.category}</p>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-amber-700">Serial Number</h3>
                    <p className="text-amber-900 font-semibold">{product.serialNumber}</p>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-amber-700">Manufacturer</h3>
                    <p className="text-amber-900 font-semibold">{product.manufacturer || '-'}</p>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-amber-700">Model</h3>
                    <p className="text-amber-900 font-semibold">{product.model || '-'}</p>
                  </div>
                </div>
                
                <div>
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-amber-700">Purchase Date</h3>
                    <p className="text-amber-900 font-semibold">
                      {product.purchaseDate
                        ? new Date(product.purchaseDate).toLocaleDateString()
                        : '-'
                      }
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-amber-700">Price</h3>
                    <p className="text-amber-900 font-semibold">{product.price || '-'}</p>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-amber-700">Purchase Location</h3>
                    <p className="text-amber-900 font-semibold">{product.purchaseLocation || '-'}</p>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-amber-700">Receipt Number</h3>
                    <p className="text-amber-900 font-semibold">{product.receiptNumber || '-'}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-amber-700">Description</h3>
                  <p className="text-amber-900 mt-1 whitespace-pre-wrap">{product.description || '-'}</p>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-amber-700">Notes</h3>
                  <p className="text-amber-900 mt-1 whitespace-pre-wrap">{product.notes || '-'}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-amber-800">
                  <div>
                    <h3 className="text-sm font-medium text-amber-700">Created At</h3>
                    <p className="text-amber-900 font-semibold">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-amber-700">Last Updated</h3>
                    <p className="text-amber-900 font-semibold">
                      {new Date(product.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100">
            <CardHeader className="border-b-4 border-amber-800 bg-amber-200 px-6 py-4">
              <CardTitle className="text-2xl font-bold text-amber-900">
                Product Images
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="space-y-4">
                {product.images?.map((image: string, index: number) => (
                  <div key={index} className="border-2 border-amber-800 rounded-lg overflow-hidden">
                    <img src={image} alt={`${product.name} - Image ${index + 1}`} className="w-full h-auto" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 
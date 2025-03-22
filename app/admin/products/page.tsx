"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  PlusCircle, 
  Search, 
  Edit, 
  Trash2,
  Package,
  Filter,
  SortAsc,
  SortDesc,
  Eye
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { productApi } from "@/lib/api"

// Define Product interface to match API response
interface Product {
  _id?: string  // MongoDB _id field
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

export default function AdminProductsPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<keyof Product>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [isLoading, setIsLoading] = useState(true)
  
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

  // Function to fetch products
  const fetchProducts = async () => {
    if (authLoading || !isAuthenticated || user?.role !== 'admin') return
    
    try {
      // Force a fresh fetch by adding a timestamp
      const timestamp = new Date().getTime()
      const response = await productApi.getAllProducts()
      console.log('API Response:', response) // Add logging to debug response
      
      if (response.error) {
        toast.error('Failed to fetch products: ' + response.error)
        return
      }

      // Handle both array and object with products property
      const productsData = Array.isArray(response.data) 
        ? response.data 
        : (response.data as { products: Product[] })?.products || []

      if (!productsData || productsData.length === 0) {
        console.log('No products found in response')
        setProducts([])
        setFilteredProducts([])
        return
      }

      const products = productsData.map((product: Product) => ({
        ...product,
        id: product._id || product.id, // Handle both _id and id cases
        _timestamp: timestamp // Add timestamp to force re-render
      })) as Product[]

      console.log('Processed products:', products) // Add logging to debug processed data
      setProducts(products)
      setFilteredProducts(products)
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('An error occurred while fetching products')
    } finally {
      setIsLoading(false)
    }
  }

  // Focus state to track when page gains focus
  const [hasFocus, setHasFocus] = useState(false)

  // Fetch products initially
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      router.refresh() // Refresh router cache
      fetchProducts()
    }
  }, [isAuthenticated, user?.role, authLoading])

  // Refetch products when page gains focus
  useEffect(() => {
    const onFocus = () => {
      setHasFocus(true)
      router.refresh() // Refresh router cache
      fetchProducts()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  // Refetch products when navigating back using browser history
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        router.refresh() // Refresh router cache
        fetchProducts()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])
  
  // Filter and sort products
  useEffect(() => {
    let result = [...products]
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(product => {
        const manufacturerMatch = product.manufacturer ? 
          product.manufacturer.toLowerCase().includes(query) : false
        return product.name.toLowerCase().includes(query) || 
          manufacturerMatch ||
          product.category.toLowerCase().includes(query)
      })
    }
    
    // Apply sorting
    result.sort((a, b) => {
      const valueA = a[sortField]?.toString() || ''
      const valueB = b[sortField]?.toString() || ''
      
      if (sortDirection === 'asc') {
        return valueA.localeCompare(valueB)
      } else {
        return valueB.localeCompare(valueA)
      }
    })
    
    setFilteredProducts(result)
  }, [products, searchQuery, sortField, sortDirection])
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }
  
  const handleSortChange = (field: keyof Product) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }
  
  const getSortIcon = (field: keyof Product) => {
    if (sortField !== field) return null
    
    return sortDirection === 'asc' 
      ? <SortAsc className="h-4 w-4 ml-1" />
      : <SortDesc className="h-4 w-4 ml-1" />
  }
  
  const handleDeleteProduct = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        const response = await productApi.deleteProduct(id)
        if (response.error) {
          toast.error('Failed to delete product: ' + response.error)
          return
        }
        toast.success('Product deleted successfully')
        const updatedProducts = products.filter(product => product.id !== id)
        setProducts(updatedProducts)
        setFilteredProducts(updatedProducts)
      } catch (error) {
        toast.error('An error occurred while deleting the product')
        console.error('Error deleting product:', error)
      }
    }
  }
  
  if (authLoading || isLoading) {
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
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-amber-900">Products</h1>
        <Link href="/admin/products/add">
          <Button className="bg-amber-800 hover:bg-amber-900 text-amber-100 border-2 border-amber-900">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>
      
      <Card className="border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100 mb-8">
        <CardContent className="p-6">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-amber-800" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 border-2 border-amber-800 bg-amber-50"
              />
            </div>
            <Button variant="outline" className="border-2 border-amber-800 text-amber-800">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100">
        <CardHeader className="border-b-4 border-amber-800 bg-amber-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-bold text-amber-900">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'}
            </CardTitle>
            <div className="flex items-center text-sm text-amber-800">
              <Filter className="h-4 w-4 mr-1" />
              Sort by:
              <button 
                className="ml-2 flex items-center font-medium hover:text-amber-600"
                onClick={() => handleSortChange('name')}
              >
                Name {getSortIcon('name')}
              </button>
              <span className="mx-2">|</span>
              <button 
                className="flex items-center font-medium hover:text-amber-600"
                onClick={() => handleSortChange('manufacturer')}
              >
                Manufacturer {getSortIcon('manufacturer')}
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-amber-800">
                  <th className="text-left py-3 px-4 text-amber-900 font-bold">Product Name</th>
                  <th className="text-left py-3 px-4 text-amber-900 font-bold">Category</th>
                  <th className="text-left py-3 px-4 text-amber-900 font-bold">Serial Number</th>
                  <th className="text-left py-3 px-4 text-amber-900 font-bold">Manufacturer</th>
                  <th className="text-left py-3 px-4 text-amber-900 font-bold">Purchase Date</th>
                  <th className="text-right py-3 px-4 text-amber-900 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-amber-800">
                      <Package className="h-12 w-12 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-amber-900 mb-2">No products found</h3>
                      <p className="text-amber-800 mb-4">
                        {searchQuery ? 'Try adjusting your search criteria' : 'No products added yet'}
                      </p>
                      <Link href="/admin/products/add">
                        <Button className="bg-amber-800 hover:bg-amber-900 text-amber-100 border-2 border-amber-900">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add Product
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ) : (
                    filteredProducts.map(product => (
                      <tr key={product.id} className="border-b border-amber-300 hover:bg-amber-50">
                        <td className="py-3 px-4">
                          <Link href={`/admin/products/${product.id}`} className="text-amber-900 font-medium hover:text-amber-700 hover:underline">
                            {product.name}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-amber-900 capitalize">{product.category}</td>
                        <td className="py-3 px-4 text-amber-900">{product.serialNumber}</td>
                        <td className="py-3 px-4 text-amber-900">{product.manufacturer || '-'}</td>
                        <td className="py-3 px-4 text-amber-900">
                          {product.purchaseDate 
                            ? new Date(product.purchaseDate).toLocaleDateString()
                            : '-'
                          }
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <Link href={`/admin/products/${product.id}`}>
                              <Button variant="outline" size="sm" className="h-8 border-amber-800 text-amber-800" title="View Product">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/admin/products/${product.id}/edit`}>
                              <Button variant="outline" size="sm" className="h-8 border-amber-800 text-amber-800" title="Edit Product">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 border-red-800 text-red-800"
                              onClick={() => handleDeleteProduct(product.id)}
                              title="Delete Product"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
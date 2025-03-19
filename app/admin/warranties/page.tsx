"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  PlusCircle, 
  Search, 
  Filter, 
  FileText, 
  Edit, 
  Trash2,
  SortAsc,
  SortDesc,
  AlertTriangle,
  CheckCircle2,
  Clock
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"

import { adminApi, warrantyApi } from "@/lib/api"
import { toast } from "sonner"

// Import shared types
import type { Warranty } from '@/types/warranty'

export default function AdminWarrantiesPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [warranties, setWarranties] = useState<Warranty[]>([])
  const [filteredWarranties, setFilteredWarranties] = useState<Warranty[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<keyof Warranty | 'product.name' | 'product.manufacturer' | 'purchaseDate' | 'expirationDate'>("expirationDate")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [statusFilter, setStatusFilter] = useState<string>("all")
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

  // Function to fetch warranties
  const fetchWarranties = async () => {
    if (authLoading || !isAuthenticated || user?.role !== 'admin') return
    
    try {
      const response = await adminApi.getAllWarranties()
      if (response.error) {
        toast.error('Failed to fetch warranties: ' + response.error)
        return
      }
      if (response.data?.warranties) {
        // Admin API returns array of warranties
        const warrantyList = response.data.warranties
        
        // Debug: Check if any warranties are missing IDs
        const missingIds = warrantyList.filter(w => !w._id)
        if (missingIds.length > 0) {
          console.warn('Some warranties are missing _id:', missingIds)
        }
        
        setWarranties(warrantyList)
        setFilteredWarranties(warrantyList)
      }
    } catch (error) {
      toast.error('An error occurred while fetching warranties')
      console.error('Error fetching warranties:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch warranties initially
  useEffect(() => {
    fetchWarranties()
  }, [isAuthenticated, user?.role, authLoading])

  // Refetch warranties when page gains focus
  useEffect(() => {
    const onFocus = () => {
      fetchWarranties()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  // Refetch warranties when navigating back using browser history
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchWarranties()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])
  
  // Filter and sort warranties
  useEffect(() => {
    let result = [...warranties]
    
    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(warranty => warranty.status === statusFilter)
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(warranty => 
        (warranty.product?.name?.toLowerCase().includes(query) || false) || 
        (warranty.product?.manufacturer?.toLowerCase().includes(query) || false) || 
        warranty.warrantyProvider.toLowerCase().includes(query) || 
        warranty.warrantyNumber.toLowerCase().includes(query) || 
        warranty.notes?.toLowerCase().includes(query) || false
      )
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let valueA: string
      let valueB: string
      
      if (sortField === 'product.name') {
        valueA = a.product?.name || ''
        valueB = b.product?.name || ''
      } else if (sortField === 'product.manufacturer') {
        valueA = a.product?.manufacturer || ''
        valueB = b.product?.manufacturer || ''
      } else {
        valueA = String(a[sortField as keyof Warranty] || '')
        valueB = String(b[sortField as keyof Warranty] || '')
      }
      
      if (sortDirection === 'asc') {
        return valueA.localeCompare(valueB)
      } else {
        return valueB.localeCompare(valueA)
      }
    })
    
    setFilteredWarranties(result)
  }, [warranties, searchQuery, sortField, sortDirection, statusFilter])
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }
  
  const handleSortChange = (field: keyof Warranty | 'product.name' | 'product.manufacturer' | 'purchaseDate' | 'expirationDate') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }
  
  const getSortIcon = (field: keyof Warranty | 'product.name' | 'product.manufacturer' | 'purchaseDate' | 'expirationDate') => {
    if (sortField !== field) return null
    
    return sortDirection === 'asc' 
      ? <SortAsc className="h-4 w-4 ml-1" />
      : <SortDesc className="h-4 w-4 ml-1" />
  }
  
  const handleDeleteWarranty = async (id: string) => {
    if (confirm("Are you sure you want to delete this warranty?")) {
      try {
        const response = await warrantyApi.deleteWarranty(id)
        if (response.error) {
          toast.error('Failed to delete warranty: ' + response.error)
          return
        }
        toast.success('Warranty deleted successfully')
        fetchWarranties()
      } catch (error) {
        toast.error('An error occurred while deleting the warranty')
        console.error('Error deleting warranty:', error)
      }
    }
  }
  
  const getStatusBadge = (status: Warranty["status"]) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 border border-green-300">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Active
          </Badge>
        )
      case "expiring":
        return (
          <Badge className="bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="h-3 w-3 mr-1" />
            Expiring Soon
          </Badge>
        )
      case "expired":
        return (
          <Badge className="bg-red-100 text-red-800 border border-red-300">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        )
      default:
        return null
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-amber-800 text-xl">Loading warranties...</p>
      </div>
    )
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-amber-900">Warranties</h1>
        <Link href="/admin/warranties/add">
          <Button className="bg-amber-800 hover:bg-amber-900 text-amber-100 border-2 border-amber-900">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Warranty
          </Button>
        </Link>
      </div>
      
      <Card className="border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100 mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-amber-800" />
              <Input
                placeholder="Search warranties..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 border-2 border-amber-800 bg-amber-50"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-amber-800 whitespace-nowrap">Status:</span>
              <div className="flex space-x-2">
                <Button 
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                  className={statusFilter === "all" 
                    ? "bg-amber-800 text-amber-100" 
                    : "border-amber-800 text-amber-800"
                  }
                >
                  All
                </Button>
                <Button 
                  variant={statusFilter === "active" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("active")}
                  className={statusFilter === "active" 
                    ? "bg-green-700 text-green-100 border-green-800" 
                    : "border-green-700 text-green-700"
                  }
                >
                  Active
                </Button>
                <Button 
                  variant={statusFilter === "expiring" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("expiring")}
                  className={statusFilter === "expiring" 
                    ? "bg-amber-700 text-amber-100 border-amber-800" 
                    : "border-amber-700 text-amber-700"
                  }
                >
                  Expiring
                </Button>
                <Button 
                  variant={statusFilter === "expired" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("expired")}
                  className={statusFilter === "expired" 
                    ? "bg-red-700 text-red-100 border-red-800" 
                    : "border-red-700 text-red-700"
                  }
                >
                  Expired
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100">
        <CardHeader className="border-b-4 border-amber-800 bg-amber-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-bold text-amber-900">
              {filteredWarranties.length} {filteredWarranties.length === 1 ? 'Warranty' : 'Warranties'}
            </CardTitle>
            <div className="flex items-center text-sm text-amber-800">
              <Filter className="h-4 w-4 mr-1" />
              Sort by:
              <button 
                className="ml-2 flex items-center font-medium hover:text-amber-600"
                onClick={() => handleSortChange('product.name')}
              >
                Product {getSortIcon('product.name')}
              </button>
              <span className="mx-2">|</span>
              <button 
                className="flex items-center font-medium hover:text-amber-600"
                onClick={() => handleSortChange('expirationDate')}
              >
                Expiry Date {getSortIcon('expirationDate')}
              </button>
              <span className="mx-2">|</span>
              <button 
                className="flex items-center font-medium hover:text-amber-600"
                onClick={() => handleSortChange('createdAt')}
              >
                Created {getSortIcon('createdAt')}
              </button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-amber-200 border-b-2 border-amber-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                    Warranty #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                    Purchase Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                    Expiration Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-amber-900 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-amber-50 divide-y divide-amber-200">
                {filteredWarranties.length === 0 ? (
                  <tr key="no-warranties">
                    <td colSpan={7} className="px-6 py-10 text-center text-amber-800">
                      <FileText className="h-12 w-12 mx-auto mb-2 text-amber-400" />
                      <p className="text-lg font-medium">No warranties found</p>
                      <p className="text-sm">Try adjusting your search or add a new warranty</p>
                    </td>
                  </tr>
                ) : (
                  // In the table rows where you render the warranties
                  filteredWarranties.map((warranty, index) => (
                    <tr key={`${warranty._id}-${index}`} className="hover:bg-amber-100">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-amber-900">{warranty.product?.name || 'Unknown Product'}</div>
                        <div className="text-sm text-amber-700">{warranty.product?.manufacturer || 'Unknown Manufacturer'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-amber-800">{warranty.warrantyNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-amber-800">{warranty.warrantyProvider}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-amber-800">{new Date(warranty.purchaseDate).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-amber-800">{new Date(warranty.expirationDate).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(warranty.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end space-x-2">
                          <Link href={warranty._id ? `/admin/warranties/${warranty._id}` : "#"}>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-amber-800 text-amber-800"
                              disabled={!warranty._id}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={warranty._id ? `/admin/warranties/${warranty._id}/edit` : "#"}>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-amber-800 text-amber-800"
                              disabled={!warranty._id}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-red-800 text-red-800"
                            onClick={() => warranty._id ? handleDeleteWarranty(warranty._id) : null}
                            disabled={!warranty._id}
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
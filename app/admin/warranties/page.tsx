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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
    if (isAuthenticated && user?.role === 'admin') {
      router.refresh() // Refresh router cache
      fetchWarranties()
    }
  }, [isAuthenticated, user?.role, authLoading])

  // Refetch warranties when page gains focus
  useEffect(() => {
    const onFocus = () => {
      router.refresh() // Refresh router cache
      fetchWarranties()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  // Refetch warranties when navigating back using browser history
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        router.refresh() // Refresh router cache
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
                type="text"
                placeholder="Search warranties..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 border-2 border-amber-800 bg-amber-50"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[180px] border-2 border-amber-800 bg-amber-50">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expiring">Expiring Soon</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredWarranties.map((warranty) => (
          <Card key={warranty._id} className="border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-amber-900">
                      {warranty.product?.name || 'Unnamed Product'}
                    </h3>
                    {getStatusBadge(warranty.status)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-amber-800">
                    <div>
                      <p className="font-medium">Manufacturer:</p>
                      <p>{warranty.product?.manufacturer || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Warranty Provider:</p>
                      <p>{warranty.warrantyProvider}</p>
                    </div>
                    <div>
                      <p className="font-medium">User:</p>
                      <p>{warranty.user?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Email:</p>
                      <p>{warranty.user?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Purchase Date:</p>
                      <p>{new Date(warranty.purchaseDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="font-medium">Expiration Date:</p>
                      <p>{new Date(warranty.expirationDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/warranties/${warranty._id}`}>
                    <Button variant="outline" className="border-2 border-amber-800 text-amber-800">
                      <FileText className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/admin/warranties/${warranty._id}/edit`}>
                    <Button variant="outline" className="border-2 border-amber-800 text-amber-800">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    className="border-2 border-red-600 text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteWarranty(warranty._id || '')}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
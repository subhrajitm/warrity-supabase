"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  PlusCircle, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Package,
  Calendar,
  ChevronRight,
  Bell
} from "lucide-react"
import WarrantySidebar from "./warranties/components/sidebar"
import { useAuth } from "@/lib/auth-context"

// Define warranty type
interface Warranty {
  id: number;
  _id: string;
  product: string;
  category: string;
  provider: string;
  purchaseDate: string;
  endDate: string;
  status: string;
}

// Mock data for demonstration
const mockWarranties: Warranty[] = [
  {
    id: 1,
    _id: "1",
    product: "Samsung TV",
    category: "electronics",
    provider: "Samsung Electronics",
    purchaseDate: "2023-01-15",
    endDate: "2024-05-15",
    status: "active"
  },
  {
    id: 2,
    _id: "2",
    product: "Dyson Vacuum",
    category: "appliances",
    provider: "Dyson Inc.",
    purchaseDate: "2022-06-10",
    endDate: "2023-12-10",
    status: "expiring"
  },
  {
    id: 3,
    _id: "3",
    product: "MacBook Pro",
    category: "electronics",
    provider: "Apple Inc.",
    purchaseDate: "2022-05-20",
    endDate: "2023-08-25",
    status: "expiring"
  }
]

export default function UserDashboard() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [warranties, setWarranties] = useState<Warranty[]>([])
  const [expiringWarranties, setExpiringWarranties] = useState<Warranty[]>([])
  
  // Check if user is logged in
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/login')
      } else if (user && user.role !== 'user') {
        router.replace(user.role === 'admin' ? '/admin' : '/login')
      }
    }
    
    // In a real app, you would fetch the warranties from your backend
    setWarranties(mockWarranties)
    setExpiringWarranties(mockWarranties.filter(w => w.status === 'expiring'))
  }, [isAuthenticated, isLoading, router, user])
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-6">
        <div className="text-amber-800 text-xl flex items-center">
          <div className="animate-spin mr-3 h-5 w-5 border-2 border-amber-800 border-t-transparent rounded-full" />
          Loading...
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        )
      case 'expiring':
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600">
            <Clock className="h-3 w-3 mr-1" />
            Expiring Soon
          </Badge>
        )
      case 'expired':
        return (
          <Badge className="bg-red-500 hover:bg-red-600">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }
  
  return (
    <div className="flex min-h-screen bg-amber-50">
      <WarrantySidebar />
      
      <div className="flex-1 p-6 ml-64">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-amber-900 mb-6">
            Dashboard
          </h1>
          
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card className="border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100">
              <CardHeader className="border-b-4 border-amber-800 bg-amber-200 px-6 py-4">
                <CardTitle className="text-xl font-bold text-amber-900">
                  Total Warranties
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex items-center justify-between">
                <div className="text-4xl font-bold text-amber-900">{warranties.length}</div>
                <Package className="h-12 w-12 text-amber-800" />
              </CardContent>
            </Card>
            
            <Card className="border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100">
              <CardHeader className="border-b-4 border-amber-800 bg-amber-200 px-6 py-4">
                <CardTitle className="text-xl font-bold text-amber-900">
                  Expiring Soon
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex items-center justify-between">
                <div className="text-4xl font-bold text-amber-900">{expiringWarranties.length}</div>
                <Clock className="h-12 w-12 text-amber-800" />
              </CardContent>
            </Card>
            
            <Card className="border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100">
              <CardHeader className="border-b-4 border-amber-800 bg-amber-200 px-6 py-4">
                <CardTitle className="text-xl font-bold text-amber-900">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Link href="/user/warranties/add">
                  <Button className="w-full bg-amber-800 hover:bg-amber-900 text-amber-100 border-2 border-amber-900">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Warranty
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
          
          <Card className="border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100 mb-8">
            <CardHeader className="border-b-4 border-amber-800 bg-amber-200 px-6 py-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold text-amber-900">
                  Expiring Warranties
                </CardTitle>
                <Link href="/user/warranties?status=expiring" className="text-amber-800 hover:text-amber-600 text-sm font-medium">
                  View All
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {expiringWarranties.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-amber-800">No warranties expiring soon</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {expiringWarranties.map(warranty => {
                    // Use _id if available, fall back to id
                    const warrantyId = warranty._id || warranty.id;
                    
                    return (
                    <Link key={warrantyId} href={`/user/warranties/${warrantyId}`}>
                      <div className="flex justify-between items-center p-4 border-2 border-amber-800 rounded-lg bg-amber-50 hover:bg-amber-200 transition-colors">
                        <div className="flex items-center">
                          <div className="mr-4">
                            <Bell className="h-8 w-8 text-amber-800" />
                          </div>
                          <div>
                            <h3 className="font-medium text-amber-900">{warranty.product}</h3>
                            <p className="text-sm text-amber-700">{warranty.provider}</p>
                            <div className="flex items-center mt-1">
                              {getStatusBadge(warranty.status)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center text-sm text-amber-800">
                            <Calendar className="h-4 w-4 mr-1" />
                            Expires: {warranty.endDate}
                          </div>
                          <ChevronRight className="h-5 w-5 text-amber-800 mt-2 ml-auto" />
                        </div>
                      </div>
                    </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100">
            <CardHeader className="border-b-4 border-amber-800 bg-amber-200 px-6 py-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold text-amber-900">
                  Recent Warranties
                </CardTitle>
                <Link href="/user/warranties" className="text-amber-800 hover:text-amber-600 text-sm font-medium">
                  View All
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {warranties.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-amber-800">No warranties added yet</p>
                  <Link href="/user/warranties/add" className="mt-2 inline-block">
                    <Button className="bg-amber-800 hover:bg-amber-900 text-amber-100 border-2 border-amber-900">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Warranty
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {warranties.slice(0, 3).map(warranty => {
                    // Use _id if available, fall back to id
                    const warrantyId = warranty._id || warranty.id;
                    
                    return (
                    <Link key={warrantyId} href={`/user/warranties/${warrantyId}`}>
                      <div className="flex justify-between items-center p-4 border-2 border-amber-800 rounded-lg bg-amber-50 hover:bg-amber-200 transition-colors">
                        <div className="flex items-center">
                          <div className="mr-4">
                            <Package className="h-8 w-8 text-amber-800" />
                          </div>
                          <div>
                            <h3 className="font-medium text-amber-900">{warranty.product}</h3>
                            <p className="text-sm text-amber-700">{warranty.provider}</p>
                            <div className="flex items-center mt-1 space-x-2">
                              {getStatusBadge(warranty.status)}
                              <Badge className="bg-amber-800">{warranty.category}</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center text-sm text-amber-800">
                            <Calendar className="h-4 w-4 mr-1" />
                            Expires: {warranty.endDate}
                          </div>
                          <ChevronRight className="h-5 w-5 text-amber-800 mt-2 ml-auto" />
                        </div>
                      </div>
                    </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
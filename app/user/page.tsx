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
import { warrantyApi } from "@/lib/api"
import type { Warranty, DashboardStats, Product } from "@/types/warranty"

export default function UserDashboard() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [warranties, setWarranties] = useState<Warranty[]>([])
  const [expiringWarranties, setExpiringWarranties] = useState<Warranty[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    active: 0,
    expiring: 0,
    expired: 0,
    warrantyByCategory: [],
    recentWarranties: []
  })
  const [isLoadingData, setIsLoadingData] = useState(true)
  
  // Fetch warranties and stats
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setIsLoadingData(true);
        
        const [warrantiesResponse, expiringResponse, statsResponse] = await Promise.all([
          warrantyApi.getAllWarranties(),
          warrantyApi.getExpiringWarranties(),
          warrantyApi.getWarrantyStats()
        ]);

        if (warrantiesResponse.data) {
          setWarranties(Array.isArray(warrantiesResponse.data) ? warrantiesResponse.data : []);
        }

        if (expiringResponse.data) {
          setExpiringWarranties(Array.isArray(expiringResponse.data) ? expiringResponse.data : []);
        }

        // Update stats with the response data
        if (statsResponse?.data) {
          const { total, active, expiring, expired } = statsResponse.data;
          setStats({
            total: total || 0,
            active: active || 0,
            expiring: expiring || 0,
            expired: expired || 0,
            warrantyByCategory: [],
            recentWarranties: []
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchData();
  }, [user]);
  
  // Check if user is logged in
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/login')
      } else if (user && user.role !== 'user') {
        router.replace(user.role === 'admin' ? '/admin' : '/login')
      }
    }
  }, [isAuthenticated, isLoading, router, user])
  
  // Show loading state while checking authentication or fetching data
  if (isLoading || isLoadingData) {
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
  
  // Helper function to get product name
  const getProductName = (product: string | Product) => {
    if (typeof product === 'string') {
      return 'Unknown Product'; // Fallback if we only have the ID
    }
    return product.name;
  };
  
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
                <div className="text-4xl font-bold text-amber-900">{stats.total}</div>
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
                <div className="text-4xl font-bold text-amber-900">{stats.expiring}</div>
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
                  {expiringWarranties.map(warranty => (
                    <Link key={warranty._id} href={`/user/warranties/${warranty._id}`}>
                      <div className="flex justify-between items-center p-4 border-2 border-amber-800 rounded-lg bg-amber-50 hover:bg-amber-200 transition-colors">
                        <div className="flex items-center">
                          <div className="mr-4">
                            <Bell className="h-8 w-8 text-amber-800" />
                          </div>
                          <div>
                            <h3 className="font-medium text-amber-900">{getProductName(warranty.product)}</h3>
                            <p className="text-sm text-amber-700">{warranty.warrantyProvider}</p>
                            <div className="flex items-center mt-1">
                              {getStatusBadge(warranty.status)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center text-sm text-amber-800">
                            <Calendar className="h-4 w-4 mr-1" />
                            Expires: {new Date(warranty.expirationDate).toLocaleDateString()}
                          </div>
                          <ChevronRight className="h-5 w-5 text-amber-800 mt-2 ml-auto" />
                        </div>
                      </div>
                    </Link>
                  ))}
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
                      Add Your First Warranty
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {warranties.slice(0, 5).map(warranty => (
                    <Link key={warranty._id} href={`/user/warranties/${warranty._id}`}>
                      <div className="flex justify-between items-center p-4 border-2 border-amber-800 rounded-lg bg-amber-50 hover:bg-amber-200 transition-colors">
                        <div className="flex items-center">
                          <div className="mr-4">
                            <Package className="h-8 w-8 text-amber-800" />
                          </div>
                          <div>
                            <h3 className="font-medium text-amber-900">{getProductName(warranty.product)}</h3>
                            <p className="text-sm text-amber-700">{warranty.warrantyProvider}</p>
                            <div className="flex items-center mt-1">
                              {getStatusBadge(warranty.status)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center text-sm text-amber-800">
                            <Calendar className="h-4 w-4 mr-1" />
                            Expires: {new Date(warranty.expirationDate).toLocaleDateString()}
                          </div>
                          <ChevronRight className="h-5 w-5 text-amber-800 mt-2 ml-auto" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
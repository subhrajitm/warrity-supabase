"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Package, 
  Users, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  BarChart3,
  AlertCircle,
  XCircle
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { adminApi } from "@/lib/api"
import { toast } from "sonner"

interface DashboardStats {
  totalProducts: number;
  totalUsers: number;
  totalWarranties: number;
  activeWarranties: number;
  expiringWarranties: number;
  expiredWarranties: number;
  warrantyByCategory: {
    category: string;
    count: number;
  }[];
  recentWarranties: any[];
}

export default function AdminDashboard() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Check if admin is logged in and fetch stats
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/login')
      } else if (user && user.role !== 'admin') {
        router.replace(user.role === 'user' ? '/user' : '/login')
      } else {
        fetchDashboardStats()
      }
    }
  }, [isAuthenticated, isLoading, router, user])

  const fetchDashboardStats = async () => {
    try {
      const [warrantyAnalytics, productAnalytics, usersResponse] = await Promise.all([
        adminApi.getWarrantyAnalytics(),
        adminApi.getProductAnalytics(),
        adminApi.getAllUsers()
      ])

      if (warrantyAnalytics.error || productAnalytics.error || usersResponse.error) {
        toast.error('Failed to fetch dashboard stats')
        return
      }

      if (warrantyAnalytics.data && productAnalytics.data && usersResponse.data) {
        setStats({
          totalProducts: productAnalytics.data.totalProducts,
          totalUsers: usersResponse.data.users.length,
          totalWarranties: warrantyAnalytics.data.totalWarranties,
          activeWarranties: warrantyAnalytics.data.activeWarranties,
          expiringWarranties: warrantyAnalytics.data.expiringWarranties,
          expiredWarranties: warrantyAnalytics.data.expiredWarranties,
          warrantyByCategory: productAnalytics.data.productsByCategory,
          recentWarranties: []
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      toast.error('An error occurred while fetching dashboard stats')
    } finally {
      setLoading(false)
    }
  }
  
  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-6">
        <div className="text-amber-800 text-xl flex items-center">
          <div className="animate-spin mr-3 h-5 w-5 border-2 border-amber-800 border-t-transparent rounded-full" />
          Loading...
        </div>
      </div>
    )
  }
  
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-amber-900 mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-4 border-amber-800 shadow-[4px_4px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100">
          <CardContent className="p-6">
            <div className="bg-amber-50 p-6 rounded-lg border-2 border-amber-800 flex items-center justify-between">
              <div>
                <p className="text-amber-800 text-sm font-medium">Total Products</p>
                <h3 className="text-3xl font-bold text-amber-900 mt-1">{stats?.totalProducts || 0}</h3>
              </div>
              <div className="h-12 w-12 bg-amber-200 rounded-full flex items-center justify-center">
                <Package className="h-6 w-6 text-amber-900" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-4 border-amber-800 shadow-[4px_4px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100">
          <CardContent className="p-6">
            <div className="bg-amber-50 p-6 rounded-lg border-2 border-amber-800 flex items-center justify-between">
              <div>
                <p className="text-amber-800 text-sm font-medium">Active Warranties</p>
                <h3 className="text-3xl font-bold text-amber-900 mt-1">{stats?.activeWarranties || 0}</h3>
              </div>
              <div className="h-12 w-12 bg-amber-200 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-amber-900" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-4 border-amber-800 shadow-[4px_4px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100">
          <CardContent className="p-6">
            <div className="bg-amber-50 p-6 rounded-lg border-2 border-amber-800 flex items-center justify-between">
              <div>
                <p className="text-amber-800 text-sm font-medium">Total Users</p>
                <h3 className="text-3xl font-bold text-amber-900 mt-1">{stats?.totalUsers || 0}</h3>
              </div>
              <div className="h-12 w-12 bg-amber-200 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-amber-900" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-4 border-amber-800 shadow-[4px_4px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100">
          <CardContent className="p-6">
            <div className="bg-amber-50 p-6 rounded-lg border-2 border-amber-800 flex items-center justify-between">
              <div>
                <p className="text-amber-800 text-sm font-medium">Total Warranties</p>
                <h3 className="text-3xl font-bold text-amber-900 mt-1">{stats?.totalWarranties || 0}</h3>
              </div>
              <div className="h-12 w-12 bg-amber-200 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-amber-900" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="border-4 border-amber-800 shadow-[4px_4px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100 lg:col-span-2">
          <CardHeader className="border-b-4 border-amber-800 bg-amber-200 px-6 py-4">
            <CardTitle className="text-xl font-bold text-amber-900">
              <BarChart3 className="inline-block mr-2 h-5 w-5" />
              Warranty Statistics
            </CardTitle>
            <CardDescription className="text-amber-800">
              Overview of warranty status across all users
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-amber-800 text-sm font-medium">Active Warranties</p>
                <h3 className="text-2xl font-bold text-amber-900 mt-1">{stats?.activeWarranties || 0}</h3>
              </div>
              <div className="text-center">
                <p className="text-amber-800 text-sm font-medium">Expiring Warranties</p>
                <h3 className="text-2xl font-bold text-amber-900 mt-1">{stats?.expiringWarranties || 0}</h3>
              </div>
              <div className="text-center">
                <p className="text-amber-800 text-sm font-medium">Expired Warranties</p>
                <h3 className="text-2xl font-bold text-amber-900 mt-1">{stats?.expiredWarranties || 0}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-4 border-amber-800 shadow-[4px_4px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100">
          <CardHeader className="border-b-4 border-amber-800 bg-amber-200 px-6 py-4">
            <CardTitle className="text-xl font-bold text-amber-900">
              <Clock className="inline-block mr-2 h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription className="text-amber-800">
              Latest warranty registrations and updates
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-900 font-medium">New Warranties</p>
                  <p className="text-amber-700 text-sm">Last 24 hours</p>
                </div>
                <div className="h-8 w-8 bg-amber-200 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-amber-800" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-900 font-medium">Expiring Soon</p>
                  <p className="text-amber-700 text-sm">Next 7 days</p>
                </div>
                <div className="h-8 w-8 bg-amber-200 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-amber-800" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
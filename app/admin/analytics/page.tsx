"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { adminApi } from "@/lib/api"
import { toast } from "sonner"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"

const COLORS = ['#92400e', '#b45309', '#d97706', '#f59e0b', '#fbbf24']

export default function AdminAnalyticsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [warrantyStats, setWarrantyStats] = useState<any>(null)
  const [productStats, setProductStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === 'admin') {
      fetchAnalytics()
    }
  }, [authLoading, isAuthenticated, user])

  const fetchAnalytics = async () => {
    try {
      const [warrantyResponse, productResponse] = await Promise.all([
        adminApi.getWarrantyAnalytics(),
        adminApi.getProductAnalytics()
      ])

      if (warrantyResponse.error) {
        toast.error('Failed to fetch warranty analytics: ' + warrantyResponse.error)
        return
      }
      if (productResponse.error) {
        toast.error('Failed to fetch product analytics: ' + productResponse.error)
        return
      }

      setWarrantyStats(warrantyResponse.data)
      setProductStats(productResponse.data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('An error occurred while fetching analytics')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-amber-800 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-amber-900">Analytics Dashboard</h1>
        <p className="text-amber-800 mt-2">View and analyze warranty and product data</p>
      </div>

      <Tabs defaultValue="warranties" className="space-y-4">
        <TabsList className="bg-amber-100 border-2 border-amber-800">
          <TabsTrigger value="warranties" className="data-[state=active]:bg-amber-800 data-[state=active]:text-amber-100">
            Warranties
          </TabsTrigger>
          <TabsTrigger value="products" className="data-[state=active]:bg-amber-800 data-[state=active]:text-amber-100">
            Products
          </TabsTrigger>
        </TabsList>

        <TabsContent value="warranties" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-2 border-amber-800 bg-amber-100">
              <CardHeader>
                <CardTitle className="text-amber-900">Total Warranties</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-amber-800">{warrantyStats?.totalWarranties || 0}</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-amber-800 bg-amber-100">
              <CardHeader>
                <CardTitle className="text-amber-900">Active Warranties</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-amber-800">{warrantyStats?.activeWarranties || 0}</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-amber-800 bg-amber-100">
              <CardHeader>
                <CardTitle className="text-amber-900">Expiring Soon</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-amber-800">{warrantyStats?.expiringWarranties || 0}</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-amber-800 bg-amber-100">
              <CardHeader>
                <CardTitle className="text-amber-900">Expired Warranties</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-amber-800">{warrantyStats?.expiredWarranties || 0}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-2 border-amber-800 bg-amber-100">
              <CardHeader>
                <CardTitle className="text-amber-900">Warranties by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={warrantyStats?.warrantyByStatus || []}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {warrantyStats?.warrantyByStatus?.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-amber-800 bg-amber-100">
              <CardHeader>
                <CardTitle className="text-amber-900">Warranties by Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={warrantyStats?.warrantyByMonth || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#92400e" />
                      <XAxis dataKey="month" stroke="#92400e" />
                      <YAxis stroke="#92400e" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#92400e" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-2 border-amber-800 bg-amber-100">
              <CardHeader>
                <CardTitle className="text-amber-900">Total Products</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-amber-800">{productStats?.totalProducts || 0}</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-amber-800 bg-amber-100">
              <CardHeader>
                <CardTitle className="text-amber-900">Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-amber-800">{productStats?.productsByCategory?.length || 0}</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-amber-800 bg-amber-100">
              <CardHeader>
                <CardTitle className="text-amber-900">Top Product</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-800">
                  {productStats?.topProducts?.[0]?.name || 'N/A'}
                </p>
                <p className="text-amber-700">
                  {productStats?.topProducts?.[0]?.warrantyCount || 0} warranties
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-2 border-amber-800 bg-amber-100">
              <CardHeader>
                <CardTitle className="text-amber-900">Products by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productStats?.productsByCategory || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#92400e" />
                      <XAxis dataKey="category" stroke="#92400e" />
                      <YAxis stroke="#92400e" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#92400e" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-amber-800 bg-amber-100">
              <CardHeader>
                <CardTitle className="text-amber-900">Top Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productStats?.topProducts || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#92400e" />
                      <XAxis dataKey="name" stroke="#92400e" />
                      <YAxis stroke="#92400e" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="warrantyCount" fill="#92400e" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
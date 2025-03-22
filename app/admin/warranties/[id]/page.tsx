"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CalendarIcon, Clock, Edit, Trash2, AlertTriangle, CheckCircle, ArrowLeft, User } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

import { adminApi, warrantyApi } from "@/lib/api"
import { toast } from "sonner"
import type { Warranty } from "@/types/warranty"

interface PageProps {
  params: Promise<{ id: string }>;
}

function WarrantyDetails({ warrantyId }: { warrantyId: string }) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [warranty, setWarranty] = useState<Warranty | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Check if admin is logged in and fetch warranty data
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.replace('/login')
      } else if (user?.role !== 'admin') {
        router.replace(user?.role === 'user' ? '/user' : '/login')
      } else {
        fetchWarrantyDetails()
      }
    }
  }, [router, warrantyId, authLoading, isAuthenticated, user])
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case "active":
        return (
          <div className="flex items-center">
            <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
            <Badge className="bg-green-500">Active</Badge>
          </div>
        )
      case "expiring":
        return (
          <div className="flex items-center">
            <Clock className="mr-2 h-5 w-5 text-amber-500" />
            <Badge className="bg-amber-500">Expiring Soon</Badge>
          </div>
        )
      case "expired":
        return (
          <div className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
            <Badge className="bg-red-500">Expired</Badge>
          </div>
        )
      default:
        return (
          <div className="flex items-center">
            <Badge className="bg-gray-500">Unknown</Badge>
          </div>
        )
    }
  }
  
  const fetchWarrantyDetails = async () => {
    try {
      const response = await warrantyApi.getWarrantyById(warrantyId)
      if (response.error) {
        toast.error('Failed to fetch warranty: ' + response.error)
        router.push('/admin/warranties')
        return
      }
      if (response.data?.warranty) {
        setWarranty(response.data.warranty)
      } else {
        toast.error('Warranty not found')
        router.push('/admin/warranties')
      }
    } catch (error) {
      toast.error('An error occurred while fetching warranty')
      console.error('Error fetching warranty:', error)
      router.push('/admin/warranties')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this warranty?")) {
      try {
        const response = await warrantyApi.deleteWarranty(warrantyId)
        if (response.error) {
          toast.error('Failed to delete warranty: ' + response.error)
          return
        }
        toast.success('Warranty deleted successfully')
        router.push('/admin/warranties')
      } catch (error) {
        toast.error('An error occurred while deleting the warranty')
        console.error('Error deleting warranty:', error)
      }
    }
  }
  
  if (isLoading || authLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-4 border-amber-800 border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  if (!warranty) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-amber-900">Warranty not found</h2>
          <p className="mt-2 text-amber-800">The warranty you're looking for doesn't exist.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/warranties" className="flex items-center text-amber-800 hover:text-amber-600 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Warranties
        </Link>
      </div>
      
      <Card className="max-w-4xl mx-auto border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100">
        <CardHeader className="border-b-4 border-amber-800 bg-amber-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-3xl font-bold text-[rgb(146,64,14)] font-mono tracking-tight">
                {warranty.product?.name || 'Unknown Product'}
              </CardTitle>
              <CardDescription className="text-amber-800 font-medium">
                {warranty.product?.manufacturer || 'Unknown Manufacturer'} • {warranty.warrantyProvider}
              </CardDescription>
            </div>
            <div>
              {getStatusBadge(warranty.status)}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="mb-4 p-3 bg-amber-200 border-2 border-amber-300 rounded-md">
            <h3 className="text-lg font-semibold text-amber-900 mb-2 flex items-center">
              <User className="mr-2 h-5 w-5" />
              User Information
            </h3>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
              <div>
                <span className="text-amber-700">Name:</span>{" "}
                <span className="text-amber-900 font-medium">
                  {warranty.user?.name || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-amber-700">Email:</span>{" "}
                <span className="text-amber-900 font-medium">
                  {warranty.user?.email || 'N/A'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-amber-900 mb-2">Warranty Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-amber-700">Purchase Date:</span>
                    <span className="text-amber-900 font-medium">{new Date(warranty.purchaseDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-700">Expiration Date:</span>
                    <span className="text-amber-900 font-medium">{new Date(warranty.expirationDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-700">Warranty Number:</span>
                    <span className="text-amber-900 font-medium">{warranty.warrantyNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-700">Warranty Provider:</span>
                    <span className="text-amber-900 font-medium">{warranty.warrantyProvider}</span>
                  </div>
                </div>
              </div>
              
              <Separator className="bg-amber-300" />
              
              <div>
                <h3 className="text-lg font-semibold text-amber-900 mb-2">Coverage Details</h3>
                <p className="text-amber-900">{warranty.coverageDetails}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-amber-900 mb-2">Documents</h3>
                {warranty.documents.length > 0 ? (
                  <div className="space-y-2">
                    {warranty.documents.map((doc) => (
                      <div key={`${doc.name}-${doc.path}`} className="flex justify-between items-center">
                        <span className="text-amber-900">{doc.name}</span>
                        <Link 
                          href={doc.path} 
                          target="_blank" 
                          className="text-amber-700 hover:text-amber-900"
                        >
                          View Document
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-amber-700">No documents attached</p>
                )}
              </div>
              
              <Separator className="bg-amber-300" />
              
              {warranty.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-amber-900 mb-2">Notes</h3>
                  <p className="text-amber-900 whitespace-pre-wrap">{warranty.notes}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="bg-amber-200 border-t-4 border-amber-800 px-6 py-4 flex justify-between">
          <Button 
            variant="destructive" 
            className="bg-red-600 hover:bg-red-700 text-white border-2 border-red-800"
            onClick={handleDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Warranty
          </Button>
          
          <Link href={`/admin/warranties/${warranty.id}/edit`}>
            <Button className="bg-amber-800 hover:bg-amber-900 text-amber-100 border-2 border-amber-900">
              <Edit className="mr-2 h-4 w-4" />
              Edit Warranty
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function AdminWarrantyDetailsPage({ params }: PageProps) {
  const resolvedParams = React.use(params)
  const warrantyId = resolvedParams?.id
  
  if (!warrantyId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-amber-900">Invalid Warranty ID</h2>
          <p className="mt-2 text-amber-800">No warranty ID was provided.</p>
          <Link href="/admin/warranties" className="mt-4 inline-flex items-center text-amber-800 hover:text-amber-600">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Warranties
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <Suspense fallback={
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-4 border-amber-800 border-t-transparent rounded-full" />
        </div>
      </div>
    }>
      <WarrantyDetails warrantyId={warrantyId} />
    </Suspense>
  )
}
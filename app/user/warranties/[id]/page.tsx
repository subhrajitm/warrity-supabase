"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Edit, 
  Trash2,
  Package,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Receipt,
  Store,
  FileText,
  Phone
} from "lucide-react"
import WarrantySidebar from "../components/sidebar"
import { useAuth } from "@/lib/auth-context"
import { Warranty } from "@/types/warranty"
import { warrantyApi } from "@/lib/api"

export default function WarrantyDetailPage() {
  const router = useRouter()
  const params = useParams() as { id: string }
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [warranty, setWarranty] = useState<Warranty | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Fetch warranty details from API
  const fetchWarrantyDetails = async (id: string) => {
    try {
      setIsLoading(true)
      
      // Use the warrantyApi utility which handles authentication automatically
      const response = await warrantyApi.getWarrantyById(id)
      
      if (response.error) {
        console.error('Error fetching warranty details:', response.error)
        setError(response.error)
        return null
      }
      
      // The response data might be the warranty object directly or nested in a property
      const warrantyData = response.data?.warranty || response.data
      
      if (!warrantyData) {
        throw new Error('Warranty not found')
      }
      
      // Ensure we return a properly typed Warranty object
      const warranty: Warranty = warrantyData as Warranty
      return warranty
    } catch (err) {
      console.error('Error fetching warranty details:', err)
      setError('Failed to load warranty details. Please try again later.')
      return null
    } finally {
      setIsLoading(false)
    }
  }
  
  // Check if user is logged in and fetch data
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.replace('/login')
      } else if (user?.role !== 'user') {
        router.replace(user?.role === 'admin' ? '/admin' : '/login')
      } else {
        // Fetch warranty details from API
        fetchWarrantyDetails(params.id).then(data => {
          setWarranty(data)
        })
      }
    }
  }, [router, params, authLoading, isAuthenticated, user])
  
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this warranty? This action cannot be undone.")) {
      try {
        setIsLoading(true)
        
        // Make sure we have a valid ID
        const warrantyId = warranty?._id || warranty?.id || params.id;
        if (!warrantyId) {
          setError("Invalid warranty ID");
          setIsLoading(false);
          return;
        }
        
        // Use the warrantyApi utility which handles authentication automatically
        const response = await warrantyApi.deleteWarranty(warrantyId)
        
        if (response.error) {
          console.error('Error deleting warranty:', response.error)
          setError(response.error)
          setIsLoading(false)
          return
        }
        
        // Redirect to warranties list
        router.push('/user/warranties')
      } catch (err) {
        console.error('Error deleting warranty:', err)
        setError('Failed to delete warranty. Please try again later.')
        setIsLoading(false)
      }
    }
  }
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case "active":
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="mr-1 h-3 w-3" />
            Active
          </Badge>
        )
      case "expiring":
        return (
          <Badge className="bg-amber-500 text-white">
            <Clock className="mr-1 h-3 w-3" />
            Expiring Soon
          </Badge>
        )
      case "expired":
        return (
          <Badge className="bg-red-500 text-white">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Expired
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-amber-50">
        <WarrantySidebar />
        <div className="flex-1 p-6 ml-64 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-amber-800 border-t-transparent rounded-full"></div>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex min-h-screen bg-amber-50">
        <WarrantySidebar />
        <div className="flex-1 p-6 ml-64">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-amber-900 mb-4">Error</h1>
            <p className="text-amber-800 mb-6">{error}</p>
            <div className="flex justify-center space-x-4">
              <Button 
                onClick={() => fetchWarrantyDetails(params.id).then(data => {
                  setWarranty(data)
                  setError(null)
                })}
                className="bg-amber-800 hover:bg-amber-900 text-amber-100 border-2 border-amber-900"
              >
                Try Again
              </Button>
              <Link href="/user/warranties">
                <Button className="bg-amber-800 hover:bg-amber-900 text-amber-100 border-2 border-amber-900">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Warranties
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  if (!warranty) {
    return (
      <div className="flex min-h-screen bg-amber-50">
        <WarrantySidebar />
        <div className="flex-1 p-6 ml-64">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-amber-900 mb-4">Warranty Not Found</h1>
            <p className="text-amber-800 mb-6">The warranty you're looking for doesn't exist or you don't have permission to view it.</p>
            <Link href="/user/warranties">
              <Button className="bg-amber-800 hover:bg-amber-900 text-amber-100 border-2 border-amber-900">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Warranties
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex min-h-screen bg-amber-50">
      <WarrantySidebar />
      
      <div className="flex-1 p-6 ml-64">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link href="/user/warranties" className="flex items-center text-amber-800 hover:text-amber-600 transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Warranties
            </Link>
          </div>
          
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-amber-900">{warranty.product.name}</h1>
            <div className="flex space-x-2">
              <Link href={`/user/warranties/${warranty._id || warranty.id}/edit`}>
                <Button className="bg-amber-800 hover:bg-amber-900 text-amber-100 border-2 border-amber-900">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="border-2 border-red-800 text-red-800 hover:bg-red-100"
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 mb-6">
            <Card className="border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100">
              <CardHeader className="border-b-4 border-amber-800 bg-amber-200 px-6 py-4">
                <CardTitle className="text-xl font-bold text-amber-900">
                  Product Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-amber-800 font-medium">Product:</span>
                  <span className="text-amber-900">{warranty.product.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-800 font-medium">Category:</span>
                  <Badge className="bg-amber-800">{warranty.product.manufacturer}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-800 font-medium">Status:</span>
                  {getStatusBadge(warranty.status)}
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100">
              <CardHeader className="border-b-4 border-amber-800 bg-amber-200 px-6 py-4">
                <CardTitle className="text-xl font-bold text-amber-900">
                  Warranty Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-amber-800 font-medium">Provider:</span>
                  <span className="text-amber-900">{warranty.warrantyProvider}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-800 font-medium">Purchase Date:</span>
                  <div className="flex items-center text-amber-900">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(warranty.purchaseDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-800 font-medium">Expiry Date:</span>
                  <div className="flex items-center text-amber-900">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(warranty.expirationDate).toLocaleDateString()}
                  </div>
                </div>
                {warranty.warrantyNumber && (
                  <div className="flex justify-between">
                    <span className="text-amber-800 font-medium">Warranty Number:</span>
                    <span className="text-amber-900">{warranty.warrantyNumber}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {warranty.documents && warranty.documents.length > 0 && (
            <Card className="border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100 mb-6">
              <CardHeader className="border-b-4 border-amber-800 bg-amber-200 px-6 py-4">
                <CardTitle className="text-xl font-bold text-amber-900">
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {warranty.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border-2 border-amber-800 rounded-lg bg-amber-50">
                    <div className="flex items-center">
                      <FileText className="h-6 w-6 text-amber-800 mr-3" />
                      <span className="text-amber-900">{doc.name}</span>
                    </div>
                    <a href={doc.path} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" className="bg-amber-800 hover:bg-amber-900 text-amber-100">
                        View
                      </Button>
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          
          {warranty.coverageDetails && (
            <Card className="border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100 mb-6">
              <CardHeader className="border-b-4 border-amber-800 bg-amber-200 px-6 py-4">
                <CardTitle className="text-xl font-bold text-amber-900">
                  Coverage Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-amber-900 whitespace-pre-line">
                  {warranty.coverageDetails}
                </p>
              </CardContent>
            </Card>
          )}
          
          {warranty.notes && (
            <Card className="border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100">
              <CardHeader className="border-b-4 border-amber-800 bg-amber-200 px-6 py-4">
                <CardTitle className="text-xl font-bold text-amber-900">
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-amber-900 whitespace-pre-line">
                  {warranty.notes || "No notes added."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  CreditCard,
  FileText,
  User,
  Shield,
  CheckCircle,
  AlertTriangle
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { adminApi } from "@/lib/api";
import { toast } from "sonner";

// Mock user data
const mockUser = {
  id: 2,
  name: "Jane Smith",
  email: "jane.smith@example.com",
  phone: "+1 (555) 987-6543",
  address: "456 Maple Avenue, Springfield, IL 62704",
  role: "user",
  status: "active",
  createdAt: "2023-03-15T14:30:00Z",
  lastLogin: "2023-10-28T09:45:00Z",
  profileImage: "/images/avatars/jane-smith.jpg",
  products: [
    {
      id: 3,
      name: "MacBook Pro 16\"",
      category: "Electronics",
      purchaseDate: "2022-08-05",
      warrantyEndDate: "2023-08-05"
    },
    {
      id: 7,
      name: "Samsung 65\" QLED TV",
      category: "Electronics",
      purchaseDate: "2023-01-20",
      warrantyEndDate: "2025-01-20"
    }
  ],
  warranties: [
    {
      id: 4,
      product: "MacBook Pro 16\"",
      provider: "Apple",
      startDate: "2022-08-05",
      endDate: "2023-08-05",
      status: "expired"
    },
    {
      id: 8,
      product: "Samsung 65\" QLED TV",
      provider: "Samsung",
      startDate: "2023-01-20",
      endDate: "2025-01-20",
      status: "active"
    },
    {
      id: 12,
      product: "Samsung 65\" QLED TV",
      provider: "Extended Warranty Co.",
      startDate: "2025-01-21",
      endDate: "2027-01-20",
      status: "pending"
    }
  ],
  paymentMethods: [
    {
      id: 1,
      type: "Credit Card",
      last4: "4242",
      expiry: "05/25",
      isDefault: true
    },
    {
      id: 2,
      type: "PayPal",
      email: "jane.smith@example.com",
      isDefault: false
    }
  ]
}

// Update the UserData interface to match the actual data structure
interface UserData {
  id: number;
  _id?: string; // Add MongoDB ID support
  name: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  status: string;
  createdAt: string; // Changed from joinDate
  lastLogin: string; // Changed from lastActive
  profileImage: string;
  products: Array<{
    id: number;
    name: string;
    category: string;
    purchaseDate: string;
    warrantyEndDate: string;
  }>;
  warranties: Array<{
    id: number;
    product: string;
    provider: string;
    startDate: string;
    endDate: string;
    status: string;
  }>;
  paymentMethods: Array<{
    id: number;
    type: string;
    last4?: string;
    expiry?: string;
    email?: string;
    isDefault: boolean;
  }>;
}

interface Params {
  id: string;
}

export default function AdminUserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth()
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  
  // Function to fetch user details - moved inside component
  const fetchUserDetails = async () => {
    try {
      setIsLoading(true);
      
      const response = await adminApi.getUserById(userId);
      if (response.error) {
        toast.error('Failed to fetch user: ' + response.error);
        setIsLoading(false);
        return;
      }
      
      setUser(response.data.user);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error('An error occurred while fetching user details');
      setIsLoading(false);
    }
  }
  
  // Check if admin is logged in and fetch user data
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.replace('/login')
      } else if (authUser?.role !== 'admin') {
        router.replace(authUser?.role === 'user' ? '/user' : '/login')
      } else {
        fetchUserDetails()
      }
    }
  }, [router, userId, authLoading, isAuthenticated, authUser])
  
  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200">
            <Shield className="w-3.5 h-3.5 mr-1" />
            Admin
          </Badge>
        )
      case 'user':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200">
            User
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200">
            {role}
          </Badge>
        )
    }
  }
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300 hover:bg-green-200">
            Active
          </Badge>
        )
      case 'inactive':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300 hover:bg-red-200">
            Inactive
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200">
            Pending
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200">
            {status}
          </Badge>
        )
    }
  }
  
  const getWarrantyStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300 hover:bg-green-200">
            Active
          </Badge>
        )
      case 'expired':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300 hover:bg-red-200">
            Expired
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200">
            Pending
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200">
            {status}
          </Badge>
        )
    }
  }
  
  const handleDelete = () => {
    console.log(`Deleting user with ID: ${userId}`)
    // In a real app, you would send a delete request to your backend
    
    // Redirect to users list
    router.push('/admin/users')
  }
  
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-amber-800 text-xl">Loading user details...</p>
      </div>
    )
  }
  
  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/users" className="flex items-center text-amber-800 hover:text-amber-600 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Link>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <Card className="border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100 md:w-1/3">
          <CardHeader className="border-b-4 border-amber-800 bg-amber-200 px-6 py-4">
            <CardTitle className="text-2xl font-bold text-amber-900">
              User Profile
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="flex flex-col items-center mb-6">
              <div className="w-32 h-32 rounded-full bg-amber-200 flex items-center justify-center mb-4 border-4 border-amber-800">
                <span className="text-4xl font-bold text-amber-800">
                  {user?.name ? user.name.charAt(0) : '?'}
                </span>
              </div>
              
              <h2 className="text-2xl font-bold text-amber-900">{user?.name || 'Loading...'}</h2>
              <div className="mt-2">{getRoleBadge(user?.role || 'user')}</div>
              <div className="mt-2">{getStatusBadge(user?.status || 'pending')}</div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <Mail className="w-5 h-5 text-amber-800 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-amber-700">Email</h3>
                  <p className="text-amber-900">{user.email}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Phone className="w-5 h-5 text-amber-800 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-amber-700">Phone</h3>
                  <p className="text-amber-900">{user.phone}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-amber-800 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-amber-700">Address</h3>
                  <p className="text-amber-900">{user.address}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Calendar className="w-5 h-5 text-amber-800 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-amber-700">Member Since</h3>
                  <p className="text-amber-900">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Calendar className="w-5 h-5 text-amber-800 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-amber-700">Last Login</h3>
                  <p className="text-amber-900">{new Date(user.lastLogin).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex flex-col space-y-3">
              <Link href={`/admin/users/${userId}/edit`}>
                <Button className="w-full bg-amber-800 hover:bg-amber-900 text-amber-100 border-2 border-amber-900">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit User
                </Button>
              </Link>
              
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full border-2 border-red-800 text-red-800 hover:bg-red-100">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete User
                  </Button>
                </DialogTrigger>
                <DialogContent className="border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-amber-900">Confirm Deletion</DialogTitle>
                    <DialogDescription className="text-amber-800">
                      Are you sure you want to delete this user? This action cannot be undone.
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
                      Delete User
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
        
        <div className="md:w-2/3">
          <Tabs defaultValue="products" className="w-full">
            <TabsList className="bg-amber-200 border-4 border-amber-800 mb-6 p-1">
              <TabsTrigger 
                value="products" 
                className="data-[state=active]:bg-amber-800 data-[state=active]:text-amber-100 text-amber-900"
              >
                <FileText className="w-4 h-4 mr-2" />
                Products
              </TabsTrigger>
              <TabsTrigger 
                value="warranties" 
                className="data-[state=active]:bg-amber-800 data-[state=active]:text-amber-100 text-amber-900"
              >
                <Shield className="w-4 h-4 mr-2" />
                Warranties
              </TabsTrigger>
              <TabsTrigger 
                value="payment" 
                className="data-[state=active]:bg-amber-800 data-[state=active]:text-amber-100 text-amber-900"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Payment Methods
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="products">
              <Card className="border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100">
                <CardHeader className="border-b-4 border-amber-800 bg-amber-200 px-6 py-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-2xl font-bold text-amber-900">
                      User Products
                    </CardTitle>
                    <Link href={`/admin/products/add?userId=${userId}`}>
                      <Button className="bg-amber-800 hover:bg-amber-900 text-amber-100 border-2 border-amber-900">
                        Add Product
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  {user.products && user.products.length > 0 ? (
                    <div className="space-y-4">
                      {user.products.map((product) => (
                        <Card key={product.id} className="border-2 border-amber-300 bg-amber-50">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="text-lg font-semibold text-amber-900">{product.name}</h3>
                                <p className="text-amber-700">{product.category}</p>
                                <div className="flex space-x-4 mt-1">
                                  <p className="text-sm text-amber-700">
                                    <span className="font-medium">Purchased:</span> {product.purchaseDate}
                                  </p>
                                  <p className="text-sm text-amber-700">
                                    <span className="font-medium">Warranty Until:</span> {product.warrantyEndDate}
                                  </p>
                                </div>
                              </div>
                              <Link href={`/admin/products/${product.id}`}>
                                <Button variant="outline" className="border-2 border-amber-800 text-amber-800">
                                  View
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-amber-800 mb-4">This user has no registered products.</p>
                      <Link href={`/admin/products/add?userId=${userId}`}>
                        <Button className="bg-amber-800 hover:bg-amber-900 text-amber-100 border-2 border-amber-900">
                          Add First Product
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="warranties">
              <Card className="border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100">
                <CardHeader className="border-b-4 border-amber-800 bg-amber-200 px-6 py-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-2xl font-bold text-amber-900">
                      User Warranties
                    </CardTitle>
                    <Link href={`/admin/warranties/add?userId=${userId}`}>
                      <Button className="bg-amber-800 hover:bg-amber-900 text-amber-100 border-2 border-amber-900">
                        Add Warranty
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  {user.warranties && user.warranties.length > 0 ? (
                    <div className="space-y-4">
                      {user.warranties.map((warranty) => (
                        <Card key={warranty.id} className="border-2 border-amber-300 bg-amber-50">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="flex items-center">
                                  <h3 className="text-lg font-semibold text-amber-900 mr-3">{warranty.product}</h3>
                                  {getWarrantyStatusBadge(warranty.status)}
                                </div>
                                <p className="text-amber-700">{warranty.provider}</p>
                                <div className="flex space-x-4 mt-1">
                                  <p className="text-sm text-amber-700">
                                    <span className="font-medium">Start:</span> {warranty.startDate}
                                  </p>
                                  <p className="text-sm text-amber-700">
                                    <span className="font-medium">End:</span> {warranty.endDate}
                                  </p>
                                </div>
                              </div>
                              <Link href={`/admin/warranties/${warranty.id}`}>
                                <Button variant="outline" className="border-2 border-amber-800 text-amber-800">
                                  View
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-amber-800 mb-4">This user has no registered warranties.</p>
                      <Link href={`/admin/warranties/add?userId=${userId}`}>
                        <Button className="bg-amber-800 hover:bg-amber-900 text-amber-100 border-2 border-amber-900">
                          Add First Warranty
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="payment">
              <Card className="border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100">
                <CardHeader className="border-b-4 border-amber-800 bg-amber-200 px-6 py-4">
                  <CardTitle className="text-2xl font-bold text-amber-900">
                    Payment Methods
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-6">
                  {user.paymentMethods && user.paymentMethods.length > 0 ? (
                    <div className="space-y-4">
                      {user.paymentMethods.map((method) => (
                        <Card key={method.id} className="border-2 border-amber-300 bg-amber-50">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="flex items-center">
                                  <h3 className="text-lg font-semibold text-amber-900 mr-3">{method.type}</h3>
                                  {method.isDefault && (
                                    <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                                      Default
                                    </Badge>
                                  )}
                                </div>
                                {method.type === "Credit Card" ? (
                                  <div className="flex space-x-4 mt-1">
                                    <p className="text-sm text-amber-700">
                                      <span className="font-medium">Card ending in:</span> {method.last4}
                                    </p>
                                    <p className="text-sm text-amber-700">
                                      <span className="font-medium">Expires:</span> {method.expiry}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-amber-700 mt-1">{method.email}</p>
                                )}
                              </div>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm" className="border-2 border-amber-800 text-amber-800">
                                  Edit
                                </Button>
                                <Button variant="outline" size="sm" className="border-2 border-red-800 text-red-800">
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-amber-800">No payment methods found.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
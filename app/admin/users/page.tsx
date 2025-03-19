"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  PlusCircle, 
  Search, 
  Edit, 
  Trash2,
  User,
  SortAsc,
  SortDesc,
  Mail,
  Calendar,
  Shield,
  FileText // Add this import for the view icon
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { adminApi } from "@/lib/api"
import { toast } from "sonner"

// Define User interface
// Update the UserData interface to include _id
interface UserData {
  _id?: string; // Add this for MongoDB documents
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  joinDate: string;
  warranties: number;
}

// Mock data for demonstration
const mockUsers: UserData[] = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    role: "user",
    status: "active",
    joinDate: "2023-01-15",
    warranties: 5
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane.smith@example.com",
    role: "user",
    status: "active",
    joinDate: "2023-02-20",
    warranties: 3
  },
  {
    id: 3,
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
    status: "active",
    joinDate: "2022-12-01",
    warranties: 0
  },
  {
    id: 4,
    name: "Bob Johnson",
    email: "bob.johnson@example.com",
    role: "user",
    status: "inactive",
    joinDate: "2023-03-10",
    warranties: 2
  },
  {
    id: 5,
    name: "Alice Williams",
    email: "alice.williams@example.com",
    role: "user",
    status: "active",
    joinDate: "2023-04-05",
    warranties: 7
  }
]

export default function AdminUsersPage() {
  const router = useRouter()
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth()
  const [users, setUsers] = useState<UserData[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<keyof UserData>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  
  // Check if admin is logged in and fetch users
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.replace('/login')
      } else if (authUser?.role !== 'admin') {
        router.replace(authUser?.role === 'user' ? '/user' : '/login')
      } else {
        fetchUsers()
      }
    }
  }, [router, authLoading, isAuthenticated, authUser])
  
  // Function to fetch users
  const fetchUsers = async () => {
    try {
      const response = await adminApi.getAllUsers()
      if (response.error) {
        toast.error('Failed to fetch users: ' + response.error)
        return
      }
      if (response.data?.users) {
        // Admin API returns array of users
        const userList = response.data.users
        
        // Debug: Check if any users are missing IDs
        const missingIds = userList.filter(u => !u._id)
        if (missingIds.length > 0) {
          console.warn('Some users are missing _id:', missingIds)
        }
        
        setUsers(userList)
      }
    } catch (error) {
      toast.error('An error occurred while fetching users')
      console.error('Error fetching users:', error)
    }
  }
  
  // Filter and sort users
  useEffect(() => {
    let filtered = [...users]
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      )
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]
      
      // Handle date fields
      if (sortField === 'joinDate') {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }
      
      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1
      }
      return 0
    })
    
    setFilteredUsers(filtered)
  }, [users, searchQuery, sortField, sortDirection])
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }
  
  const handleSortChange = (field: keyof UserData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }
  
  const handleDelete = (id: string | number) => {
    if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      // In a real app, you would send a delete request to your backend
      console.log(`Deleting user with ID: ${id}`)
      
      // Update local state - handle both id and _id cases
      setUsers(users.filter(user => (user._id || user.id) !== id))
    }
  }
  
  const getSortIcon = (field: keyof UserData) => {
    if (sortField !== field) return null
    
    return sortDirection === 'asc' 
      ? <SortAsc className="h-4 w-4 ml-1" /> 
      : <SortDesc className="h-4 w-4 ml-1" />
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            Active
          </Badge>
        )
      case 'inactive':
        return (
          <Badge className="bg-gray-500 hover:bg-gray-600">
            Inactive
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }
  
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <Badge className="bg-amber-800 hover:bg-amber-900">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        )
      case 'user':
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">
            <User className="h-3 w-3 mr-1" />
            User
          </Badge>
        )
      default:
        return <Badge>{role}</Badge>
    }
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link href="/admin" className="flex items-center text-amber-800 hover:text-amber-600 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-amber-900">Manage Users</h1>
        <Link href="/admin/users/add">
          <Button className="bg-amber-800 hover:bg-amber-900 text-amber-100 border-2 border-amber-900">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </Link>
      </div>
      
      <Card className="border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100 mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-amber-800" />
            <Input
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 border-2 border-amber-800 bg-amber-50"
            />
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100">
        <CardHeader className="border-b-4 border-amber-800 bg-amber-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-bold text-amber-900">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'User' : 'Users'}
            </CardTitle>
            <div className="flex items-center text-sm text-amber-800">
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
                onClick={() => handleSortChange('joinDate')}
              >
                Join Date {getSortIcon('joinDate')}
              </button>
              <span className="mx-2">|</span>
              <button 
                className="flex items-center font-medium hover:text-amber-600"
                onClick={() => handleSortChange('warranties')}
              >
                Warranties {getSortIcon('warranties')}
              </button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-amber-800 mx-auto mb-4 opacity-50" />
              <p className="text-amber-800 text-lg mb-2">No users found</p>
              <p className="text-amber-700 mb-6">
                {searchQuery 
                  ? "Try adjusting your search" 
                  : "Add your first user to get started"}
              </p>
              
              <Link href="/admin/users/add">
                <Button className="bg-amber-800 hover:bg-amber-900 text-amber-100 border-2 border-amber-900">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-amber-800">
                    <th className="text-left py-3 px-4 text-amber-900">Name</th>
                    <th className="text-left py-3 px-4 text-amber-900">Email</th>
                    <th className="text-left py-3 px-4 text-amber-900">Role</th>
                    <th className="text-left py-3 px-4 text-amber-900">Status</th>
                    <th className="text-left py-3 px-4 text-amber-900">Join Date</th>
                    <th className="text-left py-3 px-4 text-amber-900">Warranties</th>
                    <th className="text-right py-3 px-4 text-amber-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user._id || user.id} className="border-b border-amber-300 hover:bg-amber-50">
                      <td className="py-3 px-4 text-amber-900 font-medium">{user.name}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center text-amber-800">
                          <Mail className="h-4 w-4 mr-2" />
                          {user.email}
                        </div>
                      </td>
                      <td className="py-3 px-4">{getRoleBadge(user.role)}</td>
                      <td className="py-3 px-4">{getStatusBadge(user.status)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center text-amber-800">
                          <Calendar className="h-4 w-4 mr-2" />
                          {user.joinDate}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-amber-800">{user.warranties}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end space-x-2">
                          {/* Add View Details button */}
                          <Link href={`/admin/users/${user._id || user.id}`}>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-2 border-amber-800 text-amber-800 h-8 px-2"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/admin/users/${user._id || user.id}/edit`}>
                            <Button size="sm" variant="outline" className="border-2 border-amber-800 text-amber-800 h-8 px-2">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-2 border-red-800 text-red-800 h-8 px-2 hover:bg-red-100"
                            onClick={() => handleDelete(user._id || user.id)}
                            disabled={user.role === 'admin'} // Prevent deleting admin users
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
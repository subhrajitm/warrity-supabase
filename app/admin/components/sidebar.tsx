"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { 
  Package, 
  Users, 
  BarChart3, 
  Settings,
  Home,
  LogOut,
  FileText,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  List,
  UserPlus,
  UserCog,
  BarChart,
  PieChart,
  LineChart,
  Cog,
  Bell,
  Shield,
  History
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function AdminSidebar() {
  const pathname = usePathname()
  const [activeLink, setActiveLink] = useState("")
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    products: false,
    warranties: false,
    users: false,
    analytics: false,
    settings: false
  })
  
  const { logout } = useAuth()
  
  useEffect(() => {
    setActiveLink(pathname || "")
    
    // Auto-expand the section based on current path
    if (pathname?.startsWith('/admin/products')) {
      setOpenSections(prev => ({ ...prev, products: true }))
    } else if (pathname?.startsWith('/admin/warranties')) {
      setOpenSections(prev => ({ ...prev, warranties: true }))
    } else if (pathname?.startsWith('/admin/users')) {
      setOpenSections(prev => ({ ...prev, users: true }))
    } else if (pathname?.startsWith('/admin/analytics')) {
      setOpenSections(prev => ({ ...prev, analytics: true }))
    } else if (pathname?.startsWith('/admin/settings')) {
      setOpenSections(prev => ({ ...prev, settings: true }))
    }
  }, [pathname])
  
  const isActive = (path: string): boolean => {
    return pathname === path
  }
  
  const isActiveSection = (section: string): boolean => {
    return pathname?.startsWith(`/admin/${section}`) || false
  }
  
  const toggleSection = (section: string): void => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }
  
  const handleLogout = async (): Promise<void> => {
    await logout()
  }
  
  return (
    <div className="h-screen bg-amber-800 text-amber-100 p-6 flex flex-col overflow-hidden shadow-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-mono tracking-tight">Warrity</h1>
        <p className="text-amber-200 text-sm mt-1">Admin Panel</p>
      </div>
      
      <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
        <Link href="/admin">
          <Button 
            variant="ghost" 
            className={`w-full justify-start ${isActive('/admin') ? 'bg-amber-900 text-amber-50' : 'text-amber-100 hover:bg-amber-700'}`}
          >
            <Home className="mr-2 h-5 w-5" />
            Dashboard
          </Button>
        </Link>
        
        {/* Products Section */}
        <Collapsible 
          open={openSections.products} 
          onOpenChange={() => toggleSection('products')}
          className={`${isActiveSection('products') ? 'bg-amber-900/50 rounded-md' : ''}`}
        >
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className={`w-full justify-between ${isActiveSection('products') ? 'text-amber-50' : 'text-amber-100 hover:bg-amber-700'}`}
            >
              <div className="flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Products
              </div>
              {openSections.products ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-7 space-y-1 pt-1">
            <Link href="/admin/products">
              <Button 
                variant="ghost" 
                size="sm"
                className={`w-full justify-start ${isActive('/admin/products') ? 'bg-amber-900 text-amber-50' : 'text-amber-100 hover:bg-amber-700'}`}
              >
                <List className="mr-2 h-4 w-4" />
                All Products
              </Button>
            </Link>
            <Link href="/admin/products/add">
              <Button 
                variant="ghost" 
                size="sm"
                className={`w-full justify-start ${isActive('/admin/products/add') ? 'bg-amber-900 text-amber-50' : 'text-amber-100 hover:bg-amber-700'}`}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </Link>
          </CollapsibleContent>
        </Collapsible>
        
        {/* Warranties Section */}
        <Collapsible 
          open={openSections.warranties} 
          onOpenChange={() => toggleSection('warranties')}
          className={`${isActiveSection('warranties') ? 'bg-amber-900/50 rounded-md' : ''}`}
        >
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className={`w-full justify-between ${isActiveSection('warranties') ? 'text-amber-50' : 'text-amber-100 hover:bg-amber-700'}`}
            >
              <div className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Warranties
              </div>
              {openSections.warranties ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-7 space-y-1 pt-1">
            <Link href="/admin/warranties">
              <Button 
                variant="ghost" 
                size="sm"
                className={`w-full justify-start ${isActive('/admin/warranties') ? 'bg-amber-900 text-amber-50' : 'text-amber-100 hover:bg-amber-700'}`}
              >
                <List className="mr-2 h-4 w-4" />
                All Warranties
              </Button>
            </Link>
            <Link href="/admin/warranties/expired">
              <Button 
                variant="ghost" 
                size="sm"
                className={`w-full justify-start ${isActive('/admin/warranties/expired') ? 'bg-amber-900 text-amber-50' : 'text-amber-100 hover:bg-amber-700'}`}
              >
                <Bell className="mr-2 h-4 w-4" />
                Expired Warranties
              </Button>
            </Link>
          </CollapsibleContent>
        </Collapsible>
        
        {/* Users Section */}
        <Collapsible 
          open={openSections.users} 
          onOpenChange={() => toggleSection('users')}
          className={`${isActiveSection('users') ? 'bg-amber-900/50 rounded-md' : ''}`}
        >
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className={`w-full justify-between ${isActiveSection('users') ? 'text-amber-50' : 'text-amber-100 hover:bg-amber-700'}`}
            >
              <div className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Users
              </div>
              {openSections.users ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-7 space-y-1 pt-1">
            <Link href="/admin/users">
              <Button 
                variant="ghost" 
                size="sm"
                className={`w-full justify-start ${isActive('/admin/users') ? 'bg-amber-900 text-amber-50' : 'text-amber-100 hover:bg-amber-700'}`}
              >
                <List className="mr-2 h-4 w-4" />
                All Users
              </Button>
            </Link>
            <Link href="/admin/users/add">
              <Button 
                variant="ghost" 
                size="sm"
                className={`w-full justify-start ${isActive('/admin/users/add') ? 'bg-amber-900 text-amber-50' : 'text-amber-100 hover:bg-amber-700'}`}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </Link>
            <Link href="/admin/users/roles">
              <Button 
                variant="ghost" 
                size="sm"
                className={`w-full justify-start ${isActive('/admin/users/roles') ? 'bg-amber-900 text-amber-50' : 'text-amber-100 hover:bg-amber-700'}`}
              >
                <UserCog className="mr-2 h-4 w-4" />
                Manage Roles
              </Button>
            </Link>
          </CollapsibleContent>
        </Collapsible>
        
        {/* Analytics Section */}
        <Collapsible 
          open={openSections.analytics} 
          onOpenChange={() => toggleSection('analytics')}
          className={`${isActiveSection('analytics') ? 'bg-amber-900/50 rounded-md' : ''}`}
        >
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className={`w-full justify-between ${isActiveSection('analytics') ? 'text-amber-50' : 'text-amber-100 hover:bg-amber-700'}`}
            >
              <div className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Analytics
              </div>
              {openSections.analytics ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-7 space-y-1 pt-1">
            <Link href="/admin/analytics">
              <Button 
                variant="ghost" 
                size="sm"
                className={`w-full justify-start ${isActive('/admin/analytics') ? 'bg-amber-900 text-amber-50' : 'text-amber-100 hover:bg-amber-700'}`}
              >
                <BarChart className="mr-2 h-4 w-4" />
                Overview
              </Button>
            </Link>
            <Link href="/admin/analytics/products">
              <Button 
                variant="ghost" 
                size="sm"
                className={`w-full justify-start ${isActive('/admin/analytics/products') ? 'bg-amber-900 text-amber-50' : 'text-amber-100 hover:bg-amber-700'}`}
              >
                <PieChart className="mr-2 h-4 w-4" />
                Product Analytics
              </Button>
            </Link>
            <Link href="/admin/analytics/users">
              <Button 
                variant="ghost" 
                size="sm"
                className={`w-full justify-start ${isActive('/admin/analytics/users') ? 'bg-amber-900 text-amber-50' : 'text-amber-100 hover:bg-amber-700'}`}
              >
                <LineChart className="mr-2 h-4 w-4" />
                User Analytics
              </Button>
            </Link>
            <Link href="/admin/logs">
              <Button 
                variant="ghost" 
                size="sm"
                className={`w-full justify-start ${isActive('/admin/logs') ? 'bg-amber-900 text-amber-50' : 'text-amber-100 hover:bg-amber-700'}`}
              >
                <History className="mr-2 h-4 w-4" />
                Admin Logs
              </Button>
            </Link>
          </CollapsibleContent>
        </Collapsible>
        
        {/* Settings Section */}
        <Collapsible 
          open={openSections.settings} 
          onOpenChange={() => toggleSection('settings')}
          className={`${isActiveSection('settings') ? 'bg-amber-900/50 rounded-md' : ''}`}
        >
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className={`w-full justify-between ${isActiveSection('settings') ? 'text-amber-50' : 'text-amber-100 hover:bg-amber-700'}`}
            >
              <div className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Settings
              </div>
              {openSections.settings ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-7 space-y-1 pt-1">
            <Link href="/admin/settings">
              <Button 
                variant="ghost" 
                size="sm"
                className={`w-full justify-start ${isActive('/admin/settings') ? 'bg-amber-900 text-amber-50' : 'text-amber-100 hover:bg-amber-700'}`}
              >
                <Cog className="mr-2 h-4 w-4" />
                General Settings
              </Button>
            </Link>
            <Link href="/admin/settings/notifications">
              <Button 
                variant="ghost" 
                size="sm"
                className={`w-full justify-start ${isActive('/admin/settings/notifications') ? 'bg-amber-900 text-amber-50' : 'text-amber-100 hover:bg-amber-700'}`}
              >
                <Bell className="mr-2 h-4 w-4" />
                Notification Settings
              </Button>
            </Link>
            <Link href="/admin/settings/security">
              <Button 
                variant="ghost" 
                size="sm"
                className={`w-full justify-start ${isActive('/admin/settings/security') ? 'bg-amber-900 text-amber-50' : 'text-amber-100 hover:bg-amber-700'}`}
              >
                <Shield className="mr-2 h-4 w-4" />
                Security Settings
              </Button>
            </Link>
          </CollapsibleContent>
        </Collapsible>
      </nav>
      
      <div className="mt-6 pt-6 border-t border-amber-700">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-amber-100 hover:bg-amber-700"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  )
}
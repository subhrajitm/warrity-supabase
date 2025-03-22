"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { adminApi } from "@/lib/api"
import { toast } from "react-hot-toast"
import { format } from "date-fns"
import { Download, Settings } from "lucide-react"

interface AdminLog {
  id: string
  adminId: {
    name: string
    email: string
  }
  action: string
  resourceType: string
  resourceId: string
  details: any
  ipAddress: string
  userAgent: string
  timestamp: string
}

interface ExportColumn {
  id: string
  label: string
  selected: boolean
}

export default function AdminLogsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [logs, setLogs] = useState<AdminLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    adminId: "",
    resourceType: "all",
    action: "all",
    startDate: "",
    endDate: "",
  })
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportColumns, setExportColumns] = useState<ExportColumn[]>([
    { id: "timestamp", label: "Timestamp", selected: true },
    { id: "adminName", label: "Admin Name", selected: true },
    { id: "adminEmail", label: "Admin Email", selected: true },
    { id: "action", label: "Action", selected: true },
    { id: "resourceType", label: "Resource Type", selected: true },
    { id: "resourceId", label: "Resource ID", selected: true },
    { id: "details", label: "Details", selected: true },
    { id: "ipAddress", label: "IP Address", selected: true },
    { id: "userAgent", label: "User Agent", selected: false },
  ])
  const [exportDateRange, setExportDateRange] = useState({
    startDate: "",
    endDate: "",
  })

  useEffect(() => {
    if (authLoading) return // Don't redirect while auth is loading

    if (!user || user.role !== "admin") {
      router.push("/login")
      return
    }

    fetchLogs()
  }, [user, authLoading, page, filters])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const response = await adminApi.getAdminLogs({
        ...filters,
        resourceType: filters.resourceType === "all" ? "" : filters.resourceType,
        action: filters.action === "all" ? "" : filters.action,
        page,
        limit: 20,
      })

      if (response.error) {
        toast.error("Failed to fetch admin logs")
        return
      }

      if (response.data) {
        setLogs(response.data.logs)
        setTotalPages(response.data.pagination.totalPages)
      }
    } catch (error) {
      console.error("Error fetching admin logs:", error)
      toast.error("An error occurred while fetching admin logs")
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1) // Reset to first page when filters change
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "create":
        return "text-green-600"
      case "update":
        return "text-blue-600"
      case "delete":
        return "text-red-600"
      case "status_change":
        return "text-yellow-600"
      case "role_change":
        return "text-purple-600"
      default:
        return "text-gray-600"
    }
  }

  const toggleExportColumn = (columnId: string) => {
    setExportColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, selected: !col.selected } : col
      )
    )
  }

  const exportLogs = async () => {
    try {
      setLoading(true)
      const response = await adminApi.getAdminLogs({
        ...filters,
        ...exportDateRange,
        limit: 1000, // Get more logs for export
      })

      if (response.error) {
        toast.error("Failed to export logs")
        return
      }

      if (!response.data?.logs) {
        toast.error("No logs to export")
        return
      }

      // Get selected columns
      const selectedColumns = exportColumns.filter((col) => col.selected)
      const headers = selectedColumns.map((col) => col.label)

      // Map log data to selected columns
      const csvRows = response.data.logs.map((log) => {
        const row: string[] = []
        selectedColumns.forEach((col) => {
          switch (col.id) {
            case "timestamp":
              row.push(format(new Date(log.timestamp), "PPpp"))
              break
            case "adminName":
              row.push(log.adminId.name)
              break
            case "adminEmail":
              row.push(log.adminId.email)
              break
            case "action":
              row.push(log.action)
              break
            case "resourceType":
              row.push(log.resourceType)
              break
            case "resourceId":
              row.push(log.resourceId)
              break
            case "details":
              row.push(JSON.stringify(log.details))
              break
            case "ipAddress":
              row.push(log.ipAddress)
              break
            case "userAgent":
              row.push(log.userAgent)
              break
          }
        })
        return row
      })

      // Create CSV content
      const csvContent = [
        headers.join(","),
        ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n")

      // Create and trigger download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute(
        "download",
        `admin-logs-${format(new Date(), "yyyy-MM-dd-HH-mm")}.csv`
      )
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success("Logs exported successfully")
      setExportDialogOpen(false)
    } catch (error) {
      console.error("Error exporting logs:", error)
      toast.error("An error occurred while exporting logs")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-amber-900">Admin Activity Logs</h1>
          <p className="text-amber-700">
            Monitor and track all administrative actions across the platform
          </p>
        </div>
        <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              disabled={loading}
              className="flex items-center gap-2 border-2 border-amber-800 text-amber-800"
            >
              <Download className="h-4 w-4" />
              Export Logs
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-amber-900">Export Logs</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-amber-900 font-medium">Date Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={exportDateRange.startDate}
                    onChange={(e) =>
                      setExportDateRange((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    className="border-2 border-amber-800 bg-amber-50"
                  />
                  <Input
                    type="date"
                    value={exportDateRange.endDate}
                    onChange={(e) =>
                      setExportDateRange((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    className="border-2 border-amber-800 bg-amber-50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-amber-900 font-medium">Select Columns</Label>
                <div className="grid grid-cols-2 gap-2">
                  {exportColumns.map((column) => (
                    <div key={column.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={column.id}
                        checked={column.selected}
                        onCheckedChange={() => toggleExportColumn(column.id)}
                      />
                      <Label htmlFor={column.id} className="text-amber-900">{column.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                onClick={exportLogs}
                disabled={loading}
                className="w-full bg-amber-800 hover:bg-amber-900 text-amber-100 border-2 border-amber-900"
              >
                {loading ? "Exporting..." : "Export"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100">
        <CardHeader className="border-b-4 border-amber-800 bg-amber-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold text-amber-900">Activity History</CardTitle>
              <p className="text-amber-700">
                View and filter administrative actions
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <Label className="text-amber-900 font-medium">Admin ID</Label>
              <Input
                placeholder="Search by admin ID"
                value={filters.adminId}
                onChange={(e) => handleFilterChange("adminId", e.target.value)}
                className="border-2 border-amber-800 bg-amber-50 w-full"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-amber-900 font-medium">Resource Type</Label>
              <Select
                value={filters.resourceType}
                onValueChange={(value) => handleFilterChange("resourceType", value)}
              >
                <SelectTrigger className="border-2 border-amber-800 bg-amber-50 w-full">
                  <SelectValue placeholder="Select resource type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="warranty">Warranty</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="settings">Settings</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-amber-900 font-medium">Action</Label>
              <Select
                value={filters.action}
                onValueChange={(value) => handleFilterChange("action", value)}
              >
                <SelectTrigger className="border-2 border-amber-800 bg-amber-50 w-full">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="status_change">Status Change</SelectItem>
                  <SelectItem value="role_change">Role Change</SelectItem>
                  <SelectItem value="settings_update">Settings Update</SelectItem>
                  <SelectItem value="system_config">System Config</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-amber-900 font-medium">Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange("startDate", e.target.value)}
                  className="border-2 border-amber-800 bg-amber-50 cursor-pointer hover:bg-amber-100 relative z-10 [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer w-full"
                />
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange("endDate", e.target.value)}
                  className="border-2 border-amber-800 bg-amber-50 cursor-pointer hover:bg-amber-100 relative z-10 [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer w-full"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-800"></div>
            </div>
          ) : (
            <>
              <div className="rounded-md border-2 border-amber-800">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-amber-200">
                      <TableHead className="text-amber-900 font-bold">Timestamp</TableHead>
                      <TableHead className="text-amber-900 font-bold">Admin</TableHead>
                      <TableHead className="text-amber-900 font-bold">Action</TableHead>
                      <TableHead className="text-amber-900 font-bold">Resource</TableHead>
                      <TableHead className="text-amber-900 font-bold">Details</TableHead>
                      <TableHead className="text-amber-900 font-bold">IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-amber-50">
                        <TableCell className="text-amber-900">
                          {format(new Date(log.timestamp), "PPpp")}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-amber-900 font-medium">{log.adminId.name}</span>
                            <span className="text-amber-700">
                              {log.adminId.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-amber-900 font-medium">{log.resourceType}</span>
                            <span className="text-amber-700">
                              ID: {log.resourceId}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <pre className="text-xs whitespace-pre-wrap bg-amber-50 p-2 rounded-md border border-amber-300">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </TableCell>
                        <TableCell className="text-amber-900">{log.ipAddress}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="text-amber-700">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="border-2 border-amber-800 text-amber-800"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="border-2 border-amber-800 text-amber-800"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 
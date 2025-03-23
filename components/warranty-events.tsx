"use client"

import React, { useState, useEffect } from "react"
import { CalendarClock, Plus, FileText, Trash2, ClipboardEdit } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

import { 
  getWarrantyEvents, 
  createEvent, 
  updateEvent, 
  deleteEvent,
  uploadEventDocument,
  subscribeToWarrantyEvents,
  type Event,
  type EventInput
} from "@/lib/services/event-service"

// Event types with corresponding colors
const EVENT_TYPES = [
  { value: "claim", label: "Warranty Claim", color: "bg-amber-500" },
  { value: "repair", label: "Repair", color: "bg-blue-500" },
  { value: "replacement", label: "Replacement", color: "bg-green-500" },
  { value: "extension", label: "Warranty Extension", color: "bg-purple-500" },
  { value: "expiration", label: "Warranty Expiration", color: "bg-red-500" },
  { value: "reminder", label: "Reminder", color: "bg-cyan-500" },
  { value: "note", label: "Note", color: "bg-gray-500" },
]

// Status options with corresponding colors
const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "bg-yellow-400" },
  { value: "in_progress", label: "In Progress", color: "bg-blue-400" },
  { value: "completed", label: "Completed", color: "bg-green-400" },
  { value: "denied", label: "Denied", color: "bg-red-400" },
  { value: "cancelled", label: "Cancelled", color: "bg-gray-400" },
]

interface WarrantyEventsProps {
  warrantyId: string
}

export function WarrantyEvents({ warrantyId }: WarrantyEventsProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [newEventData, setNewEventData] = useState<EventInput>({
    warranty_id: warrantyId,
    event_type: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    status: "pending",
    notes: "",
  })
  const [fileToUpload, setFileToUpload] = useState<File | null>(null)

  // Fetch events when component mounts
  useEffect(() => {
    fetchEvents()
    
    // Subscribe to events changes
    const subscription = subscribeToWarrantyEvents(warrantyId, () => {
      fetchEvents()
    })
    
    return () => {
      // Unsubscribe when component unmounts
      subscription.unsubscribe()
    }
  }, [warrantyId])

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const eventList = await getWarrantyEvents(warrantyId)
      setEvents(eventList)
    } catch (error) {
      console.error("Error fetching events:", error)
      toast.error("Failed to load events")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setNewEventData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setNewEventData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileToUpload(e.target.files[0])
    }
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Create the event
      const createdEvent = await createEvent(newEventData)
      
      if (createdEvent && fileToUpload) {
        // Upload document if a file was selected
        await uploadEventDocument(createdEvent.id, fileToUpload)
      }
      
      // Refresh events list
      await fetchEvents()
      
      // Reset form and close dialog
      setNewEventData({
        warranty_id: warrantyId,
        event_type: "",
        description: "",
        date: new Date().toISOString().split('T')[0],
        status: "pending",
        notes: "",
      })
      setFileToUpload(null)
      setIsAddDialogOpen(false)
      
      toast.success("Event created successfully")
    } catch (error) {
      console.error("Error creating event:", error)
      toast.error("Failed to create event")
    }
  }

  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEvent) return
    
    try {
      // Update the event
      await updateEvent(selectedEvent.id, newEventData)
      
      if (fileToUpload) {
        // Upload document if a file was selected
        await uploadEventDocument(selectedEvent.id, fileToUpload)
      }
      
      // Refresh events list
      await fetchEvents()
      
      // Reset form and close dialog
      setSelectedEvent(null)
      setFileToUpload(null)
      setIsEditDialogOpen(false)
      
      toast.success("Event updated successfully")
    } catch (error) {
      console.error("Error updating event:", error)
      toast.error("Failed to update event")
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      try {
        await deleteEvent(eventId)
        await fetchEvents()
        toast.success("Event deleted successfully")
      } catch (error) {
        console.error("Error deleting event:", error)
        toast.error("Failed to delete event")
      }
    }
  }

  const openEditDialog = (event: Event) => {
    setSelectedEvent(event)
    setNewEventData({
      warranty_id: event.warranty_id,
      event_type: event.event_type,
      description: event.description || "",
      date: event.date || new Date().toISOString().split('T')[0],
      status: event.status || "pending",
      notes: event.notes || "",
    })
    setIsEditDialogOpen(true)
  }

  // Helper function to get event type label
  const getEventTypeLabel = (type: string) => {
    return EVENT_TYPES.find(t => t.value === type)?.label || type
  }

  // Helper function to get event type color
  const getEventTypeColor = (type: string) => {
    return EVENT_TYPES.find(t => t.value === type)?.color || "bg-gray-500"
  }

  // Helper function to get status label
  const getStatusLabel = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status)?.label || status
  }

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status)?.color || "bg-gray-400"
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Warranty Events</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleCreateEvent}>
              <DialogHeader>
                <DialogTitle>Add Warranty Event</DialogTitle>
                <DialogDescription>
                  Record an event related to this warranty such as a claim, repair, or note.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event_type">Event Type</Label>
                    <Select 
                      onValueChange={(value) => handleSelectChange("event_type", value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input 
                      id="date" 
                      name="date" 
                      type="date" 
                      value={newEventData.date}
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="Brief description of the event"
                    value={newEventData.description}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      onValueChange={(value) => handleSelectChange("status", value)}
                      defaultValue="pending"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="document">Document (Optional)</Label>
                    <Input 
                      id="document" 
                      type="file" 
                      onChange={handleFileChange} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Additional notes"
                    value={newEventData.notes}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Event</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 border rounded-md bg-muted/20">
          <CalendarClock className="h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-center text-muted-foreground">No events recorded for this warranty</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setIsAddDialogOpen(true)}
          >
            Add First Event
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  {event.date ? new Date(event.date).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell>
                  <Badge className={`${getEventTypeColor(event.event_type)} text-white`}>
                    {getEventTypeLabel(event.event_type)}
                  </Badge>
                </TableCell>
                <TableCell>{event.description}</TableCell>
                <TableCell>
                  {event.status && (
                    <Badge className={`${getStatusColor(event.status)} text-white`}>
                      {getStatusLabel(event.status)}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {event.documents && event.documents.length > 0 ? (
                    <div className="flex space-x-1">
                      {event.documents.map((doc, index) => (
                        <a 
                          key={index} 
                          href={doc} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-1 rounded-md hover:bg-muted"
                        >
                          <FileText className="h-4 w-4" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">None</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => openEditDialog(event)}
                    >
                      <ClipboardEdit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeleteEvent(event.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Edit Event Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleEditEvent}>
            <DialogHeader>
              <DialogTitle>Edit Warranty Event</DialogTitle>
              <DialogDescription>
                Update the details of this warranty event.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_event_type">Event Type</Label>
                  <Select 
                    onValueChange={(value) => handleSelectChange("event_type", value)}
                    defaultValue={newEventData.event_type}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_date">Date</Label>
                  <Input 
                    id="edit_date" 
                    name="date" 
                    type="date" 
                    value={newEventData.date}
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_description">Description</Label>
                <Input
                  id="edit_description"
                  name="description"
                  placeholder="Brief description of the event"
                  value={newEventData.description}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_status">Status</Label>
                  <Select 
                    onValueChange={(value) => handleSelectChange("status", value)}
                    defaultValue={newEventData.status}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_document">Add Document (Optional)</Label>
                  <Input 
                    id="edit_document" 
                    type="file" 
                    onChange={handleFileChange} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_notes">Notes (Optional)</Label>
                <Textarea
                  id="edit_notes"
                  name="notes"
                  placeholder="Additional notes"
                  value={newEventData.notes || ""}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Update Event</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
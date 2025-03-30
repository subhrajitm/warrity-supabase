"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Calendar as CalendarIcon, Shield, Wrench, AlertTriangle, Info, Plus, Trash2, Loader2 } from "lucide-react"
import WarrantySidebar from "../warranties/components/sidebar"
import { useAuth } from "@/lib/auth-context"
import { 
  ApiCache, 
  createApiRequest, 
  apiEndpoints,
  handleApiError 
} from "@/lib/api-utils"
import { getAllEvents, createEvent, deleteEvent, updateEvent } from "@/lib/services/events-service"
import { getAllProducts } from "@/lib/services/products-service"
import { toast } from "react-hot-toast"

// Define the event type
interface CalendarEvent {
  _id: string;
  title: string;
  description: string;
  eventType: string;
  startDate: string;
  endDate?: string;
  allDay: boolean;
  location?: string;
  color?: string;
  relatedProduct?: string;
  relatedWarranty?: string;
  notifications?: {
    enabled: boolean;
    reminderTime: number;
  };
  date?: string;
  type?: string;
  productId?: string;
  productName?: string;
  time?: string;
  reminder?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Extended interface for API responses that may include object references
interface ApiCalendarEvent extends Omit<CalendarEvent, 'relatedProduct' | 'relatedWarranty'> {
  relatedProduct?: string | { _id: string; name: string };
  relatedWarranty?: string | { _id: string; name: string };
}

// Define the product type
interface Product {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  manufacturer?: string;
  model?: string;
}

// Define the API response type
interface ApiResponse<T> {
  data?: T;
  events?: T;
  products?: T;
  error?: string;
  message?: string;
}

export default function CalendarPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [filterType, setFilterType] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newEvent, setNewEvent] = useState<Omit<CalendarEvent, '_id'>>({
    title: "",
    description: "",
    eventType: "expiration",
    startDate: new Date().toISOString().split('T')[0],
    allDay: true,
    color: "#3498db",
    notifications: {
      enabled: true,
      reminderTime: 24
    }
  })
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  
  // Handle product selection
  const [products, setProducts] = useState<Product[]>([])
  const [isProductsLoading, setIsProductsLoading] = useState(true)
  
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setIsProductsLoading(true);
      
      let productsData: Product[] = [];
      
      try {
        // Try to use the Supabase service first
        const products = await getAllProducts();
        console.log('Retrieved products from Supabase:', products.length);
        
        // Convert from Supabase Product format to our Product format
        productsData = products.map(product => ({
          _id: product.id,
          name: product.name || 'Unnamed Product',
          description: product.description || '',
          category: product.category || 'Uncategorized',
          manufacturer: product.manufacturer || '',
          model: product.model || ''
        }));
      } catch (supabaseError) {
        console.error('Error fetching from Supabase directly:', supabaseError);
        
        // Fall back to the API if Supabase direct fails
        console.log('Falling back to API endpoint:', apiEndpoints.products.list);
        const data = await ApiCache.fetchWithCache<ApiResponse<Product[]>>(
          apiEndpoints.products.list,
          createApiRequest(apiEndpoints.products.list)
        );
        
        if (data.error) {
          console.error('Error in API response:', data.error);
          return;
        }

        // Handle different response formats
        if (Array.isArray(data.data)) {
          productsData = data.data;
        } else if (Array.isArray(data.products)) {
          productsData = data.products;
        } else {
          console.error('Unexpected data format:', data);
        }
      }

      // Process and normalize product data
      const normalizedProducts = productsData.map((product: Product) => ({
        ...product,
        name: product.name || 'Unnamed Product',
        description: product.description || '',
        category: product.category || 'Uncategorized'
      }));
      
      setProducts(normalizedProducts);
      console.log('Products loaded:', normalizedProducts.length);
      
    } catch (err) {
      console.error('Error fetching products:', err);
      // Provide empty array as fallback
      setProducts([]);
    } finally {
      setIsProductsLoading(false);
    }
  };
  
  // Check if user is logged in and fetch events
  useEffect(() => {
    console.log('Auth state changed:', { authLoading, isAuthenticated });
    
    if (!authLoading) {
      if (!isAuthenticated) {
        console.log('User not authenticated, redirecting to login');
        router.push('/login');
      } else {
        console.log('User authenticated, initializing data');
        initializeData();
      }
    }
  }, [authLoading, isAuthenticated, router]);
  
  // Add a function to initialize data
  const initializeData = async () => {
    console.log('Initializing calendar data');
    try {
      await Promise.all([
        fetchEvents(),
        fetchProducts()
      ]);
      
      // After fetching events, set the selected date to today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setSelectedDate(today);
      
      console.log('Calendar data initialized:', {
        selectedDate: today.toISOString(),
        filterType,
        totalEvents: events.length
      });
    } catch (error) {
      console.error('Error initializing calendar data:', error);
    }
  };
  
  // Fetch events from API
  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching events directly from Supabase');
      
      let eventsData: CalendarEvent[] = [];
      
      try {
        // Try to use the Supabase service first
        const events = await getAllEvents();
        console.log('Retrieved events from Supabase:', events.length);
        
        // Convert from Supabase Event format to CalendarEvent format
        eventsData = events.map(event => ({
          _id: event.id,
          title: event.title || event.description,
          description: event.description,
          eventType: event.event_type,
          startDate: event.date || event.startDate || new Date().toISOString(),
          endDate: event.endDate,
          allDay: event.allDay || true,
          location: event.location,
          color: event.color || getEventColor(event.event_type),
          createdAt: event.created_at,
          updatedAt: event.updated_at
        }));
      } catch (supabaseError) {
        console.error('Error fetching from Supabase directly:', supabaseError);
        
        // Fall back to the API if Supabase direct fails
        console.log('Falling back to API endpoint:', apiEndpoints.events.list);
        const data = await ApiCache.fetchWithCache<ApiResponse<CalendarEvent[]>>(
          apiEndpoints.events.list,
          createApiRequest(apiEndpoints.events.list)
        );
        
        console.log('Raw API response:', JSON.stringify(data, null, 2));
        
        if (data.error) {
          console.error('Error in API response:', data.error);
          return;
        }

        // Handle different response formats
        if (Array.isArray(data.events)) {
          console.log('Found events in data.events:', data.events.length);
          eventsData = data.events;
        } else if (Array.isArray(data.data)) {
          console.log('Found events in data.data:', data.data.length);
          eventsData = data.data;
        } else {
          console.error('Unexpected data format:', data);
          console.error('data.events type:', typeof data.events);
          console.error('data.data type:', typeof data.data);
        }
      }

      // Process and normalize event data
      const normalizedEvents = eventsData.map((event: CalendarEvent) => {
        console.log('Processing event:', event);
        const eventDate = new Date(event.startDate);
        // Keep the original time if it's not an all-day event
        if (!event.allDay) {
          eventDate.setHours(0, 0, 0, 0);
        }
        
        return {
          ...event,
          startDate: eventDate.toISOString(),
          color: event.color || getEventColor(event.eventType)
        };
      });
      
      console.log('Setting normalized events:', normalizedEvents.length);
      setEvents(normalizedEvents);
      
      // Set the selected date to today if no date is selected
      if (!selectedDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setSelectedDate(today);
      }
      
      // Log the current state after setting events
      console.log('Current state after setting events:', {
        selectedDate: selectedDate.toISOString(),
        filterType,
        totalEvents: normalizedEvents.length,
        events: normalizedEvents.map(e => ({
          title: e.title,
          date: e.startDate,
          type: e.eventType
        }))
      });
    } catch (err) {
      console.error('Error fetching events:', err);
      if (err instanceof Error) {
        console.error('Error details:', {
          message: err.message,
          stack: err.stack
        });
        if (err.message === 'Unauthorized') {
          router.push('/login');
        } else {
          alert(`Failed to fetch events: ${err.message}`);
        }
      } else {
        alert('Failed to fetch events: Unknown error');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter events based on selected date and filter type
  const filteredEvents = events.filter(event => {
    // Convert dates to local timezone for comparison
    const eventDate = new Date(event.startDate);
    const selectedDateObj = new Date(selectedDate);
    
    // Format dates to YYYY-MM-DD for comparison
    const eventDateStr = eventDate.toISOString().split('T')[0];
    const selectedDateStr = selectedDateObj.toISOString().split('T')[0];
    
    const isSameDay = eventDateStr === selectedDateStr;
    const matchesFilter = filterType === "all" || event.eventType === filterType;
    
    console.log('Filtering event:', {
      eventTitle: event.title,
      eventDate: eventDateStr,
      selectedDate: selectedDateStr,
      eventType: event.eventType,
      filterType,
      isSameDay,
      matchesFilter,
      willShow: isSameDay && matchesFilter
    });
    
    return isSameDay && matchesFilter;
  });
  
  // Add logging for initial state
  useEffect(() => {
    console.log('Initial state:', {
      selectedDate: selectedDate.toISOString(),
      filterType,
      totalEvents: events.length,
      events: events.map(e => ({
        title: e.title,
        date: e.startDate,
        type: e.eventType
      }))
    });
  }, []);
  
  // Add logging for state changes
  useEffect(() => {
    console.log('State updated:', {
      selectedDate: selectedDate.toISOString(),
      filterType,
      totalEvents: events.length,
      filteredEvents: filteredEvents.length,
      events: events.map(e => ({
        title: e.title,
        date: e.startDate,
        type: e.eventType
      }))
    });
  }, [events, selectedDate, filterType]);
  
  // Get dates with events for highlighting in calendar
  const getDatesWithEvents = () => {
    return events.map(event => {
      const date = new Date(event.startDate);
      date.setHours(0, 0, 0, 0);
      return date;
    });
  };
  
  // Get event type badge
  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case "expiration":
        return (
          <Badge className="bg-amber-500 text-white">
            <Shield className="mr-1 h-3 w-3" />
            Warranty Expiration
          </Badge>
        )
      case "maintenance":
        return (
          <Badge className="bg-blue-500 text-white">
            <Wrench className="mr-1 h-3 w-3" />
            Maintenance
          </Badge>
        )
      case "reminder":
        return (
          <Badge className="bg-red-500 text-white">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Reminder
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-500 text-white">
            <Info className="mr-1 h-3 w-3" />
            Other
          </Badge>
        )
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  // Handle new event form changes
  const handleNewEventChange = (field: string, value: any) => {
    setNewEvent(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Update the product selection handling
  const handleProductSelect = (productIdString: string) => {
    console.log('Selected product ID string:', productIdString);
    
    // Handle empty selection
    if (!productIdString) {
      setNewEvent(prev => ({
        ...prev,
        relatedProduct: undefined
      }));
      return;
    }
    
    setNewEvent(prev => ({
      ...prev,
      relatedProduct: productIdString
    }));
  };
  
  // Handle creating a new event
  const handleCreateEvent = async () => {
    try {
      setIsCreating(true);
      
      if (!newEvent.title) {
        toast.error('Please enter a title for the event');
        return;
      }
      
      if (!selectedDate) {
        toast.error('Please select a date for the event');
        return;
      }
      
      // Format the date
      const formattedDate = selectedDate.toISOString();
      
      // Create event data for Supabase
      const eventData = {
        title: newEvent.title,
        description: newEvent.description,
        event_type: newEvent.eventType,
        date: formattedDate,
        allDay: newEvent.allDay,
        location: newEvent.location,
        color: getEventColor(newEvent.eventType),
        warranty_id: newEvent.relatedWarranty || undefined
      };
      
      console.log('Creating event with data:', eventData);
      
      try {
        // Try to use Supabase service first
        const createdEvent = await createEvent(eventData);
        
        if (createdEvent) {
          // Convert to CalendarEvent format and add to state
          const newCalendarEvent: CalendarEvent = {
            _id: createdEvent.id,
            title: createdEvent.title || createdEvent.description,
            description: createdEvent.description,
            eventType: createdEvent.event_type,
            startDate: createdEvent.date,
            allDay: createdEvent.allDay || true,
            location: createdEvent.location,
            color: createdEvent.color || getEventColor(createdEvent.event_type),
            relatedWarranty: createdEvent.warranty_id,
            createdAt: createdEvent.created_at,
            updatedAt: createdEvent.updated_at
          };
          
          setEvents([...events, newCalendarEvent]);
          toast.success('Event created successfully');
          setIsDialogOpen(false);
        } else {
          throw new Error('Failed to create event with Supabase');
        }
      } catch (supabaseError) {
        console.error('Error creating event with Supabase:', supabaseError);
        
        // Fall back to API endpoint
        const response = await fetch(apiEndpoints.events.list, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
          },
          body: JSON.stringify({
            title: newEvent.title,
            description: newEvent.description,
            eventType: newEvent.eventType,
            startDate: formattedDate,
            allDay: newEvent.allDay,
            location: newEvent.location,
            relatedProduct: newEvent.relatedProduct,
            relatedWarranty: newEvent.relatedWarranty
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to create event: ${errorText}`);
        }
        
        const data = await response.json();
        
        console.log('API Response:', data);
        const createdEvent = data.event || data.data;
        
        if (!createdEvent) {
          throw new Error('No event data returned from API');
        }
        
        // Add the new event to the state
        setEvents([...events, createdEvent]);
        
        toast.success('Event created successfully');
        setIsDialogOpen(false);
      }
      
      // Reset the form
      setNewEvent({
        title: '',
        description: '',
        eventType: 'maintenance',
        allDay: true,
        location: '',
        relatedProduct: '',
        relatedWarranty: '',
        startDate: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsCreating(false);
    }
  };
  
  // Handle deleting an event
  const handleDeleteEvent = async (id: string) => {
    try {
      setIsDeleting(true);
      
      console.log('Deleting event with ID:', id);
      
      try {
        // Try to use Supabase service first
        const success = await deleteEvent(id);
        
        if (success) {
          // Remove the event from state
          setEvents(events.filter(event => event._id !== id));
          toast.success('Event deleted successfully');
          setIsViewDialogOpen(false);
        } else {
          throw new Error('Failed to delete event with Supabase');
        }
      } catch (supabaseError) {
        console.error('Error deleting event with Supabase:', supabaseError);
        
        // Fall back to API endpoint
        const response = await fetch(apiEndpoints.events.detail(id), {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to delete event: ${errorText}`);
        }
        
        // Remove the event from state
        setEvents(events.filter(event => event._id !== id));
        
        toast.success('Event deleted successfully');
        setIsViewDialogOpen(false);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsDeleting(false);
    }
  };
  
  // View event details
  const handleViewEvent = async (event: CalendarEvent) => {
    try {
      const data = await ApiCache.fetchWithCache<ApiResponse<CalendarEvent>>(
        apiEndpoints.events.detail(event._id),
        createApiRequest(apiEndpoints.events.detail(event._id))
      );
      
      // Handle different response formats
      const eventDetails = data.data || data;
      
      if (eventDetails && '_id' in eventDetails) {
        setSelectedEvent(eventDetails as CalendarEvent);
        setIsViewDialogOpen(true);
      } else {
        // Use the event from the list as a fallback
        setSelectedEvent(event);
        setIsViewDialogOpen(true);
      }
    } catch (error) {
      console.error('Error viewing event:', error);
      // Use the event from the list as a fallback
      setSelectedEvent(event);
      setIsViewDialogOpen(true);
    }
  };
  
  // Update the Calendar component to handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      console.log('Date selected:', date.toISOString());
      setSelectedDate(date);
    }
  };
  
  // Function to convert API event format to our component format
  const convertApiEventToCalendarEvent = (apiEvent: ApiCalendarEvent): CalendarEvent => {
    return {
      _id: apiEvent._id,
      title: apiEvent.title,
      description: apiEvent.description,
      eventType: apiEvent.eventType,
      startDate: apiEvent.startDate,
      endDate: apiEvent.endDate,
      allDay: apiEvent.allDay,
      location: apiEvent.location,
      color: apiEvent.color,
      relatedProduct: typeof apiEvent.relatedProduct === 'object' 
        ? apiEvent.relatedProduct._id 
        : apiEvent.relatedProduct,
      relatedWarranty: typeof apiEvent.relatedWarranty === 'object' 
        ? apiEvent.relatedWarranty._id 
        : apiEvent.relatedWarranty,
      notifications: apiEvent.notifications,
      date: new Date(apiEvent.startDate).toISOString().split('T')[0],
      type: apiEvent.eventType,
      productId: typeof apiEvent.relatedProduct === 'object' 
        ? apiEvent.relatedProduct._id 
        : apiEvent.relatedProduct,
      productName: typeof apiEvent.relatedProduct === 'object' 
        ? apiEvent.relatedProduct.name 
        : '',
      time: apiEvent.allDay ? "00:00" : new Date(apiEvent.startDate).toTimeString().slice(0, 5),
      reminder: apiEvent.notifications?.enabled || false,
      createdAt: apiEvent.createdAt,
      updatedAt: apiEvent.updatedAt
    };
  };
  
  // Get a color based on event type
  const getEventColor = (type: string): string => {
    switch (type) {
      case 'maintenance':
        return '#3498db'; // Blue
      case 'warranty':
        return '#2ecc71'; // Green
      case 'expiration':
        return '#e74c3c'; // Red
      case 'reminder':
        return '#f39c12'; // Orange
      default:
        return '#9b59b6'; // Purple
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-amber-50">
        <WarrantySidebar />
        
        <div className="flex-1 p-6 ml-64 flex items-center justify-center">
          <p className="text-amber-800 text-xl">Loading calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-amber-50">
      <WarrantySidebar />
      
      <div className="flex-1 p-6 ml-64">
        <div className="mb-6">
          <Link href="/user" className="flex items-center text-amber-800 hover:text-amber-600 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
        
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-amber-900">Warranty Calendar</h1>
              <p className="text-amber-700">Track your warranty expirations and maintenance schedules</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px] border-2 border-amber-800 bg-amber-50">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="expiration">Warranty Expiration</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                </SelectContent>
              </Select>
              
              {isLoading && (
                <div className="flex items-center text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Loading events...</span>
                </div>
              )}
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-amber-800 hover:bg-amber-900 text-amber-100 border-2 border-amber-900">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-amber-50 border-4 border-amber-800">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-amber-900">Add New Calendar Event</DialogTitle>
                    <DialogDescription className="text-amber-700">
                      Create a new warranty or maintenance event for your products.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-amber-900">Event Title</Label>
                      <Input 
                        id="title" 
                        value={newEvent.title} 
                        onChange={(e) => handleNewEventChange('title', e.target.value)}
                        className="border-2 border-amber-800 bg-amber-50"
                        placeholder="e.g., TV Warranty Expiration"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="startDate" className="text-amber-900">Event Date</Label>
                      <Input 
                        id="startDate" 
                        type="date" 
                        value={newEvent.startDate} 
                        onChange={(e) => handleNewEventChange('startDate', e.target.value)}
                        className="border-2 border-amber-800 bg-amber-50"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="type" className="text-amber-900">Event Type</Label>
                      <Select 
                        value={newEvent.eventType} 
                        onValueChange={(value) => handleNewEventChange('eventType', value)}
                      >
                        <SelectTrigger id="type" className="border-2 border-amber-800 bg-amber-50">
                          <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="expiration">Warranty Expiration</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="reminder">Reminder</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="warranty" className="text-amber-900">Related Warranty (Optional)</Label>
                      <Select 
                        value={newEvent.relatedWarranty || "none"} 
                        onValueChange={(value) => handleNewEventChange('relatedWarranty', value === "none" ? undefined : value)}
                      >
                        <SelectTrigger id="warranty" className="border-2 border-amber-800 bg-amber-50">
                          <SelectValue placeholder="Select a warranty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No warranty</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-amber-900">Description (Optional)</Label>
                      <Textarea 
                        id="description" 
                        value={newEvent.description} 
                        onChange={(e) => handleNewEventChange('description', e.target.value)}
                        className="border-2 border-amber-800 bg-amber-50 min-h-[80px]"
                        placeholder="Add any additional details about this event..."
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="allDay"
                        checked={newEvent.allDay}
                        onChange={(e) => handleNewEventChange('allDay', e.target.checked)}
                        className="h-4 w-4 rounded border-amber-800 text-amber-800 focus:ring-amber-800"
                      />
                      <Label htmlFor="allDay" className="text-amber-900">All-day event</Label>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      className="border-2 border-amber-800 text-amber-800"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateEvent}
                      className="bg-amber-800 hover:bg-amber-900 text-amber-100 border-2 border-amber-900"
                    >
                      Create Event
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card className="border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100">
                <CardHeader className="border-b-4 border-amber-800 bg-amber-200 px-6 py-4">
                  <CardTitle className="text-xl font-bold text-amber-900">
                    <CalendarIcon className="inline-block mr-2 h-5 w-5" />
                    Calendar
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    className="border-2 border-amber-300 rounded-md p-3"
                    modifiers={{
                      hasEvent: getDatesWithEvents()
                    }}
                    modifiersStyles={{
                      hasEvent: {
                        fontWeight: 'bold',
                        backgroundColor: 'rgba(217, 119, 6, 0.2)',
                        borderRadius: '100%'
                      }
                    }}
                  />
                  
                  <div className="mt-4 text-center">
                    <p className="text-amber-800 font-medium">
                      {formatDate(selectedDate.toISOString())}
                    </p>
                    <p className="text-amber-700 text-sm mt-1">
                      {filteredEvents.length} events on this day
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              <Card className="border-4 border-amber-800 shadow-[8px_8px_0px_0px_rgba(120,53,15,0.5)] bg-amber-100 h-full">
                <CardHeader className="border-b-4 border-amber-800 bg-amber-200 px-6 py-4">
                  <CardTitle className="text-xl font-bold text-amber-900">
                    Events for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {filteredEvents.length > 0 ? (
                    <div className="space-y-4">
                      {filteredEvents.map(event => (
                        <div 
                          key={event._id} 
                          className="p-4 border-2 border-amber-300 rounded-md bg-amber-50 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => handleViewEvent(event)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-amber-900">{event.title}</h3>
                              <p className="text-amber-700 text-sm mt-1">
                                {event.allDay ? 'All day' : new Date(event.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                            </div>
                            {getEventTypeBadge(event.eventType)}
                          </div>
                          {event.description && (
                            <p className="text-amber-700 mt-2 text-sm line-clamp-2">{event.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-amber-700">No events scheduled for this day.</p>
                      <Button 
                        onClick={() => setIsDialogOpen(true)}
                        className="mt-4 bg-amber-800 hover:bg-amber-900 text-amber-100 border-2 border-amber-900"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Event
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      {/* Event Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-amber-50 border-4 border-amber-800">
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-center">
                  <DialogTitle className="text-2xl font-bold text-amber-900">{selectedEvent.title}</DialogTitle>
                  {getEventTypeBadge(selectedEvent.eventType)}
                </div>
                <DialogDescription className="text-amber-700">
                  {formatDate(selectedEvent.startDate)}
                  {!selectedEvent.allDay && ` at ${new Date(selectedEvent.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {selectedEvent.relatedWarranty && (
                  <div>
                    <h4 className="font-semibold text-amber-900">Related Warranty</h4>
                    <p className="text-amber-700">
                      {selectedEvent.relatedWarranty}
                    </p>
                  </div>
                )}
                
                {selectedEvent.description && (
                  <div>
                    <h4 className="font-semibold text-amber-900">Description</h4>
                    <p className="text-amber-700">{selectedEvent.description}</p>
                  </div>
                )}
              </div>
              
              <DialogFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => handleDeleteEvent(selectedEvent._id)}
                  className="border-2 border-red-800 text-red-800 hover:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                <Button 
                  onClick={() => setIsViewDialogOpen(false)}
                  className="bg-amber-800 hover:bg-amber-900 text-amber-100 border-2 border-amber-900"
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
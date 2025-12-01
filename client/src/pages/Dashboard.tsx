import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import BookingCalendar from '@/components/BookingCalendar';
import BookingViewModal from '@/components/BookingViewModal';

type CalendarBooking = {
  id: string;
  title: string;
  start: string;
  end?: string;
  user: string;
  email: string;
  phone: string;
};
import BookingCard from '@/components/BookingCard';
import BookingsTable from '@/components/BookingsTable';
import BookingModal from '@/components/BookingModal';

interface Booking {
  id: string;
  user: string;
  email: string;
  phone: string;
  room: string;
  startTime: string;
  endTime: string;
  createdAt?: string;
}

export default function Dashboard() {
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{start: string, end: string} | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null); // global error (session/fetching)
  const [modalError, setModalError] = useState<string | null>(null); // only for BookingModal (create/save)
  const [pendingDate, setPendingDate] = useState<Date | null>(null);

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Check authentication status when component mounts
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found in localStorage, redirecting to login');
        window.location.href = '/login';
        return;
      }

      try {
        console.log('Verifying token with server...');
        const response = await fetch('/api/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include' // Include cookies in the request
        });

        const data = await response.json();
        console.log('Auth response:', { status: response.status, data });

        if (!response.ok) {
          throw new Error(data.error || 'Token verification failed');
        }

        if (data.isAuthenticated) {
          console.log('User authenticated successfully');
          setIsAuthenticated(true);
          await fetchBookings();
        } else {
          throw new Error('Not authenticated');
        }
      } catch (err) {
        console.error('Authentication error:', err);
        // Don't remove token immediately, let the user know first
        setError(err instanceof Error ? err.message : 'Authentication failed');
        // Give user a chance to see the error before redirecting
        const timeout = setTimeout(() => {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }, 2000);
        
        return () => clearTimeout(timeout);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

    const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  };

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const response = await fetch('/api/bookings', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        throw new Error('Failed to fetch bookings');
      }
      
      const data = await response.json();
      setBookings(data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };


  // For UI: if called from calendar, provide date. If called from button, call without param.
  const handleAddBooking = (date?: Date) => {
    const selectedDate = date || new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const cmpDate = new Date(selectedDate);
    cmpDate.setHours(0, 0, 0, 0);
    
    if (cmpDate < today) {
      setModalError("You cannot book rooms before current date");
      return;
    }
    
    setSelectedDate(selectedDate);
    setSelectedBooking(null);
    setPendingDate(selectedDate);
    setIsViewModalOpen(true);
  };
  
  const handleViewModalClose = () => {
    setIsViewModalOpen(false);
    setSelectedTimeSlot(null);
    setSelectedRoom(null);
  };
  
  const handleProceedToBooking = (slot: {start: string, end: string, room?: string}) => {
    // Create new date objects to avoid reference issues
    const startDate = new Date(slot.start);
    const endDate = new Date(slot.end);
    
    // Ensure we have the correct date part
    if (pendingDate) {
      startDate.setFullYear(
        pendingDate.getFullYear(),
        pendingDate.getMonth(),
        pendingDate.getDate()
      );
      endDate.setFullYear(
        pendingDate.getFullYear(),
        pendingDate.getMonth(),
        pendingDate.getDate()
      );
    }
    
    setSelectedTimeSlot({
      start: startDate.toISOString(),
      end: endDate.toISOString()
    });
    
    // Store the selected room if provided
    if (slot.room) {
      setSelectedRoom(slot.room);
    }
    
    setSelectedBooking(null); // Ensure we're in create mode
    setIsViewModalOpen(false);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsAddModalOpen(false);
    setSelectedRoom(null);
    fetchBookings(); // Refresh bookings after closing modal
  };

  const formatBookingData = (bookingData: any) => {
    const startDate = new Date(bookingData.date);
    const [startHours, startMinutes] = bookingData.startTime.split(':').map(Number);
    startDate.setHours(startHours, startMinutes, 0, 0);

    const endDate = new Date(bookingData.date);
    const [endHours, endMinutes] = bookingData.endTime.split(':').map(Number);
    endDate.setHours(endHours, endMinutes, 0, 0);

    return {
      user: bookingData.user,
      email: bookingData.email,
      phone: bookingData.phone,
      room: bookingData.room,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
    };
  };

  
  const handleEditBooking = useCallback((id: string) => {
    const booking = bookings.find(b => b.id === id);
    if (booking) {
      setSelectedBooking(booking);
      setIsModalOpen(true);
    }
  }, [bookings]);

  const handleSaveBooking = async (bookingData: any) => {
    try {
      // BookingModal already sends properly formatted data with ISO strings
      // No need to call formatBookingData here
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(bookingData), // Send data directly
      });
    
    if (!response.ok) {
      let errMsg = 'Failed to create booking';
      try {
        const data = await response.json();
        let bookedMsg = 'This room is already booked for the selected time period';
        if (data) {
          let foundBookedOverlap = false;
          if (data.error && data.error.toLowerCase().includes('already booked for the selected time period')) {
            foundBookedOverlap = true;
          }
          if (Array.isArray(data.details) && data.details.some((d: any) => d.message && d.message.toLowerCase().includes('already booked for the selected time period'))) {
            foundBookedOverlap = true;
          }
          if (foundBookedOverlap) {
            errMsg = bookedMsg;
          } else if (data.error && Array.isArray(data.details)) {
            errMsg = data.details.map((d: any) => d.message).join('\n');
          } else if (data.error) {
            errMsg = data.error;
          }
        }
        setModalError(errMsg);
        return; // DO NOT close modal
      } catch (e) {
        setModalError(errMsg);
        return;
      }
    }
    
    await fetchBookings();
    setIsAddModalOpen(false); // Only close if all good
    setModalError(null);
  } catch (err) {
    console.error('Error creating booking:', err);
    setModalError(err instanceof Error ? err.message : 'Failed to create booking');
  }
};

  // Also update handleUpdateBooking similarly:
const handleUpdateBooking = async (bookingData: any) => {
  if (!selectedBooking) return;
  
  try {
    // BookingModal already sends properly formatted data with ISO strings
    const response = await fetch(`/api/bookings/${selectedBooking.id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(bookingData), // Send data directly
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to update booking');
    }
    
    // Refresh the bookings list and close modal
    await fetchBookings();
    setIsModalOpen(false);
    setModalError(null);
  } catch (err) {
    console.error('Error updating booking:', err);
    setModalError(err instanceof Error ? err.message : 'Failed to update booking');
  }
};

  const handleDeleteBooking = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        const response = await fetch(`/api/bookings/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
      
        if (!response.ok) {
          throw new Error('Failed to delete booking');
        }
        
        // Refresh the bookings list
        await fetchBookings();
      } catch (err) {
        console.error('Error deleting booking:', err);
        setError(err instanceof Error ? err.message : 'Failed to delete booking');
      }
    }
  };

  const handleEventClick = (eventOrClickInfo: any) => {
    console.log('handleEventClick called with:', eventOrClickInfo);
    
    // Handle both direct event object and clickInfo pattern
    const event = eventOrClickInfo.event || eventOrClickInfo;
    console.log('Calendar event:', event);
    
    if (!event) {
      console.error('No event data found');
      return;
    }

    console.log('Looking for booking with ID:', event.id);
    console.log('Available booking IDs:', bookings.map(b => b.id));
    
    // Find the full booking data from our bookings state
    const booking = bookings.find(b => b.id === event.id);
    console.log('Found booking:', booking);
    
    if (booking) {
      setSelectedBooking(booking);
      setIsModalOpen(true);
    } else {
      console.error('No booking found with ID:', event.id);
    }
  };

  // Convert bookings to the format expected by the calendar
  const calendarEvents: CalendarBooking[] = bookings.map(booking => ({
    id: booking.id,
    title: `${booking.user} - ${booking.room}`,
    start: booking.startTime,
    end: booking.endTime,
    user: booking.user,
    email: booking.email,
    phone: booking.phone
  }));

  // Get the 6 most recent bookings
  const latestBookings = [...bookings]
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 6);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Verifying your session...</p>
        </div>
      </div>
    );
  }

  if (error && !(isAddModalOpen || isModalOpen)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive text-lg font-medium mb-2">Error loading bookings</p>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button 
            onClick={fetchBookings} 
            variant="outline"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-[1600px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold" data-testid="text-page-title">Boardroom Booking</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage and view all boardroom bookings</p>
            </div>
            <Button onClick={() => handleAddBooking()} data-testid="button-add-booking">
              <Plus className="h-4 w-4 mr-2" />
              Add Booking
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-8 py-6 space-y-8">
        <section>
          <h2 className="text-lg font-semibold mb-4">Calendar View</h2>
          {modalError === 'You cannot book rooms before current date' && (
            <div className="mb-4 bg-destructive/10 border border-destructive text-destructive rounded px-3 py-2 flex items-center justify-between max-w-xl">
              <span>You cannot book rooms before current date</span>
              <button className="ml-2 text-xs text-destructive" onClick={() => setModalError(null)}>Dismiss</button>
            </div>
          )}
          <BookingCalendar 
            bookings={calendarEvents}
            onEventClick={handleEventClick}
            onDateClick={handleAddBooking}
          />
        </section>

        <section>
          <Tabs defaultValue="latest" className="w-full">
            <TabsList data-testid="tabs-bookings">
              <TabsTrigger value="latest" data-testid="tab-latest">Latest Bookings</TabsTrigger>
              <TabsTrigger value="all" data-testid="tab-all">All Bookings</TabsTrigger>
            </TabsList>

            <TabsContent value="latest" className="mt-4">
              {latestBookings.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {latestBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      id={booking.id}
                      user={booking.user}
                      email={booking.email}
                      phone={booking.phone}
                      startTime={booking.startTime}
                      endTime={booking.endTime}
                      room={booking.room}
                      onEdit={() => handleEditBooking(booking.id)}
                      onDelete={() => handleDeleteBooking(booking.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">No bookings found. Create your first booking to get started.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="all" className="mt-4">
              <BookingsTable 
                bookings={bookings} 
                onEdit={handleEditBooking}
                onDelete={handleDeleteBooking}
              />
            </TabsContent>
          </Tabs>
        </section>
      </main>

      {isModalOpen && (
        <BookingModal
          open={isModalOpen}
          onClose={handleCloseModal}
          booking={selectedBooking}
          onSave={handleUpdateBooking}
          error={modalError}
          setError={setModalError}
        />
      )}
{isViewModalOpen && selectedDate && (
        <BookingViewModal
          open={isViewModalOpen}
          onClose={handleViewModalClose}
          onAddBooking={handleProceedToBooking}
          date={selectedDate}
          bookings={bookings.filter(booking => {
            const bookingDate = new Date(booking.startTime);
            return (
              bookingDate.getDate() === selectedDate.getDate() &&
              bookingDate.getMonth() === selectedDate.getMonth() &&
              bookingDate.getFullYear() === selectedDate.getFullYear()
            );
          })}
        />
      )}
      
      {isAddModalOpen && (
        <BookingModal
          open={isAddModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveBooking}
          defaultDate={pendingDate}
          defaultStartTime={selectedTimeSlot?.start}
          defaultEndTime={selectedTimeSlot?.end}
          defaultRoom={selectedRoom}
          error={modalError}
          setError={setModalError}
        />
      )}
    </div>
  );
}

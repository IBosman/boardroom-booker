import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import { Plus } from 'lucide-react';

interface TimeSlot {
  start: string;
  end: string;
  isBooked: boolean;
  booking?: {
    user: string;
    email: string;
    room: string;
  };
}

interface BookingViewModalProps {
  open: boolean;
  onClose: () => void;
  onAddBooking: (slot: { start: string; end: string }) => void;
  date: Date;
  bookings: Array<{
    startTime: string;
    endTime: string;
    user: string;
    email: string;
    room: string;
  }>;
}

export default function BookingViewModal({ 
  open, 
  onClose, 
  onAddBooking, 
  date, 
  bookings = [] 
}: BookingViewModalProps) {
  // Removed selectedSlot state as it's no longer needed

  // Generate time slots for the day (8 AM to 6 PM)
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const dayStart = new Date(date);
    dayStart.setHours(8, 0, 0, 0); // Start at 8 AM
    
    const dayEnd = new Date(date);
    dayEnd.setHours(18, 0, 0, 0); // End at 6 PM
    
    // Helper function to format date to ISO string with proper timezone handling
    const toISOLocal = (d: Date) => {
      const localDate = new Date(d);
      const tzOffset = localDate.getTimezoneOffset() * 60000;
      return new Date(localDate.getTime() - tzOffset).toISOString();
    };

    // Get all rooms
    const allRooms = ['room-1', 'room-2']; // Add all your room IDs here
    
    // Sort bookings by start time
    const sortedBookings = [...bookings].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    // First, generate all booked slots
    for (const booking of sortedBookings) {
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);
      
      // Only process bookings for the current date
      if (bookingStart >= dayStart && bookingStart < dayEnd) {
        slots.push({
          start: toISOLocal(bookingStart),
          end: toISOLocal(bookingEnd),
          isBooked: true,
          booking: {
            user: booking.user,
            email: booking.email,
            room: booking.room
          }
        });
      }
    }

    // Then generate available slots
    let currentTime = new Date(dayStart);
    
    while (currentTime < dayEnd) {
      const slotStart = new Date(currentTime);
      let slotEnd = new Date(slotStart);
      slotEnd.setHours(slotStart.getHours() + 1); // Default to 1 hour slots

      // Check if this time is available in any room
      const isBookedInAllRooms = allRooms.every(room => {
        return sortedBookings.some(b => {
          if (b.room !== room) return false;
          const bookingStart = new Date(b.startTime);
          const bookingEnd = new Date(b.endTime);
          return slotStart < bookingEnd && slotEnd > bookingStart;
        });
      });

      if (!isBookedInAllRooms) {
        // Extend the available slot as far as possible
        let nextHour = new Date(slotEnd);
        let nextHourEnd = new Date(nextHour);
        nextHourEnd.setHours(nextHour.getHours() + 1);
        
        while (nextHour < dayEnd) {
          const isNextHourBookedInAllRooms = allRooms.every(room => {
            return sortedBookings.some(b => {
              if (b.room !== room) return false;
              const bookingStart = new Date(b.startTime);
              const bookingEnd = new Date(b.endTime);
              return nextHour < bookingEnd && nextHourEnd > bookingStart;
            });
          });
          
          if (isNextHourBookedInAllRooms) break;
          
          slotEnd.setHours(slotEnd.getHours() + 1);
          nextHour.setHours(nextHour.getHours() + 1);
          nextHourEnd.setHours(nextHourEnd.getHours() + 1);
        }
        
        // Add available slot
        slots.push({
          start: toISOLocal(slotStart),
          end: toISOLocal(slotEnd),
          isBooked: false
        });
        
        // Skip ahead to the end of this available slot
        currentTime = new Date(slotEnd);
      } else {
        // Move to next time slot
        currentTime = new Date(slotEnd);
      }

      // Move to next time slot
      currentTime = new Date(slotEnd);
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  const formatTime = (dateTime: string) => {
    return format(parseISO(dateTime), 'h:mm a');
  };

  const handleBookNow = (e: React.MouseEvent, slot: TimeSlot) => {
    e.stopPropagation(); // Prevent event bubbling
    
    // Create new date objects to avoid reference issues
    const start = new Date(slot.start);
    const end = new Date(slot.end);
    
    // Ensure the date part matches the selected date
    start.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    end.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    
    // Log for debugging
    console.log('Booking slot:', {
      original: { start: slot.start, end: slot.end },
      processed: { 
        start: start.toISOString(), 
        end: end.toISOString(),
        localStart: start.toString(),
        localEnd: end.toString()
      }
    });

    onAddBooking({
      start: start.toISOString(),
      end: end.toISOString()
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bookings for {format(date, 'EEEE, MMMM d, yyyy')}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {timeSlots.map((slot, index) => (
            <div 
              key={index}
              className={`p-3 rounded-md border ${
                slot.isBooked 
                  ? 'bg-gray-100 border-gray-200 cursor-not-allowed' 
                  : 'hover:bg-gray-50 cursor-pointer border-gray-200'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">
                    {formatTime(slot.start)} - {formatTime(slot.end)}
                    {!slot.isBooked && (
                      <span className="ml-2 text-sm text-green-600 font-normal">
                        Available
                      </span>
                    )}
                  </div>
                  {slot.isBooked && slot.booking && (
                    <div className="text-sm text-gray-600 mt-1 space-y-1">
                      <div>Booked by {slot.booking.user}</div>
                      <div className="text-xs text-gray-500">Room: {slot.booking.room}</div>
                    </div>
                  )}
                </div>
                {!slot.isBooked && (
                  <Button size="sm" onClick={(e) => handleBookNow(e, slot)}>
                    <Plus className="h-4 w-4 mr-1" /> Book
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

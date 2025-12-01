import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import { Plus } from 'lucide-react';

interface TimeSlot {
  start: string;
  end: string;
  isBooked: boolean;
  room?: string;
  booking?: {
    user: string;
    email: string;
    room: string;
  };
}

interface BookingViewModalProps {
  open: boolean;
  onClose: () => void;
  onAddBooking: (slot: { start: string; end: string; room?: string }) => void;
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

  // Generate fixed one-hour time slots for the day (8 AM to 6 PM) per room
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
    const allRooms = ['room-1', 'room-2'];
    
    // Sort bookings by start time
    const sortedBookings = [...bookings].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    // Generate fixed one-hour slots for each room
    allRooms.forEach(room => {
      const currentTime = new Date(dayStart);
      
      while (currentTime < dayEnd) {
        const slotStart = new Date(currentTime);
        const slotEnd = new Date(slotStart);
        slotEnd.setHours(slotStart.getHours() + 1);

        // Find if there's a booking for this room and time slot
        const booking = sortedBookings.find(b => {
          if (b.room !== room) return false;
          const bookingStart = new Date(b.startTime);
          const bookingEnd = new Date(b.endTime);
          return slotStart < bookingEnd && slotEnd > bookingStart;
        });

        if (booking) {
          // Add booked slot
          slots.push({
            start: toISOLocal(slotStart),
            end: toISOLocal(slotEnd),
            isBooked: true,
            room: booking.room,
            booking: {
              user: booking.user,
              email: booking.email,
              room: booking.room
            }
          });
        } else {
          // Add available slot for this room
          slots.push({
            start: toISOLocal(slotStart),
            end: toISOLocal(slotEnd),
            isBooked: false,
            room: room
          });
        }

        // Move to next hour
        currentTime.setHours(currentTime.getHours() + 1);
      }
    });

    return slots;
  };

  const timeSlots = generateTimeSlots().sort((a, b) => 
    new Date(a.start).getTime() - new Date(b.start).getTime()
  );

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
      original: { start: slot.start, end: slot.end, room: slot.room },
      processed: { 
        start: start.toISOString(), 
        end: end.toISOString(),
        localStart: start.toString(),
        localEnd: end.toString(),
        room: slot.room
      }
    });

    onAddBooking({
      start: start.toISOString(),
      end: end.toISOString(),
      room: slot.room
    });
  };

  // Group time slots by time range
  const groupedTimeSlots = timeSlots.reduce((groups, slot) => {
    const timeRange = `${formatTime(slot.start)} - ${formatTime(slot.end)}`;
    if (!groups[timeRange]) {
      groups[timeRange] = [];
    }
    groups[timeRange].push(slot);
    return groups;
  }, {} as Record<string, TimeSlot[]>);

  // Get all unique rooms for reference
  const allRooms = Array.from(new Set(timeSlots.map(slot => slot.room).filter((room): room is string => !!room))).sort();

  // Convert to array and sort by start time
  const timeSlotGroups = Object.entries(groupedTimeSlots).map(([timeRange, slots]) => {
    // Create a map of room to slot for easier lookup
    const slotByRoom = new Map<string, TimeSlot>();
    slots.forEach(slot => {
      if (slot.room) {
        slotByRoom.set(slot.room, slot);
      }
    });

    // For each room, ensure we have either a booked or available slot
    const allRoomSlots = allRooms.map(room => {
      const existingSlot = slotByRoom.get(room);
      if (existingSlot) {
        return existingSlot;
      }
      // Create a new available slot for this room if it doesn't exist
      return {
        start: slots[0]?.start || new Date().toISOString(),
        end: slots[0]?.end || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        isBooked: false,
        room
      } as TimeSlot;
    });

    return {
      timeRange,
      slots: allRoomSlots.sort((a, b) => {
        // Sort booked slots first, then by room
        if (a.isBooked !== b.isBooked) {
          return a.isBooked ? -1 : 1;
        }
        return (a.room || '').localeCompare(b.room || '');
      })
    };
  }).sort((a, b) => {
    // Sort by start time
    const aStart = new Date(a.slots[0].start);
    const bStart = new Date(b.slots[0].start);
    return aStart.getTime() - bStart.getTime();
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bookings for {format(date, 'EEEE, MMMM d, yyyy')}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2">
          {timeSlotGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-4">
              <div className="space-y-2">
                <div className="p-3 rounded-md border border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="font-medium">
                        {group.timeRange}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {group.slots.map((slot, slotIndex) => (
                          <div key={`${slot.room}-${slotIndex}`} className="mb-2">
                            {slot.isBooked ? (
                              <>
                                <div>Booked by {slot.booking?.user}</div>
                                <div className="text-xs text-gray-500">Room: {slot.room}</div>
                              </>
                            ) : (
                              <div className="text-green-600">{slot.room} available</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    {group.slots.some(slot => !slot.isBooked) && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="ml-2"
                        onClick={(e) => handleBookNow(e, group.slots.find(slot => !slot.isBooked)!)}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Book
                      </Button>
                    )}
                  </div>
                </div>
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

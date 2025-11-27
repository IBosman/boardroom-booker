import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimeClock } from '@mui/x-date-pickers/TimeClock';
import dayjs, { Dayjs } from 'dayjs';

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  booking?: {
    id: string;
    user: string;
    email: string;
    phone: string;
    startTime: string;
    endTime: string;
    room: string;
  } | null;
  onSave?: (data: any) => void;
  error?: string | null;
  setError?: (err: string | null) => void;
  defaultDate?: Date | null;
  defaultStartTime?: string;
  defaultEndTime?: string;
}

export default function BookingModal({ 
  open, 
  onClose, 
  booking, 
  onSave, 
  error, 
  setError, 
  defaultDate = null, 
  defaultStartTime, 
  defaultEndTime 
}: BookingModalProps) {
  const { user: currentUser } = useAuth();
  const [date, setDate] = useState<Date | undefined>(
    booking ? new Date(booking.startTime) : (defaultDate || new Date())
  );
  
  // Get user info from auth context
  const user = booking?.user || currentUser?.username || '';
  const email = booking?.email || currentUser?.email || '';
  const phone = booking?.phone || currentUser?.phoneNumber || '';
  
  // Initialize start and end times from props
  const getInitialStartTime = () => {
    if (booking) return format(new Date(booking.startTime), 'HH:mm');
    if (defaultStartTime) return format(new Date(defaultStartTime), 'HH:mm');
    return '09:00';
  };
  
  const getInitialEndTime = () => {
    if (booking) return format(new Date(booking.endTime), 'HH:mm');
    if (defaultEndTime) return format(new Date(defaultEndTime), 'HH:mm');
    // If we have a start time but no end time, set end time to 1 hour after start
    if (defaultStartTime) {
      const end = new Date(defaultStartTime);
      end.setHours(end.getHours() + 1);
      return format(end, 'HH:mm');
    }
    return '10:00';
  };
  
  const [startTime, setStartTime] = useState(getInitialStartTime());
  const [endTime, setEndTime] = useState(getInitialEndTime());
  
  // Update times when default props change
  useEffect(() => {
    if (defaultStartTime) {
      setStartTime(format(new Date(defaultStartTime), 'HH:mm'));
    }
    if (defaultEndTime) {
      setEndTime(format(new Date(defaultEndTime), 'HH:mm'));
    } else if (defaultStartTime) {
      // If only start time is provided, set end time to 1 hour later
      const end = new Date(defaultStartTime);
      end.setHours(end.getHours() + 1);
      setEndTime(format(end, 'HH:mm'));
    }
  }, [defaultStartTime, defaultEndTime]);
  // Track if user has changed end time after modal opens
  const [isEndTimeDirty, setIsEndTimeDirty] = useState(false);
  const [room, setRoom] = useState(booking?.room || 'room-1');
  const [startClockOpen, setStartClockOpen] = useState(false);
  const [endClockOpen, setEndClockOpen] = useState(false);

  const SAVE_ERR_MSG = 'This room is already booked for the selected time period';
  const [popoverOpen, setPopoverOpen] = useState(false);
  const saveBtnRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (error === SAVE_ERR_MSG) setPopoverOpen(true);
    else setPopoverOpen(false);
  }, [error]);
  // Whenever we open modal (create), reset isEndTimeDirty to false
  useEffect(() => {
    if (!open) return;
    if (!booking && defaultDate) setDate(defaultDate);
    setIsEndTimeDirty(false);
    setStartClockOpen(false);
    setEndClockOpen(false);
  }, [open, booking, defaultDate]);
  // Sync endTime when startTime changes (for new bookings or when user hasn't manually overridden)
  useEffect(() => {
    if (booking) return;
    if (!isEndTimeDirty) {
      const [startH, startM] = startTime.split(":").map(Number);
      const padded = (n: number) => String(n).padStart(2, '0');
      const newEndHour = (startH + 1) % 24;
      setEndTime(`${padded(newEndHour)}:${padded(startM)}`);
    }
  }, [startTime, booking, isEndTimeDirty]);
  const handlePopoverClose = () => {
    setPopoverOpen(false);
    setError && setError(null);
  };

  const timeStringToDayjs = (time: string): Dayjs => {
    const [hours, minutes] = time.split(':').map(Number);
    const now = dayjs();
    return now.hour(hours).minute(minutes).second(0).millisecond(0);
  };
  
  const getMinTime = (): Dayjs => {
    return dayjs().startOf('day'); // Start of day (midnight)
  };
  
  const getMaxTime = (): Dayjs => {
    return dayjs().endOf('day'); // End of day (23:59:59)
  };

  // Helper function to format a date to ISO string with validation
  const formatToISO = (date: Date): string => {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      throw new Error(`Invalid date: ${date}`);
    }
    return d.toISOString();
  };

  const formatDisplayTime = (time: string | Date) => {
    try {
      // Handle case where time is a Date object or date string
      if (time instanceof Date || (typeof time === 'object' && 'getTime' in time)) {
        return format(new Date(time), 'h:mm aa');
      }
      
      // Handle case where time is a time string (e.g., '13:30' or ISO string)
      if (typeof time === 'string') {
        // If it's an ISO string, parse it directly
        if (time.includes('T') || time.endsWith('Z')) {
          return format(new Date(time), 'h:mm aa');
        }
        
        // If it's a time string (HH:MM), combine with today's date
        if (time.match(/^\d{1,2}:\d{2}$/)) {
          const [hours, minutes] = time.split(':').map(Number);
          const tempDate = new Date();
          tempDate.setHours(hours, minutes, 0, 0);
          return format(tempDate, 'h:mm aa');
        }
      }
      
      // Default fallback
      return time || 'Invalid time';
    } catch (error) {
      console.error('Error formatting time:', { time, error });
      return 'Invalid time';
    }
  };

  const getStartMinTime = (): Dayjs | undefined => {
    if (!date) return undefined;
    const today = new Date();
    if (date.toDateString() !== today.toDateString()) return undefined;
    return dayjs().startOf('day').hour(today.getHours()).minute(today.getMinutes());
  };

  const handleSave = () => {
    if (!date) {
      setError && setError('Please select a date.');
      return;
    }

    try {
      // Parse time strings to hours and minutes
      const [startHours, startMinutes] = startTime.split(":").map(Number);
      const [endHours, endMinutes] = endTime.split(":").map(Number);
      
      // Create date objects in local time
      const startDate = new Date(date);
      startDate.setHours(startHours, startMinutes, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(endHours, endMinutes, 0, 0);
      
      const now = new Date();
      
      // Debug logs
      console.log('=== Date Debug ===');
      console.log('Base date:', date);
      console.log('Start time:', startTime, 'Parsed hours:', startHours, startMinutes);
      console.log('End time:', endTime, 'Parsed hours:', endHours, endMinutes);
      console.log('Start date:', startDate.toString());
      console.log('End date:', endDate.toString());
      
      // Basic validation
      if (isNaN(startDate.getTime())) {
        throw new Error(`Invalid start date: ${startDate.toString()}`);
      }
      if (isNaN(endDate.getTime())) {
        throw new Error(`Invalid end date: ${endDate.toString()}`);
      }
      
      // Check if dates are valid
      if (isNaN(startDate.getTime())) {
        setError && setError(`Invalid start date/time format: ${startTime}`);
        return;
      }
      
      if (isNaN(endDate.getTime())) {
        setError && setError(`Invalid end date/time format: ${endTime}`);
        return;
      }
      
      // Check if end time is after start time
      if (endDate <= startDate) {
        setError && setError(`End time (${formatDisplayTime(endTime)}) must be after start time (${formatDisplayTime(startTime)})`);
        return;
      }
      
      // Check if booking is in the past (with 15-minute buffer)
      const bufferTime = 15 * 60 * 1000; // 15 minutes in milliseconds
      if (startDate.getTime() < (now.getTime() - bufferTime)) {
        const formattedStart = format(startDate, 'PPpp');
        const formattedNow = format(now, 'PPpp');
        setError && setError(`Cannot book a room in the past. Selected time: ${formattedStart}, Current time: ${formattedNow}`);
        return;
      }
      
      // Format dates as ISO strings without timezone offset for the server
      const formatToISO = (date: Date) => {
        // Create a new date object to avoid modifying the original
        const d = new Date(date);
        // Use toISOString() which handles timezone conversion properly
        return d.toISOString();
      };
      
      // Log the raw date objects
      console.log('Raw Date Objects:', {
        startDate: startDate.toString(),
        endDate: endDate.toString(),
        startDateISO: startDate.toISOString(),
        endDateISO: endDate.toISOString(),
        startTimeValue: formatToISO(startDate),
        endTimeValue: formatToISO(endDate)
      });

      // Ensure we're using the current user's details
      const currentUserEmail = currentUser?.email || email || '';
      const currentUserPhone = currentUser?.phoneNumber || phone || '';
      
      const bookingData = {
        user: currentUser?.username || user,
        email: currentUserEmail,
        phone: currentUserPhone,
        startTime: formatToISO(startDate),
        endTime: formatToISO(endDate),
        room
      };
      
      console.log('Booking data with user details:', {
        ...bookingData,
        // Hide sensitive data in logs
        email: currentUserEmail ? '[REDACTED]' : 'MISSING',
        phone: currentUserPhone ? '[REDACTED]' : 'MISSING',
        user: bookingData.user || 'MISSING'
      });
      
      // Add detailed validation before saving
      console.log('=== DEBUG: Date Validation ===');
      console.log('Raw startTime:', startTime, 'Parsed:', new Date(startTime));
      console.log('Raw endTime:', endTime, 'Parsed:', new Date(endTime));
      console.log('Raw date:', date, 'Type:', typeof date);
      
      // Validate dates
      const startDateObj = new Date(bookingData.startTime);
      const endDateObj = new Date(bookingData.endTime);
      
      if (isNaN(startDateObj.getTime())) {
        throw new Error(`Invalid start date format: ${bookingData.startTime}`);
      }
      if (isNaN(endDateObj.getTime())) {
        throw new Error(`Invalid end date format: ${bookingData.endTime}`);
      }
      
      console.log('Sending booking data (stringified):', JSON.stringify(bookingData, null, 2));
      console.log('Saving booking (raw object):', {
        ...bookingData,
        // Add type information for debugging
        startTimeType: typeof bookingData.startTime,
        endTimeType: typeof bookingData.endTime,
        startDateInstance: startDateObj.toString(),
        endDateInstance: endDateObj.toString()
      });
      
      try {
        onSave?.(bookingData);
      } catch (saveError) {
        console.error('Error in onSave callback:', saveError);
        throw saveError;
      }
    } catch (error) {
      console.error('=== DEBUG: Error Details ===');
      console.error('Error object:', error);
      console.error('Start time value:', startTime, 'Type:', typeof startTime);
      console.error('End time value:', endTime, 'Type:', typeof endTime);
      console.error('Date value:', date, 'Type:', typeof date);
      
      // Simple error message showing the exact values
      let errorMessage = 'Error creating booking. ';
      
      if (error instanceof Error) {
        // If we have a specific error message, use it, otherwise show the raw values
        errorMessage += error.message || `Check these values: Start: ${startTime}, End: ${endTime}, Date: ${date}`;
      }
      
      setError && setError(errorMessage + ' Please try again.');
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md" data-testid="dialog-booking-edit">
        <DialogHeader>
          <DialogTitle>{booking ? 'Edit Booking' : 'New Booking'}</DialogTitle>
        </DialogHeader>
        
        {error && error !== SAVE_ERR_MSG && (
          <div className="bg-destructive/10 border border-destructive text-destructive text-sm rounded px-3 py-2 mb-4 flex items-center justify-between">
            <span>{error}</span>
            {setError && (
              <button onClick={() => setError(null)} className="text-destructive text-xs ml-3">Dismiss</button>
            )}
          </div>
        )}

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-time" className="text-sm font-medium">Start Time</Label>
              <Popover open={startClockOpen} onOpenChange={setStartClockOpen}>
                <PopoverTrigger asChild>
                  <button
                    id="start-time"
                    type="button"
                    className="mt-1 w-full border border-input rounded-md px-3 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    data-testid="input-start-time"
                  >
                    {formatDisplayTime(startTime)}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="p-0 w-auto" sideOffset={5}>
                  <div className="p-4">
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <TimeClock
                        value={timeStringToDayjs(startTime)}
                        onChange={(value) => {
                          if (!value) return;
                          setStartTime(value.format('HH:mm'));
                        }}
                        onViewChange={() => {}}
                        ampm={false}
                        minutesStep={15}
                        minTime={getMinTime()}
                        maxTime={getMaxTime()}
                        views={['hours', 'minutes']}
                        sx={{
                          '& .MuiClock-pin, & .MuiClockPointer-root, & .MuiClockPointer-thumb': {
                            backgroundColor: 'hsl(var(--primary))',
                            borderColor: 'hsl(var(--primary))',
                          },
                          '& .MuiClockNumber-root': {
                            color: 'hsl(var(--foreground))',
                          },
                          '& .MuiClockNumber-root.Mui-selected': {
                            color: 'white',
                          },
                          '& .MuiClockNumber-root.Mui-disabled': {
                            color: 'hsl(var(--muted-foreground) / 0.5)',
                          },
                        }}
                      />
                      <div className="mt-4 flex justify-end">
                        <Button 
                          size="sm" 
                          onClick={() => setStartClockOpen(false)}
                          variant="outline"
                          className="h-8"
                        >
                          Done
                        </Button>
                      </div>
                    </LocalizationProvider>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="end-time" className="text-sm font-medium">End Time</Label>
              <Popover open={endClockOpen} onOpenChange={setEndClockOpen}>
                <PopoverTrigger asChild>
                  <button
                    id="end-time"
                    type="button"
                    className="mt-1 w-full border border-input rounded-md px-3 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    data-testid="input-end-time"
                  >
                    {formatDisplayTime(endTime)}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="p-0 w-auto" sideOffset={5}>
                  <div className="p-4">
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <TimeClock
                        value={timeStringToDayjs(endTime)}
                        onChange={(value) => {
                          if (!value) return;
                          setEndTime(value.format('HH:mm'));
                          setIsEndTimeDirty(true);
                        }}
                        onViewChange={() => {}}
                        ampm={false}
                        minutesStep={15}
                        minTime={timeStringToDayjs(startTime)}
                        maxTime={getMaxTime()}
                        views={['hours', 'minutes']}
                        sx={{
                          '& .MuiClock-pin, & .MuiClockPointer-root, & .MuiClockPointer-thumb': {
                            backgroundColor: 'hsl(var(--primary))',
                            borderColor: 'hsl(var(--primary))',
                          },
                          '& .MuiClockNumber-root': {
                            color: 'hsl(var(--foreground))',
                          },
                          '& .MuiClockNumber-root.Mui-selected': {
                            color: 'white',
                          },
                          '& .MuiClockNumber-root.Mui-disabled': {
                            color: 'hsl(var(--muted-foreground) / 0.5)',
                          },
                        }}
                      />
                      <div className="mt-4 flex justify-end">
                        <Button 
                          size="sm" 
                          onClick={() => setEndClockOpen(false)}
                          variant="outline"
                          className="h-8"
                        >
                          Done
                        </Button>
                      </div>
                    </LocalizationProvider>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label htmlFor="room" className="text-sm font-medium">Boardroom</Label>
            <Select value={room} onValueChange={setRoom}>
              <SelectTrigger className="mt-1" data-testid="select-room">
                <SelectValue placeholder="Select a room" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="room-1">Boardroom 1</SelectItem>
                <SelectItem value="room-2">Boardroom 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2" style={{ position: 'relative' }}>
          <Popover open={popoverOpen} onOpenChange={(open) => { if (!open) handlePopoverClose(); }}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                onClick={onClose}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
            </PopoverTrigger>
            <PopoverContent align="center" sideOffset={8} className="bg-destructive text-destructive-foreground">
              {SAVE_ERR_MSG}
            </PopoverContent>
          </Popover>
          <Button 
            onClick={handleSave}
            data-testid="button-save"
            ref={saveBtnRef}
          >
            Save Changes
          </Button>
        </DialogFooter>
        </DialogContent>
      </Dialog>
    </LocalizationProvider>
  );
}

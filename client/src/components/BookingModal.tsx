import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useRef, useEffect } from 'react';
import { format, parse, setHours, setMinutes, addHours, isAfter, isBefore, set } from 'date-fns';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
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
}

export default function BookingModal({ open, onClose, booking, onSave, error, setError, defaultDate = null }: BookingModalProps) {
  const [date, setDate] = useState<Date | undefined>(
    booking ? new Date(booking.startTime) : (defaultDate || new Date())
  );
  const [user, setUser] = useState(booking?.user || '');
  const [email, setEmail] = useState(booking?.email || '');
  const [phone, setPhone] = useState(booking?.phone || '');
  const [startTime, setStartTime] = useState<Date>(
    booking ? new Date(booking.startTime) : setMinutes(setHours(new Date(), 9), 0)
  );
  const [endTime, setEndTime] = useState<Date>(
    booking ? new Date(booking.endTime) : setMinutes(setHours(new Date(), 10), 0)
  );
  const [isStartTimeOpen, setIsStartTimeOpen] = useState(false);
  const [isEndTimeOpen, setIsEndTimeOpen] = useState(false);
  // Track if user has changed end time after modal opens
  const [isEndTimeDirty, setIsEndTimeDirty] = useState(false);
  const [room, setRoom] = useState(booking?.room || 'room-1');

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
  }, [open, booking, defaultDate]);
  // Sync endTime when startTime changes (for new bookings or when user hasn't manually overridden)
  useEffect(() => {
    if (booking) return;
    if (!isEndTimeDirty) {
      const newEndTime = addHours(startTime, 1);
      setEndTime(newEndTime);
    }
  }, [startTime, booking, isEndTimeDirty]);
  const handlePopoverClose = () => {
    setPopoverOpen(false);
    setError && setError(null);
  };

  const handleSave = () => {
    // Validate required fields
    if (!email.trim()) {
      setError && setError('Email is required');
      return;
    }
    if (!phone.trim()) {
      setError && setError('Phone number is required');
      return;
    }
    
    if (date) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const selDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      if (selDate < today) {
        setError && setError('You cannot book rooms before today.');
        return;
      }
      // Block start times in the past for today
      if (selDate.getTime() === today.getTime()) {
        const userStart = new Date(selDate);
        userStart.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
        if (userStart.getTime() < now.getTime()) {
          setError && setError('You cannot book rooms before the current time.');
          return;
        }
      }
    }
    const bookingData = {
      user,
      email,
      phone,
      date,
      startTime: format(startTime, 'HH:mm'),
      endTime: format(endTime, 'HH:mm'),
      room
    };
    console.log('Saving booking:', bookingData);
    onSave?.(bookingData);
  };

  return (
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
          <div className="space-y-4">
            <div>
              <Label htmlFor="user" className="text-sm font-medium">Name</Label>
              <Input
                id="user"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="mt-1"
                data-testid="input-user"
                placeholder="Enter your name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                  data-testid="input-email"
                  placeholder="email@example.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1"
                  data-testid="input-phone"
                  placeholder="+1 (___) ___-____"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Select Date</Label>
            <div className="border rounded-md p-3">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                fromDate={new Date(new Date().setHours(0,0,0,0))} // today min
                className="mx-auto"
                data-testid="calendar-booking-date"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-time" className="text-sm font-medium block mb-1">Start Time</Label>
              <Popover open={isStartTimeOpen} onOpenChange={setIsStartTimeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startTime && "text-muted-foreground"
                    )}
                    data-testid="input-start-time"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {format(startTime, 'h:mm a')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <div className="p-4">
                      <TimeClock
                        value={dayjs(startTime)}
                        onChange={(newTime) => {
                          if (newTime) {
                            setStartTime(newTime.toDate());
                          }
                        }}
                        ampm={false}
                        minutesStep={5}
                        views={['hours', 'minutes']}
                        className="[& .MuiClock-clock]:bg-accent/10 [& .MuiClock-clock]:dark:bg-accent/20"
                      />
                      <div className="flex justify-between mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsStartTimeOpen(false)}
                        >
                          Done
                        </Button>
                      </div>
                    </div>
                  </LocalizationProvider>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="end-time" className="text-sm font-medium block mb-1">End Time</Label>
              <Popover open={isEndTimeOpen} onOpenChange={setIsEndTimeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endTime && "text-muted-foreground"
                    )}
                    data-testid="input-end-time"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {format(endTime, 'h:mm a')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <div className="p-4">
                      <TimeClock
                        value={dayjs(endTime)}
                        onChange={(newTime) => {
                          if (newTime) {
                            setEndTime(newTime.toDate());
                            setIsEndTimeDirty(true);
                          }
                        }}
                        ampm={false}
                        minutesStep={5}
                        views={['hours', 'minutes']}
                        className="[& .MuiClock-clock]:bg-accent/10 [& .MuiClock-clock]:dark:bg-accent/20"
                      />
                      <div className="flex justify-between mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEndTimeOpen(false)}
                        >
                          Done
                        </Button>
                      </div>
                    </div>
                  </LocalizationProvider>
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
  );
}

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

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
  const [startTime, setStartTime] = useState(
    booking ? format(new Date(booking.startTime), 'HH:mm') : '09:00'
  );
  const [endTime, setEndTime] = useState(
    booking ? format(new Date(booking.endTime), 'HH:mm') : '10:00'
  );
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

  const handleSave = () => {
    if (date) {
      const today = new Date();
      today.setHours(0,0,0,0);
      const cmpDate = new Date(date);
      cmpDate.setHours(0,0,0,0);
      if (cmpDate < today) {
        setError && setError('You cannot book rooms before today.');
        return;
      }
    }
    const bookingData = {
      user,
      email,
      phone,
      date,
      startTime,
      endTime,
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
              <Label htmlFor="start-time" className="text-sm font-medium">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1"
                data-testid="input-start-time"
              />
            </div>
            <div>
              <Label htmlFor="end-time" className="text-sm font-medium">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => { setEndTime(e.target.value); setIsEndTimeDirty(true); }}
                className="mt-1"
                data-testid="input-end-time"
              />
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

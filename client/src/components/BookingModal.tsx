import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { format } from 'date-fns';

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
}

export default function BookingModal({ open, onClose, booking, onSave }: BookingModalProps) {
  const [date, setDate] = useState<Date | undefined>(
    booking ? new Date(booking.startTime) : new Date()
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
  const [room, setRoom] = useState(booking?.room || 'room-1');

  const handleSave = () => {
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
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="dialog-booking-edit">
        <DialogHeader>
          <DialogTitle>{booking ? 'Edit Booking' : 'New Booking'}</DialogTitle>
        </DialogHeader>
        
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
                onChange={(e) => setEndTime(e.target.value)}
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
                <SelectItem value="room-1">Conference Room A</SelectItem>
                <SelectItem value="room-2">Conference Room B</SelectItem>
                <SelectItem value="room-3">Executive Boardroom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            data-testid="button-save"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import BookingModal from '../BookingModal';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function BookingModalExample() {
  const [open, setOpen] = useState(false);

  const mockBooking = {
    id: '1',
    user: 'John Smith',
    email: 'john.smith@company.com',
    phone: '+1 (555) 123-4567',
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 90 * 60000).toISOString(),
    room: 'Conference Room A',
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Booking Modal</Button>
      <BookingModal
        open={open}
        onClose={() => setOpen(false)}
        booking={mockBooking}
        onSave={(data) => console.log('Saved:', data)}
      />
    </>
  );
}

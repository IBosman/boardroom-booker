import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card } from '@/components/ui/card';

interface Booking {
  id: string;
  title: string;
  start: string;
  end?: string;
  user: string;
  email: string;
  phone: string;
}

interface BookingCalendarProps {
  bookings: Booking[];
  onEventClick?: (booking: Booking) => void;
}

export default function BookingCalendar({ bookings, onEventClick }: BookingCalendarProps) {
  return (
    <Card className="p-6">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        }}
        events={bookings}
        editable={true}
        selectable={true}
        eventClick={(info) => {
          const booking = bookings.find(b => b.id === info.event.id);
          if (booking && onEventClick) {
            onEventClick(booking);
          }
        }}
        height="auto"
        eventClassNames="cursor-pointer"
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
      />
    </Card>
  );
}

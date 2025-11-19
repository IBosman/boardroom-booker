import BookingCalendar from '../BookingCalendar';

export default function BookingCalendarExample() {
  const today = new Date();
  const mockBookings = [
    {
      id: '1',
      title: 'Team Meeting',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0).toISOString(),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 30).toISOString(),
      user: 'John Smith',
      email: 'john.smith@company.com',
      phone: '+1 (555) 123-4567',
    },
    {
      id: '2',
      title: 'Client Presentation',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0).toISOString(),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 30).toISOString(),
      user: 'Sarah Johnson',
      email: 'sarah.j@company.com',
      phone: '+1 (555) 234-5678',
    },
    {
      id: '3',
      title: 'Training Session',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0).toISOString(),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 30).toISOString(),
      user: 'Mike Davis',
      email: 'mike.d@company.com',
      phone: '+1 (555) 345-6789',
    },
    {
      id: '4',
      title: 'All Day Event',
      start: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0],
      user: 'Emily Chen',
      email: 'emily.chen@company.com',
      phone: '+1 (555) 456-7890',
    },
    {
      id: '5',
      title: 'Birthday Party',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 7, 0).toISOString(),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 9, 0).toISOString(),
      user: 'Lisa Wang',
      email: 'lisa.w@company.com',
      phone: '+1 (555) 890-1234',
    },
    {
      id: '6',
      title: 'Conference',
      start: new Date(today.getFullYear(), today.getMonth(), 17).toISOString().split('T')[0],
      end: new Date(today.getFullYear(), today.getMonth(), 19).toISOString().split('T')[0],
      user: 'David Brown',
      email: 'david.b@company.com',
      phone: '+1 (555) 567-8901',
    },
  ];

  return (
    <BookingCalendar 
      bookings={mockBookings}
      onEventClick={(booking) => console.log('Booking clicked:', booking)}
    />
  );
}

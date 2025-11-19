import BookingsTable from '../BookingsTable';

export default function BookingsTableExample() {
  const today = new Date();
  
  const mockBookings = [
    {
      id: '1',
      user: 'John Smith',
      email: 'john.smith@company.com',
      phone: '+1 (555) 123-4567',
      startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0).toISOString(),
      endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 30).toISOString(),
      room: 'Conference Room A',
    },
    {
      id: '2',
      user: 'Sarah Johnson',
      email: 'sarah.j@company.com',
      phone: '+1 (555) 234-5678',
      startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0).toISOString(),
      endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 30).toISOString(),
      room: 'Executive Boardroom',
    },
    {
      id: '3',
      user: 'Mike Davis',
      email: 'mike.d@company.com',
      phone: '+1 (555) 345-6789',
      startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0).toISOString(),
      endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 30).toISOString(),
      room: 'Conference Room B',
    },
  ];

  return (
    <BookingsTable
      bookings={mockBookings}
      onEdit={(id) => console.log('Edit booking:', id)}
      onDelete={(id) => console.log('Delete booking:', id)}
    />
  );
}

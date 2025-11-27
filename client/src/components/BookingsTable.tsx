import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Booking {
  id: string;
  user: string;
  email: string;
  phone: string;
  startTime: string;
  endTime: string;
  room: string;
}

interface BookingsTableProps {
  bookings: Booking[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function BookingsTable({ bookings, onEdit, onDelete }: BookingsTableProps) {
  const { user: currentUser, isAdmin } = useAuth();
  
  const canEditBooking = (bookingUser: string) => {
    return isAdmin || currentUser?.username === bookingUser;
  };
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateDuration = (start: string, end: string) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Room</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow 
              key={booking.id} 
              className="hover-elevate"
              data-testid={`row-booking-${booking.id}`}
            >
              <TableCell className="font-medium" data-testid={`text-user-${booking.id}`}>
                {booking.user}
              </TableCell>
              <TableCell className="text-muted-foreground" data-testid={`text-email-${booking.id}`}>
                {booking.email}
              </TableCell>
              <TableCell className="text-muted-foreground" data-testid={`text-phone-${booking.id}`}>
                {booking.phone}
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="text-sm">{formatDate(booking.startTime)}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {calculateDuration(booking.startTime, booking.endTime)}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{booking.room}</TableCell>
              <TableCell className="text-right">
                {canEditBooking(booking.user) && (
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => onEdit?.(booking.id)}
                      data-testid={`button-edit-${booking.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive/90"
                      onClick={() => onDelete?.(booking.id)}
                      data-testid={`button-delete-${booking.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

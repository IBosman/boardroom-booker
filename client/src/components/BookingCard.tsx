import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Pencil, Trash2 } from 'lucide-react';

interface Booking {
  id: string;
  user: string;
  email: string;
  phone: string;
  startTime: string;
  endTime: string;
  room: string;
}

interface BookingCardProps extends Booking {
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function BookingCard({ 
  id, 
  user, 
  email, 
  phone, 
  startTime, 
  endTime, 
  room,
  onEdit,
  onDelete 
}: BookingCardProps) {
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

  return (
    <Card className="hover-elevate" data-testid={`card-booking-${id}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-base truncate" data-testid={`text-user-${id}`}>{user}</h3>
          <p className="text-xs text-muted-foreground mt-1">{room}</p>
        </div>
        <Badge variant="secondary" className="shrink-0" data-testid={`badge-time-${id}`}>
          {formatTime(startTime)}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4 shrink-0" />
            <span className="truncate" data-testid={`text-email-${id}`}>{email}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0" />
            <span data-testid={`text-phone-${id}`}>{phone}</span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 pt-2 border-t">
          <span className="text-xs text-muted-foreground">
            {formatDate(startTime)} • {formatTime(startTime)} - {formatTime(endTime)}
          </span>
          <div className="flex gap-1">
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8"
              onClick={() => onEdit?.(id)}
              data-testid={`button-edit-${id}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8"
              onClick={() => onDelete?.(id)}
              data-testid={`button-delete-${id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

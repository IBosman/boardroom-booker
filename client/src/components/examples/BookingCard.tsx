import BookingCard from '../BookingCard';

export default function BookingCardExample() {
  const today = new Date();
  
  return (
    <div className="max-w-sm">
      <BookingCard
        id="1"
        user="John Smith"
        email="john.smith@company.com"
        phone="+1 (555) 123-4567"
        startTime={new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0).toISOString()}
        endTime={new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 30).toISOString()}
        room="Conference Room A"
        onEdit={(id) => console.log('Edit booking:', id)}
        onDelete={(id) => console.log('Delete booking:', id)}
      />
    </div>
  );
}

import { promises as fs, existsSync } from 'fs';
import { randomUUID } from 'crypto';
import path from 'path';

type Booking = {
  id: string;
  user: string;
  email: string;
  phone: string;
  startTime: Date;
  endTime: Date;
  room: string;
  createdAt: Date;
};

type InsertBooking = Omit<Booking, 'id' | 'createdAt'>;

const STORAGE_FILE = path.join(process.cwd(), 'data', 'bookings.json');

// Ensure the data directory exists
async function ensureDataDirectory(): Promise<void> {
  try {
    await fs.mkdir(path.dirname(STORAGE_FILE), { recursive: true });
    if (!existsSync(STORAGE_FILE)) {
      await fs.writeFile(STORAGE_FILE, '[]');
    }
  } catch (error) {
    console.error('Error setting up data directory:', error);
    throw error;
  }
}

export class JsonStorage {
  private bookings: Map<string, Booking> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      await ensureDataDirectory();
      
      const data = await fs.readFile(STORAGE_FILE, 'utf-8');
      const bookings = JSON.parse(data).map((booking: Omit<Booking, 'startTime' | 'endTime' | 'createdAt'> & {
        startTime: string;
        endTime: string;
        createdAt?: string;
      }) => ({
        ...booking,
        startTime: new Date(booking.startTime),
        endTime: new Date(booking.endTime),
        createdAt: booking.createdAt ? new Date(booking.createdAt) : new Date()
      }));
      this.bookings = new Map(bookings.map((booking: Booking) => [booking.id, booking]));
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing storage:', error);
      throw error;
    }
  }

  private async saveToDisk() {
    if (!this.initialized) await this.initialize();
    const bookings = Array.from(this.bookings.values()).map(booking => {
      // Helper function to ensure we have an ISO string
      const toISO = (date: Date | string): string => 
        date instanceof Date ? date.toISOString() : new Date(date).toISOString();
      
      return {
        ...booking,
        startTime: toISO(booking.startTime),
        endTime: toISO(booking.endTime),
        createdAt: booking.createdAt ? toISO(booking.createdAt) : new Date().toISOString()
      };
    });
    await fs.writeFile(STORAGE_FILE, JSON.stringify(bookings, null, 2));
  }

  private hasTimeConflict(room: string, startTime: Date, endTime: Date, excludeBookingId?: string): boolean {
    // Convert to timestamps for easier comparison
    const newStart = startTime.getTime();
    const newEnd = endTime.getTime();

    // Check all existing bookings for the same room
    for (const [id, booking] of this.bookings.entries()) {
      // Skip the booking we're updating (if any)
      if (id === excludeBookingId) continue;
      
      // Only check bookings for the same room
      if (booking.room === room) {
        const existingStart = booking.startTime.getTime();
        const existingEnd = booking.endTime.getTime();
        
        // Check for time overlap
        if (newStart < existingEnd && newEnd > existingStart) {
          return true; // Conflict found
        }
      }
    }
    
    return false; // No conflicts
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    if (!this.initialized) await this.initialize();
    
    // Ensure we have proper Date objects
    const startTime = booking.startTime instanceof Date 
      ? new Date(booking.startTime) 
      : new Date(booking.startTime);
      
    const endTime = booking.endTime instanceof Date 
      ? new Date(booking.endTime) 
      : new Date(booking.endTime);

    // Validate time range
    if (startTime >= endTime) {
      throw new Error('End time must be after start time');
    }

    // Check for time conflicts
    if (this.hasTimeConflict(booking.room, startTime, endTime)) {
      throw new Error('This room is already booked for the selected time period');
    }

    const id = randomUUID();
    const now = new Date();
    const newBooking: Booking = {
      ...booking,
      id,
      startTime,
      endTime,
      createdAt: now,
    };

    this.bookings.set(id, newBooking);
    await this.saveToDisk();
    return { ...newBooking };
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    if (!this.initialized) await this.initialize();
    return this.bookings.get(id);
  }

  async listBookings(): Promise<Booking[]> {
    if (!this.initialized) await this.initialize();
    return Array.from(this.bookings.values());
  }

  async deleteBooking(id: string): Promise<boolean> {
    if (!this.initialized) await this.initialize();
    const existed = this.bookings.delete(id);
    if (existed) {
      await this.saveToDisk();
    }
    return existed;
  }

  async updateBooking(id: string, updates: Omit<Partial<Booking>, 'id' | 'createdAt'>): Promise<Booking | undefined> {
    if (!this.initialized) await this.initialize();
    
    const booking = this.bookings.get(id);
    if (!booking) return undefined;

    // Create a new object with only the fields that are allowed to be updated
    const updatedBooking: Booking = {
      ...booking,
      user: updates.user !== undefined ? updates.user : booking.user,
      email: updates.email !== undefined ? updates.email : booking.email,
      phone: updates.phone !== undefined ? updates.phone : booking.phone,
      room: updates.room !== undefined ? updates.room : booking.room,
      id: booking.id, // Preserve original ID
      createdAt: booking.createdAt, // Preserve original creation date
    };

    // Handle date updates with proper type conversion
    let startTime = booking.startTime;
    let endTime = booking.endTime;
    let datesUpdated = false;

    if (updates.startTime) {
      startTime = updates.startTime instanceof Date 
        ? new Date(updates.startTime)
        : new Date(updates.startTime);
      updatedBooking.startTime = startTime;
      datesUpdated = true;
    }
    
    if (updates.endTime) {
      endTime = updates.endTime instanceof Date 
        ? new Date(updates.endTime)
        : new Date(updates.endTime);
      updatedBooking.endTime = endTime;
      datesUpdated = true;
    }

    // Validate time range if dates were updated
    if (datesUpdated) {
      if (startTime >= endTime) {
        throw new Error('End time must be after start time');
      }

      // Check for time conflicts, excluding the current booking
      if (this.hasTimeConflict(
        updatedBooking.room,
        startTime,
        endTime,
        id // Exclude current booking from conflict check
      )) {
        throw new Error('This room is already booked for the selected time period');
      }
    }

    this.bookings.set(id, updatedBooking);
    await this.saveToDisk();
    return { ...updatedBooking };
  }

  // Optional: Add a method to clear all bookings (useful for testing)
  async clear() {
    this.bookings.clear();
    await this.saveToDisk();
  }
}

// Export a singleton instance
export const jsonStorage = new JsonStorage();

import { type User, type InsertUser, type Booking, type InsertBooking } from "@shared/schema";
import { jsonStorage } from "./json-storage";

// Base storage interface with user and booking methods
export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Booking methods
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBooking(id: string): Promise<Booking | undefined>;
  listBookings(): Promise<Booking[]>;
  deleteBooking(id: string): Promise<boolean>;
  updateBooking(id: string, updates: Omit<Partial<Booking>, 'id' | 'createdAt'>): Promise<Booking | undefined>;
}

// Implementation using JSON file storage
export class JsonStorage implements IStorage {
  // User methods (stub implementations since we're focusing on bookings)
  async getUser(id: string): Promise<User | undefined> {
    throw new Error('Not implemented');
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    throw new Error('Not implemented');
  }

  async createUser(user: InsertUser): Promise<User> {
    throw new Error('Not implemented');
  }

  // Booking methods
  async createBooking(booking: InsertBooking): Promise<Booking> {
    return jsonStorage.createBooking(booking);
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    return jsonStorage.getBooking(id);
  }

  async listBookings(): Promise<Booking[]> {
    return jsonStorage.listBookings();
  }

  async deleteBooking(id: string): Promise<boolean> {
    return jsonStorage.deleteBooking(id);
  }

  async updateBooking(id: string, updates: Omit<Partial<Booking>, 'id' | 'createdAt'>): Promise<Booking | undefined> {
    return jsonStorage.updateBooking(id, updates);
  }
}

// Export a single storage instance
export const storage = new JsonStorage();

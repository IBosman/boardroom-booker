import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { loginSchema, userService, generateToken, authenticateToken } from "./auth";

// Request validation schemas
// Helper to validate date strings with flexible format
const validateDate = (date: string): boolean => {
  // Try parsing the date - if it's valid, it's a valid date
  const d = new Date(date);
  return !isNaN(d.getTime());
};

const createBookingSchema = z.object({
  user: z.string().min(1, "User name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  startTime: z.string()
    .refine(validateDate, { message: "Invalid start date/time format" })
    .transform(str => new Date(str).toISOString()),
  endTime: z.string()
    .refine(validateDate, { message: "Invalid end date/time format" })
    .transform(str => new Date(str).toISOString()),
  room: z.string().min(1, "Room is required")
});

const updateBookingSchema = createBookingSchema.partial().extend({
  id: z.string().min(1, "Booking ID is required")
});

type CreateBookingInput = z.infer<typeof createBookingSchema>;
type UpdateBookingInput = z.infer<typeof updateBookingSchema>;

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; username: string };
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const router = express.Router();
  
  // Auth routes
  router.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = userService.create({ username, password });
      const token = generateToken(user);
      
      res.status(201).json({ user, token });
    } catch (error: any) {
      console.error("Registration error:", error);
      const status = error.message === 'Username already exists' ? 409 : 400;
      res.status(status).json({ 
        error: error.message || 'Registration failed' 
      });
    }
  });

  router.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = userService.validateCredentials(username, password);
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const token = generateToken(user);
      res.json({ user, token });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ error: 'Login failed' });
    }
  });

  // Verify user token and get current user info
  router.get("/api/me", authenticateToken, async (req: Request, res: Response) => {
    try {
      // If we got here, the token is valid (authenticateToken middleware passed)
      // Just return the user info from the token
      res.json({ 
        user: req.user,
        isAuthenticated: true
      });
    } catch (error) {
      console.error('Error in /api/me:', error);
      res.status(401).json({ 
        isAuthenticated: false,
        error: 'Invalid or expired token' 
      });
    }
  });

  // Get all bookings (public)
  router.get("/api/bookings", async (req: Request, res: Response) => {
    try {
      const bookings = await storage.listBookings();
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  // Create a new booking (public)
  router.post("/api/bookings", async (req: Request, res: Response) => {
    try {
      console.log('Incoming booking request:', JSON.stringify(req.body, null, 2));
      
      const result = createBookingSchema.safeParse(req.body);
      
      if (!result.success) {
        console.log('Validation errors:', result.error.errors);
        return res.status(400).json({
          error: "Validation failed",
          details: result.error.errors
        });
      }

      // Convert string dates to Date objects
      const bookingData = {
        ...result.data,
        startTime: new Date(result.data.startTime),
        endTime: new Date(result.data.endTime)
      };
      // Prevent bookings before today
      const now = new Date();
      const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const reqStart = new Date(bookingData.startTime);
      const reqStartUTC = new Date(Date.UTC(reqStart.getUTCFullYear(), reqStart.getUTCMonth(), reqStart.getUTCDate()));
      if (reqStartUTC < todayUTC) {
        return res.status(400).json({ error: 'You cannot book rooms before current date' });
      }
      // Prevent start time in the past (for today only), using UTC
      if (
        reqStartUTC.getTime() === todayUTC.getTime() &&
        reqStart.getTime() < now.getTime()
      ) {
        return res.status(400).json({ error: 'You cannot book rooms before the current time' });
      }

      const booking = await storage.createBooking(bookingData);
      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid booking data' });
    }
  });

  // Get a single booking
  router.get("/api/bookings/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const booking = await storage.getBooking(id);
      
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      res.json(booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ error: "Failed to fetch booking" });
    }
  });

  // Update an existing booking
  router.put("/api/bookings/:id", async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const input = updateBookingSchema.parse({ ...req.body, id });
      
      // Check if booking exists
      const existingBooking = await storage.getBooking(id);
      if (!existingBooking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      // Prepare update data with proper type conversion
      const updateData: Omit<Partial<Booking>, 'id' | 'createdAt'> = {};
      
      // Only include fields that are actually being updated
      if (input.user !== undefined) updateData.user = input.user;
      if (input.email !== undefined) updateData.email = input.email;
      if (input.phone !== undefined) updateData.phone = input.phone;
      if (input.room !== undefined) updateData.room = input.room;
      
      // Handle date conversions
      if (input.startTime !== undefined) {
        updateData.startTime = input.startTime instanceof Date 
          ? input.startTime 
          : new Date(input.startTime);
      }
      
      if (input.endTime !== undefined) {
        updateData.endTime = input.endTime instanceof Date 
          ? input.endTime 
          : new Date(input.endTime);
      }

      const updatedBooking = await storage.updateBooking(id, updateData);
      
      if (!updatedBooking) {
        return res.status(404).json({ error: "Failed to update booking" });
      }
      
      res.json(updatedBooking);
    } catch (error) {
      console.error("Error updating booking:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation error",
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to update booking" });
    }
  });

  // Delete a booking
  router.delete("/api/bookings/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteBooking(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting booking:", error);
      res.status(500).json({ error: "Failed to delete booking" });
    }
  });

  app.use(router);
  return createServer(app);
}

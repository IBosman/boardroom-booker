// server/prod.ts
import express2 from "express";
import path3 from "path";
import { fileURLToPath } from "url";

// server/routes.ts
import express from "express";
import { createServer } from "http";

// server/json-storage.ts
import { promises as fs, existsSync } from "fs";
import { randomUUID } from "crypto";
import path from "path";
var STORAGE_FILE = path.join(process.cwd(), "data", "bookings.json");
async function ensureDataDirectory() {
  try {
    await fs.mkdir(path.dirname(STORAGE_FILE), { recursive: true });
    if (!existsSync(STORAGE_FILE)) {
      await fs.writeFile(STORAGE_FILE, "[]");
    }
  } catch (error) {
    console.error("Error setting up data directory:", error);
    throw error;
  }
}
var JsonStorage = class {
  bookings = /* @__PURE__ */ new Map();
  initialized = false;
  constructor() {
    this.initialize();
  }
  async initialize() {
    if (this.initialized) return;
    try {
      await ensureDataDirectory();
      const data = await fs.readFile(STORAGE_FILE, "utf-8");
      const bookings = JSON.parse(data).map((booking) => ({
        ...booking,
        startTime: new Date(booking.startTime),
        endTime: new Date(booking.endTime),
        createdAt: booking.createdAt ? new Date(booking.createdAt) : /* @__PURE__ */ new Date()
      }));
      this.bookings = new Map(bookings.map((booking) => [booking.id, booking]));
      this.initialized = true;
    } catch (error) {
      console.error("Error initializing storage:", error);
      throw error;
    }
  }
  async saveToDisk() {
    if (!this.initialized) await this.initialize();
    const bookings = Array.from(this.bookings.values()).map((booking) => {
      const toISO = (date) => date instanceof Date ? date.toISOString() : new Date(date).toISOString();
      return {
        ...booking,
        startTime: toISO(booking.startTime),
        endTime: toISO(booking.endTime),
        createdAt: booking.createdAt ? toISO(booking.createdAt) : (/* @__PURE__ */ new Date()).toISOString()
      };
    });
    await fs.writeFile(STORAGE_FILE, JSON.stringify(bookings, null, 2));
  }
  hasTimeConflict(room, startTime, endTime, excludeBookingId) {
    const newStart = startTime.getTime();
    const newEnd = endTime.getTime();
    for (const [id, booking] of this.bookings.entries()) {
      if (id === excludeBookingId) continue;
      if (booking.room === room) {
        const existingStart = booking.startTime.getTime();
        const existingEnd = booking.endTime.getTime();
        if (newStart < existingEnd && newEnd > existingStart) {
          return true;
        }
      }
    }
    return false;
  }
  async createBooking(booking) {
    if (!this.initialized) await this.initialize();
    const startTime = booking.startTime instanceof Date ? new Date(booking.startTime) : new Date(booking.startTime);
    const endTime = booking.endTime instanceof Date ? new Date(booking.endTime) : new Date(booking.endTime);
    if (startTime >= endTime) {
      throw new Error("End time must be after start time");
    }
    if (this.hasTimeConflict(booking.room, startTime, endTime)) {
      throw new Error("This room is already booked for the selected time period");
    }
    const id = randomUUID();
    const now = /* @__PURE__ */ new Date();
    const newBooking = {
      ...booking,
      id,
      startTime,
      endTime,
      createdAt: now
    };
    this.bookings.set(id, newBooking);
    await this.saveToDisk();
    return { ...newBooking };
  }
  async getBooking(id) {
    if (!this.initialized) await this.initialize();
    return this.bookings.get(id);
  }
  async listBookings() {
    if (!this.initialized) await this.initialize();
    return Array.from(this.bookings.values());
  }
  async deleteBooking(id) {
    if (!this.initialized) await this.initialize();
    const existed = this.bookings.delete(id);
    if (existed) {
      await this.saveToDisk();
    }
    return existed;
  }
  async updateBooking(id, updates) {
    if (!this.initialized) await this.initialize();
    const booking = this.bookings.get(id);
    if (!booking) return void 0;
    const updatedBooking = {
      ...booking,
      user: updates.user !== void 0 ? updates.user : booking.user,
      email: updates.email !== void 0 ? updates.email : booking.email,
      phone: updates.phone !== void 0 ? updates.phone : booking.phone,
      room: updates.room !== void 0 ? updates.room : booking.room,
      id: booking.id,
      // Preserve original ID
      createdAt: booking.createdAt
      // Preserve original creation date
    };
    let startTime = booking.startTime;
    let endTime = booking.endTime;
    let datesUpdated = false;
    if (updates.startTime) {
      startTime = updates.startTime instanceof Date ? new Date(updates.startTime) : new Date(updates.startTime);
      updatedBooking.startTime = startTime;
      datesUpdated = true;
    }
    if (updates.endTime) {
      endTime = updates.endTime instanceof Date ? new Date(updates.endTime) : new Date(updates.endTime);
      updatedBooking.endTime = endTime;
      datesUpdated = true;
    }
    if (datesUpdated) {
      if (startTime >= endTime) {
        throw new Error("End time must be after start time");
      }
      if (this.hasTimeConflict(
        updatedBooking.room,
        startTime,
        endTime,
        id
        // Exclude current booking from conflict check
      )) {
        throw new Error("This room is already booked for the selected time period");
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
};
var jsonStorage = new JsonStorage();

// server/storage.ts
var JsonStorage2 = class {
  // User methods (stub implementations since we're focusing on bookings)
  async getUser(id) {
    throw new Error("Not implemented");
  }
  async getUserByUsername(username) {
    throw new Error("Not implemented");
  }
  async createUser(user) {
    throw new Error("Not implemented");
  }
  // Booking methods
  async createBooking(booking) {
    return jsonStorage.createBooking(booking);
  }
  async getBooking(id) {
    return jsonStorage.getBooking(id);
  }
  async listBookings() {
    return jsonStorage.listBookings();
  }
  async deleteBooking(id) {
    return jsonStorage.deleteBooking(id);
  }
  async updateBooking(id, updates) {
    return jsonStorage.updateBooking(id, updates);
  }
};
var storage = new JsonStorage2();

// server/routes.ts
import { z as z2 } from "zod";

// server/auth.ts
import jwt from "jsonwebtoken";
import { z } from "zod";
import fs2 from "fs";
import path2 from "path";
var JWT_SECRET = process.env.JWT_SECRET || "your-very-secure-secret-key";
var TOKEN_EXPIRY = "24h";
var loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});
function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    console.log("No token provided in Authorization header");
    return res.status(401).json({
      isAuthenticated: false,
      error: "Access token is required"
    });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const now = Math.floor(Date.now() / 1e3);
    if (decoded.exp && decoded.exp < now) {
      console.log("Token expired");
      return res.status(401).json({
        isAuthenticated: false,
        error: "Token has expired"
      });
    }
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    let errorMessage = "Invalid token";
    if (error instanceof jwt.TokenExpiredError) {
      errorMessage = "Token has expired";
    } else if (error instanceof jwt.JsonWebTokenError) {
      errorMessage = "Invalid token";
    }
    return res.status(401).json({
      isAuthenticated: false,
      error: errorMessage
    });
  }
}
var USERS_FILE = path2.join(process.cwd(), "data", "users.json");
if (!fs2.existsSync(USERS_FILE)) {
  fs2.mkdirSync(path2.dirname(USERS_FILE), { recursive: true });
  fs2.writeFileSync(USERS_FILE, "[]", "utf-8");
}
function readUsers() {
  try {
    const data = fs2.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading users file:", error);
    return [];
  }
}
function writeUsers(users) {
  try {
    fs2.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing users file:", error);
    throw new Error("Failed to save user data");
  }
}
function initializeAdminUser() {
  const adminUsername = "admin";
  const adminPassword = "Board$@dm1n";
  try {
    const users = readUsers();
    const adminExists = users.some((user) => user.username === adminUsername);
    if (!adminExists) {
      const newUser = {
        id: "admin-" + Date.now().toString(),
        username: adminUsername,
        email: "admin@example.com",
        phoneNumber: "+1234567890",
        password: adminPassword
        // In production, this should be hashed
      };
      users.push(newUser);
      writeUsers(users);
      console.log("Admin user created successfully");
    }
  } catch (error) {
    console.error("Error initializing admin user:", error);
  }
}
initializeAdminUser();
var userService = {
  // Find user by username (internal use only - includes password)
  findByUsername: (username) => {
    const users = readUsers();
    return users.find((user) => user.username === username);
  },
  // Get user by username (returns user without password, for external use)
  getUserByUsername: (username) => {
    const user = userService.findByUsername(username);
    if (!user) return void 0;
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
  // Create new user
  create: (userData) => {
    const users = readUsers();
    if (users.some((user) => user.username === userData.username)) {
      throw new Error("Username already exists");
    }
    if (users.some((user) => user.email === userData.email)) {
      throw new Error("Email already in use");
    }
    const newUser = {
      id: Date.now().toString(),
      username: userData.username,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      password: userData.password
    };
    users.push(newUser);
    writeUsers(users);
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  },
  // Validate user credentials
  validateCredentials: (username, password) => {
    const user = userService.findByUsername(username);
    if (!user || user.password !== password) return null;
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
};

// server/routes.ts
var validateDate = (date) => {
  const d = new Date(date);
  return !isNaN(d.getTime());
};
var createBookingSchema = z2.object({
  user: z2.string().min(1, "User name is required"),
  email: z2.string().email("Invalid email address"),
  phone: z2.string().min(1, "Phone number is required"),
  startTime: z2.string().refine(validateDate, { message: "Invalid start date/time format" }).transform((str) => new Date(str).toISOString()),
  endTime: z2.string().refine(validateDate, { message: "Invalid end date/time format" }).transform((str) => new Date(str).toISOString()),
  room: z2.string().min(1, "Room is required")
});
var updateBookingSchema = createBookingSchema.partial().extend({
  id: z2.string().min(1, "Booking ID is required")
});
async function registerRoutes(app2) {
  const router = express.Router();
  router.post("/api/auth/register", async (req, res) => {
    try {
      const signupSchema = z2.object({
        username: z2.string().min(1, "Username is required"),
        email: z2.string().email("Invalid email address"),
        phoneNumber: z2.string().min(1, "Phone number is required"),
        password: z2.string().min(8, "Password must be at least 8 characters long")
      });
      const { username, email, phoneNumber, password } = signupSchema.parse(req.body);
      const user = userService.create({
        username,
        email,
        phoneNumber,
        password
      });
      const token = generateToken(user);
      res.status(201).json({
        user,
        token
      });
    } catch (error) {
      console.error("Registration error:", error);
      let status = 400;
      let errorMessage = error.message || "Registration failed";
      if (error.message === "Username already exists" || error.message === "Email already in use") {
        status = 409;
      }
      res.status(status).json({
        error: errorMessage
      });
    }
  });
  router.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = userService.validateCredentials(username, password);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const token = generateToken(user);
      res.json({ user, token });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ error: "Login failed" });
    }
  });
  router.get("/api/me", authenticateToken, async (req, res) => {
    try {
      const user = userService.getUserByUsername(req.user?.username || "");
      if (!user) {
        return res.status(404).json({
          isAuthenticated: false,
          error: "User not found"
        });
      }
      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phoneNumber: user.phoneNumber
        },
        isAuthenticated: true
      });
    } catch (error) {
      console.error("Error in /api/me:", error);
      res.status(401).json({
        isAuthenticated: false,
        error: "Invalid or expired token"
      });
    }
  });
  router.get("/api/bookings", async (req, res) => {
    try {
      const bookings = await storage.listBookings();
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });
  router.post("/api/bookings", async (req, res) => {
    try {
      console.log("Incoming booking request:", JSON.stringify(req.body, null, 2));
      const result = createBookingSchema.safeParse(req.body);
      if (!result.success) {
        console.log("Validation errors:", result.error.errors);
        return res.status(400).json({
          error: "Validation failed",
          details: result.error.errors
        });
      }
      const bookingData = {
        ...result.data,
        startTime: new Date(result.data.startTime),
        endTime: new Date(result.data.endTime)
      };
      const now = /* @__PURE__ */ new Date();
      const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const reqStart = new Date(bookingData.startTime);
      const reqStartUTC = new Date(Date.UTC(reqStart.getUTCFullYear(), reqStart.getUTCMonth(), reqStart.getUTCDate()));
      if (reqStartUTC < todayUTC) {
        return res.status(400).json({ error: "You cannot book rooms before current date" });
      }
      if (reqStartUTC.getTime() === todayUTC.getTime() && reqStart.getTime() < now.getTime()) {
        return res.status(400).json({ error: "You cannot book rooms before the current time" });
      }
      const booking = await storage.createBooking(bookingData);
      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid booking data" });
    }
  });
  router.get("/api/bookings/:id", async (req, res) => {
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
  router.put("/api/bookings/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const input = updateBookingSchema.parse({ ...req.body, id });
      const existingBooking = await storage.getBooking(id);
      if (!existingBooking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      const updateData = {};
      if (input.user !== void 0) updateData.user = input.user;
      if (input.email !== void 0) updateData.email = input.email;
      if (input.phone !== void 0) updateData.phone = input.phone;
      if (input.room !== void 0) updateData.room = input.room;
      if (input.startTime !== void 0) {
        updateData.startTime = input.startTime instanceof Date ? input.startTime : new Date(input.startTime);
      }
      if (input.endTime !== void 0) {
        updateData.endTime = input.endTime instanceof Date ? input.endTime : new Date(input.endTime);
      }
      const updatedBooking = await storage.updateBooking(id, updateData);
      if (!updatedBooking) {
        return res.status(404).json({ error: "Failed to update booking" });
      }
      res.json(updatedBooking);
    } catch (error) {
      console.error("Error updating booking:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          error: "Validation error",
          details: error.errors
        });
      }
      res.status(500).json({ error: "Failed to update booking" });
    }
  });
  router.delete("/api/bookings/:id", async (req, res) => {
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
  app2.use(router);
  return createServer(app2);
}

// server/prod.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path3.dirname(__filename);
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
var server = await registerRoutes(app);
app.use(express2.static(path3.join(__dirname, "../dist/public"), {
  index: false
}));
app.get("*", (req, res) => {
  res.sendFile(path3.join(__dirname, "../dist/public/index.html"));
});
var port = process.env.PORT || 3e3;
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

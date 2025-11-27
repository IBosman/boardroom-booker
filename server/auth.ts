import jwt from 'jsonwebtoken';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secure-secret-key';
const TOKEN_EXPIRY = '24h';

// User type for internal storage
type User = {
  id: string;
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
  isAdmin?: boolean;
};

// User type for JWT and responses
export type UserPayload = {
  id: string;
  username: string;
  email: string;
  phoneNumber: string;
  isAdmin?: boolean;
  // JWT standard claims (optional)
  iat?: number; // Issued At
  exp?: number; // Expiration Time
  sub?: string; // Subject
};

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Generate JWT token
export function generateToken(user: UserPayload): string {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username,
      // Set isAdmin to true if username is 'admin'
      isAdmin: user.username.toLowerCase() === 'admin'
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

// Verify JWT token
export function verifyToken(token: string): UserPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

// Authentication middleware
export function authenticateToken(req: any, res: any, next: Function) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('No token provided in Authorization header');
    return res.status(401).json({ 
      isAuthenticated: false,
      error: 'Access token is required' 
    });
  }

  try {
    // Verify the token and get the decoded payload
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      console.log('Token expired');
      return res.status(401).json({ 
        isAuthenticated: false,
        error: 'Token has expired' 
      });
    }

    // Token is valid, attach user to request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    
    let errorMessage = 'Invalid token';
    if (error instanceof jwt.TokenExpiredError) {
      errorMessage = 'Token has expired';
    } else if (error instanceof jwt.JsonWebTokenError) {
      errorMessage = 'Invalid token';
    }
    
    return res.status(401).json({ 
      isAuthenticated: false,
      error: errorMessage 
    });
  }
}

// User storage (JSON file)
const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

// Ensure users file exists
if (!fs.existsSync(USERS_FILE)) {
  fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
  fs.writeFileSync(USERS_FILE, '[]', 'utf-8');
}

// Read users from file
function readUsers(): User[] {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    // Explicitly type the parsed data as User[]
    return JSON.parse(data) as User[];
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
}

// Write users to file
function writeUsers(users: UserPayload[]): void {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing users file:', error);
    throw new Error('Failed to save user data');
  }
}

// Create admin user if it doesn't exist
function initializeAdminUser() {
  const adminUsername = 'admin';
  const adminPassword = 'Board$@dm1n';
  
  try {
    const users = readUsers();
    const adminExists = users.some(user => user.username === adminUsername);
    
    if (!adminExists) {
      const newUser: User = {
        id: 'admin-' + Date.now().toString(),
        username: adminUsername,
        email: 'admin@example.com',
        phoneNumber: '+1234567890',
        password: adminPassword, // In production, this should be hashed
        isAdmin: true
      };
      
      users.push(newUser);
      writeUsers(users);
      console.log('Admin user created successfully');
    }
  } catch (error) {
    console.error('Error initializing admin user:', error);
  }
}

// Initialize admin user when the server starts
initializeAdminUser();

// User management
export const userService = {
  // Find user by username (internal use only - includes password)
  findByUsername: (username: string): User | undefined => {
    const users = readUsers() as User[];
    return users.find(user => user.username === username);
  },

  // Get user by username (returns user without password, for external use)
  getUserByUsername: (username: string): UserPayload | undefined => {
    const user = userService.findByUsername(username);
    if (!user) return undefined;
    const { password, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      // Set isAdmin to true if username is 'admin'
      isAdmin: username.toLowerCase() === 'admin'
    };
  },

  // Create new user
  create: (userData: { 
    username: string; 
    email: string;
    phoneNumber: string;
    password: string; 
  }): UserPayload => {
    const users = readUsers();
    
    // Check if username already exists
    if (users.some(user => user.username === userData.username)) {
      throw new Error('Username already exists');
    }
    
    // Check if email already exists
    if (users.some(user => user.email === userData.email)) {
      throw new Error('Email already in use');
    }

    // In a real app, you should hash the password before saving
    // For now, we'll just store it as is (NOT RECOMMENDED FOR PRODUCTION)
    const newUser: User = {
      id: Date.now().toString(),
      username: userData.username,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      password: userData.password
    };

    users.push(newUser);
    writeUsers(users);

    // Return user without password
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  },

  // Validate user credentials
  validateCredentials: (username: string, password: string): UserPayload | null => {
    const user = userService.findByUsername(username);
    if (!user || user.password !== password) return null;
    const { password: _, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      // Set isAdmin to true if username is 'admin'
      isAdmin: username.toLowerCase() === 'admin'
    };
  }
};

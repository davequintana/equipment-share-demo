// JWT payload interface
export interface JwtPayload {
  id: string;
  email: string;
  iat?: number;
  exp?: number;
}

// User interface
export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: string;
}

// Login request body
export interface LoginRequest {
  email: string;
  password: string;
}

// Register request body
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

// Profile update request body
export interface ProfileUpdateRequest {
  name?: string;
}

// Kafka event request body
export interface EventRequest {
  event: string;
  data: Record<string, unknown>;
}

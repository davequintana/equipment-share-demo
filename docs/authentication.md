# Authentication

## Overview

The application implements enterprise-grade JWT-based authentication with comprehensive security features including rate limiting, password validation, and secure token handling.

## Authentication Features

- **JWT tokens** with 15-minute expiration (configurable)
- **bcrypt password hashing** with salt rounds for security
- **Rate limiting** (5 login attempts per 15 minutes per IP)
- **Password complexity validation** (uppercase, lowercase, numbers required)
- **Email format validation** with comprehensive regex
- **Secure CORS configuration** for cross-origin requests
- **Input sanitization** and validation for all endpoints
- **Environment-based security** (localhost binding in development)
- **Secure JWT secret management** with environment variables
- **ReDoS protection** in all regex patterns

## Security Configuration

### Environment Variables

The application requires proper environment configuration for security:

```bash
# Copy .env.example to .env and configure:
NODE_ENV=development
JWT_SECRET=your-very-long-and-random-jwt-secret-here
VITE_API_URL=http://localhost:3334
```

### Host Binding Security

- **Development**: Server binds to `127.0.0.1` (localhost only)
- **Production**: Server binds to `0.0.0.0` (all interfaces)
- **Automatic detection** based on `NODE_ENV`

### JWT Secret Requirements

- **Development**: Long random string (minimum 64 characters recommended)
- **Production**: Cryptographically secure secret from AWS Secrets Manager
- **Generation**: Use `openssl rand -base64 64` for secure secrets

## API Endpoints

### Fastify API (Port 3334)

#### Authentication Endpoints

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Admin User"
  }
}
```

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "SecurePassword123",
  "name": "New User"
}
```

#### Protected User Endpoints

```http
GET /api/users/profile
Authorization: Bearer <jwt-token>
```

```http
PUT /api/users/profile
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "updated@example.com"
}
```

### Fastify API (Port 3334)

#### Authentication Endpoints

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password"
}
```

**Enhanced Response with Security Headers:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@example.com"
  },
  "expiresIn": "24h"
}
```

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "SecurePassword123"
}
```

#### Protected Endpoints

```http
GET /api/auth/profile
Authorization: Bearer <jwt-token>
```

```http
POST /api/events
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "event": "user_action",
  "data": { "action": "profile_update" }
}
```

## Security Implementation

### Rate Limiting

**Configuration:**
- **5 attempts** per 15-minute window per IP address
- **Exponential backoff** for repeated failures
- **Memory-based storage** (Redis recommended for production)

**Implementation:**
```typescript
const rateLimit = new Map();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  if (!rateLimit.has(identifier)) {
    rateLimit.set(identifier, { count: 1, windowStart: now });
    return true;
  }

  const record = rateLimit.get(identifier);
  if (now - record.windowStart > windowMs) {
    rateLimit.set(identifier, { count: 1, windowStart: now });
    return true;
  }

  if (record.count >= maxAttempts) {
    return false;
  }

  record.count++;
  return true;
}
```

### Password Validation

**Requirements:**
- **Minimum 8 characters**
- **At least one uppercase letter** (A-Z)
- **At least one lowercase letter** (a-z)
- **At least one number** (0-9)

**Implementation:**
```typescript
function validatePassword(password: string): boolean {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);

  return password.length >= minLength && 
         hasUpperCase && 
         hasLowerCase && 
         hasNumbers;
}
```

### Email Validation

**Comprehensive regex pattern:**
```typescript
function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}
```

### JWT Token Security

**Configuration:**
- **24-hour expiration** for security
- **HS256 algorithm** for signing
- **Secure secret key** from environment variables
- **Payload includes** user ID and email only (no sensitive data)

**Token Structure:**
```json
{
  "userId": 1,
  "email": "user@example.com",
  "iat": 1642680000,
  "exp": 1642766400
}
```

## Error Handling

### Authentication Errors

**Invalid credentials:**
```json
{
  "error": "Invalid email or password",
  "code": 401
}
```

**Rate limit exceeded:**
```json
{
  "error": "Too many login attempts. Please try again in 15 minutes.",
  "code": 429
}
```

**Invalid password format:**
```json
{
  "error": "Password must be at least 8 characters long and contain uppercase, lowercase, and numeric characters",
  "code": 400
}
```

**Invalid email format:**
```json
{
  "error": "Please provide a valid email address",
  "code": 400
}
```

**Token expired:**
```json
{
  "error": "Token expired",
  "code": 401
}
```

**Invalid token:**
```json
{
  "error": "Invalid token",
  "code": 401
}
```

## Frontend Integration

### Token Storage

```typescript
// Store token securely
localStorage.setItem('authToken', token);

// Include in API requests
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
  'Content-Type': 'application/json'
};
```

### Authentication Hook

```typescript
export function useAuth() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('authToken')
  );

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (response.ok) {
      const data = await response.json();
      setToken(data.token);
      localStorage.setItem('authToken', data.token);
      return data;
    }
    throw new Error('Login failed');
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('authToken');
  };

  return { token, login, logout };
}
```

### Protected Routes

```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}
```

## Testing Authentication

### Default Test Credentials

```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

### Testing Rate Limiting

```bash
# Test rate limiting with curl
for i in {1..6}; do
  curl -X POST http://localhost:3334/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"wrong@example.com","password":"wrong"}' \
    -w "Attempt $i: %{http_code}\n"
done
```

### Testing JWT Validation

```bash
# Test with valid token
curl -X GET http://localhost:3334/api/users/profile \
  -H "Authorization: Bearer <valid-jwt-token>"

# Test with invalid token
curl -X GET http://localhost:3334/api/users/profile \
  -H "Authorization: Bearer invalid-token"
```

## Security Best Practices

### Production Recommendations

1. **Use HTTPS** for all authentication endpoints
2. **Implement CSRF protection** for state-changing operations
3. **Use secure session storage** instead of localStorage for sensitive data
4. **Implement refresh tokens** for long-lived sessions
5. **Log authentication events** for security monitoring
6. **Use environment-specific JWT secrets**
7. **Implement account lockout** after multiple failed attempts
8. **Add two-factor authentication** for enhanced security

### Environment Configuration

```bash
# .env.production
JWT_SECRET=your-super-secure-256-bit-secret-key-change-this-in-production
JWT_EXPIRES_IN=24h
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_ATTEMPTS=5
BCRYPT_SALT_ROUNDS=12
```

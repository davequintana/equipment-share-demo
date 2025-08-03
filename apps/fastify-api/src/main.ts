import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyJwt from '@fastify/jwt';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import {
  User,
  JwtPayload,
  LoginRequest,
  RegisterRequest,
  ProfileUpdateRequest,
  EventRequest
} from './types';
import {
  authenticateUser,
  validateEmail,
  validatePassword,
  validateName,
  checkRateLimit,
  resetRateLimit
} from './middleware/auth';

dotenv.config();

const fastify = Fastify({ logger: true });

// Mock user database
const users: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    password: '$2a$10$9v8ezzQoCjPvTpLB8FvGq.KxsetvZ/rT4dFLBJ1z4Q7d..tEEgK32', // 'password'
    name: 'Admin User',
    createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
  },
];

// Register plugins
fastify.register(fastifyHelmet);
fastify.register(fastifyCors, {
  origin: process.env['NODE_ENV'] === 'production'
    ? ['https://yourdomain.com'] // Add your production domain here
    : ['http://localhost:4200', 'http://localhost:4201'], // Development origins
  credentials: true,
});
fastify.register(fastifyJwt, {
  secret: process.env['JWT_SECRET'] || 'your-secret-key',
});
fastify.register(fastifySwagger, {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'Fastify API',
      description: 'Enterprise Fastify API documentation',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://localhost:3333',
        description: 'Development server'
      }
    ],
  },
});
fastify.register(fastifySwaggerUi, {
  routePrefix: '/documentation',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false
  },
  staticCSP: true,
  transformStaticCSP: (header) => header,
});

// Health check route
fastify.get('/health', async () => {
  return { status: 'OK', timestamp: new Date().toISOString() };
});

// Authentication routes
fastify.post('/api/auth/login', {
  schema: {
    body: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 6 },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              name: { type: 'string' },
            },
          },
        },
      },
    },
  },
}, async (request, reply) => {
  const { email, password } = request.body as LoginRequest;
  const clientIp = request.ip;

  // Rate limiting
  if (!checkRateLimit(clientIp)) {
    return reply.code(429).send({
      error: 'Too many login attempts. Please try again later.',
      code: 'RATE_LIMITED'
    });
  }

  // Input validation
  if (!validateEmail(email)) {
    return reply.code(400).send({
      error: 'Invalid email format',
      code: 'INVALID_EMAIL'
    });
  }

  // Find user
  const user = users.find(u => u.email === email);
  if (!user) {
    return reply.code(401).send({
      error: 'Invalid credentials',
      code: 'INVALID_CREDENTIALS'
    });
  }

  // Check password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return reply.code(401).send({
      error: 'Invalid credentials',
      code: 'INVALID_CREDENTIALS'
    });
  }

  // Reset rate limit on successful login
  resetRateLimit(clientIp);

  // Generate JWT
  const token = fastify.jwt.sign({
    id: user.id,
    email: user.email
  }, { expiresIn: '24h' });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
});

// Registration route
fastify.post('/api/auth/register', {
  schema: {
    body: {
      type: 'object',
      required: ['email', 'password', 'name'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 6 },
        name: { type: 'string', minLength: 2 },
      },
    },
    response: {
      201: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              name: { type: 'string' },
            },
          },
        },
      },
    },
  },
}, async (request, reply) => {
  const { email, password, name } = request.body as RegisterRequest;

  // Input validation
  if (!validateEmail(email)) {
    return reply.code(400).send({
      error: 'Invalid email format',
      code: 'INVALID_EMAIL'
    });
  }

  if (!validateName(name)) {
    return reply.code(400).send({
      error: 'Name must be between 2 and 50 characters',
      code: 'INVALID_NAME'
    });
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return reply.code(400).send({
      error: 'Password does not meet requirements',
      code: 'INVALID_PASSWORD',
      details: passwordValidation.errors
    });
  }

  // Check if user already exists
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return reply.code(409).send({
      error: 'User already exists',
      code: 'USER_EXISTS'
    });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const newUser = {
    id: Date.now().toString(),
    email,
    password: hashedPassword,
    name: name.trim(),
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);

  // Generate JWT
  const token = fastify.jwt.sign({
    id: newUser.id,
    email: newUser.email
  }, { expiresIn: '24h' });

  return reply.code(201).send({
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    },
  });
});

// Protected user profile route
fastify.get('/api/users/profile', {
  preHandler: authenticateUser,
  schema: {
    response: {
      200: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              name: { type: 'string' },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
  },
}, async (request) => {
  const user = request.user as JwtPayload;
  if (!user) {
    throw new Error('User not authenticated');
  }
  const userData = users.find(u => u.id === user.id);

  if (!userData) {
    throw new Error('User not found');
  }

  return {
    user: {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      createdAt: userData.createdAt,
    },
  };
});

// Update user profile route
fastify.put('/api/users/profile', {
  preHandler: authenticateUser,
  schema: {
    body: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 2 },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              name: { type: 'string' },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
  },
}, async (request) => {
  const { name } = request.body as ProfileUpdateRequest;
  const user = request.user as JwtPayload;
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Validate name if provided
  if (name && !validateName(name)) {
    throw new Error('Name must be between 2 and 50 characters');
  }

  const userIndex = users.findIndex(u => u.id === user.id);
  if (userIndex === -1) {
    throw new Error('User not found');
  }

  if (name) {
    users[userIndex].name = name.trim();
  }

  return {
    user: {
      id: users[userIndex].id,
      email: users[userIndex].email,
      name: users[userIndex].name,
      createdAt: users[userIndex].createdAt,
    },
  };
});

// Kafka producer endpoint (mock)
fastify.post('/api/events', {
  preHandler: authenticateUser,
}, async (request) => {
  const { event, data } = request.body as EventRequest;

  // Mock Kafka producer logic
  fastify.log.info(`Publishing event: ${event}`, data);

  return { success: true, eventId: Date.now().toString() };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3333, host: '0.0.0.0' });
    console.log('🚀 Fastify API server ready at http://localhost:3333');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

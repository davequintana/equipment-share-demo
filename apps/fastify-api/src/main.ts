import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyJwt from '@fastify/jwt';
import fastifySwagger from '@fastify/swagger';
import dotenv from 'dotenv';

dotenv.config();

const fastify = Fastify({ logger: true });

// Register plugins
fastify.register(fastifyHelmet);
fastify.register(fastifyCors);
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
  },
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
  const { email, password } = request.body as { email: string; password: string };

  // Mock authentication logic
  if (email === 'admin@example.com' && password === 'password') {
    const token = fastify.jwt.sign({ id: '1', email });
    return {
      token,
      user: {
        id: '1',
        email,
        name: 'Admin User',
      },
    };
  }

  return reply.code(401).send({ error: 'Invalid credentials' });
});

// Protected route
fastify.get('/api/users/profile', {
  preHandler: async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  },
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
            },
          },
        },
      },
    },
  },
}, async (request) => {
  const user = request.user as { id: string; email: string };
  return {
    user: {
      id: user.id,
      email: user.email,
      name: 'Admin User',
    },
  };
});

// Kafka producer endpoint (mock)
fastify.post('/api/events', {
  preHandler: async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  },
}, async (request) => {
  const { event, data } = request.body as { event: string; data: Record<string, unknown> };

  // Mock Kafka producer logic
  fastify.log.info(`Publishing event: ${event}`, data);

  return { success: true, eventId: Date.now().toString() };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3334, host: '0.0.0.0' });
    console.log('🚀 Fastify API server ready at http://localhost:3334');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

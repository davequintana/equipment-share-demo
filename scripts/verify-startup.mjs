#!/usr/bin/env node
/**
 * Verification script to check if all services are running correctly
 * This runs after the startup script to validate the complete system
 */

import http from 'http';
import https from 'https';

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (color, message) => console.log(`${color}${message}${colors.reset}`);

// Services to check
const services = [
  {
    name: 'Web App (React)',
    url: 'http://localhost:4201',
    type: 'web'
  },
  {
    name: 'Fastify API',
    url: 'http://localhost:3334/health',
    type: 'api'
  },
  {
    name: 'Kafka UI',
    url: 'http://localhost:8080',
    type: 'web'
  }
];

// Function to check if a service is running
const checkService = (service) => {
  return new Promise((resolve) => {
    const protocol = service.url.startsWith('https') ? https : http;

    const request = protocol.get(service.url, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        log(colors.green, `✅ ${service.name} - Running (${res.statusCode})`);
        resolve(true);
      } else {
        log(colors.yellow, `⚠️  ${service.name} - Unexpected status (${res.statusCode})`);
        resolve(false);
      }
    });

    request.on('error', (err) => {
      log(colors.red, `❌ ${service.name} - Not accessible (${err.message})`);
      resolve(false);
    });

    request.setTimeout(5000, () => {
      log(colors.red, `❌ ${service.name} - Timeout`);
      request.destroy();
      resolve(false);
    });
  });
};

// Main verification function
const verifyStartup = async () => {
  log(colors.blue, `${colors.bold}🔍 Verifying startup services...${colors.reset}`);
  console.log('');

  // Wait a moment for services to stabilize
  await new Promise(resolve => setTimeout(resolve, 2000));

  const results = await Promise.all(services.map(checkService));
  const allRunning = results.every(result => result);

  console.log('');
  log(colors.blue, '📋 Service URLs:');
  log(colors.reset, '   • Web App: http://localhost:4201');
  log(colors.reset, '   • API: http://localhost:3334');
  log(colors.reset, '   • Kafka UI: http://localhost:8080');

  console.log('');
  if (allRunning) {
    log(colors.green, `${colors.bold}🎉 All services are running successfully!${colors.reset}`);
    log(colors.green, '   Ready for development with Kafka behavior tracking');
    console.log('');
    log(colors.blue, '💡 Next steps:');
    log(colors.reset, '   1. Open http://localhost:4201 to see the web app');
    log(colors.reset, '   2. Open http://localhost:8080 to monitor Kafka events');
    log(colors.reset, '   3. User interactions will be tracked and sent to Kafka');
    return true;
  } else {
    log(colors.yellow, `${colors.bold}⚠️  Some services may still be starting up${colors.reset}`);
    log(colors.yellow, '   Wait a moment and check the service URLs manually');
    console.log('');
    log(colors.blue, '🔧 Troubleshooting:');
    log(colors.reset, '   • Check Docker containers: docker ps');
    log(colors.reset, '   • Check logs: docker-compose logs');
    log(colors.reset, '   • Restart if needed: pnpm run docker:down && pnpm run start:full');
    return false;
  }
};

// Run verification
verifyStartup().catch(err => {
  log(colors.red, `❌ Verification failed: ${err.message}`);
  process.exit(1);
});

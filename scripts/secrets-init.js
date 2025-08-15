#!/usr/bin/env npx tsx

/**
 * Enterprise Secrets Initialization Script
 *
 * This script helps initialize secrets in AWS Secrets Manager and Parameter Store
 * for different environments (development, staging, production).
 *
 * Usage:
 *   npx tsx scripts/secrets-init.js init <environment>
 *   npx tsx scripts/secrets-init.js rotate <environment> <secret-name>
 *   npx tsx scripts/secrets-init.js validate <environment>
 */

import { EnterpriseSecretsManager } from '../apps/fastify-api/src/enterprise-secrets-manager.ts';
import * as crypto from 'crypto';
import { readFile, writeFile, access } from 'fs/promises';

// Type definitions using JSDoc for JavaScript compatibility
/**
 * @typedef {Object} SecretDefinition
 * @property {string} name
 * @property {'secret' | 'parameter'} type
 * @property {boolean} secure
 * @property {() => string} [generator]
 * @property {string} description
 */

/** @type {SecretDefinition[]} */
const SECRETS_DEFINITIONS = [
  {
    name: 'jwt-secret',
    type: 'secret',
    secure: true,
    generator: () => crypto.randomBytes(64).toString('hex'),
    description: 'JWT signing secret for authentication tokens'
  },
  {
    name: 'database-credentials',
    type: 'secret',
    secure: true,
    description: 'PostgreSQL database connection credentials'
  },
  {
    name: 'redis-url',
    type: 'parameter',
    secure: true,
    description: 'Redis connection URL'
  },
  {
    name: 'api-base-url',
    type: 'parameter',
    secure: false,
    description: 'Base URL for the API service'
  },
  {
    name: 'cors-origins',
    type: 'parameter',
    secure: false,
    description: 'Allowed CORS origins (comma-separated)'
  }
];

class SecretsInitializer {
  /**
   * @param {string} environment
   */
  constructor(environment) {
    this.environment = environment;
    this.secretsManager = new EnterpriseSecretsManager(environment);
  }

  async initializeSecrets() {
    console.log(`🔐 Initializing secrets for environment: ${this.environment}`);

    if (this.environment === 'development' || this.environment === 'test') {
      console.log('📝 Development environment detected - using local configuration');
      await this.initializeLocalSecrets();
      return;
    }

    console.log('☁️  Cloud environment detected - using AWS Secrets Manager');

    for (const secretDef of SECRETS_DEFINITIONS) {
      try {
        await this.initializeSecret(secretDef);
        console.log(`✅ ${secretDef.name} initialized successfully`);
      } catch (error) {
        console.error(`❌ Failed to initialize ${secretDef.name}:`, error);
      }
    }
  }

  /**
   * @param {string} secretName
   */
  async rotateSecret(secretName) {
    console.log(`🔄 Rotating secret: ${secretName}`);

    const secretDef = SECRETS_DEFINITIONS.find(s => s.name === secretName);
    if (!secretDef) {
      throw new Error(`Unknown secret: ${secretName}`);
    }

    if (!secretDef.generator) {
      throw new Error(`Secret ${secretName} does not support automatic generation`);
    }

    const newValue = secretDef.generator();

    if (secretDef.type === 'secret') {
      await this.secretsManager.createSecret(secretName, newValue, secretDef.description);
    } else {
      await this.secretsManager.createParameter(secretName, newValue, secretDef.description);
    }

    console.log(`✅ Secret ${secretName} rotated successfully`);
  }

  async validateSecrets() {
    console.log(`🔍 Validating secrets for environment: ${this.environment}`);

    /** @type {Array<{name: string, status: 'ok' | 'missing' | 'error', message?: string}>} */
    const results = [];

    for (const secretDef of SECRETS_DEFINITIONS) {
      try {
        if (secretDef.type === 'secret') {
          await this.secretsManager.getSecret(secretDef.name);
        } else {
          await this.secretsManager.getParameter(secretDef.name);
        }
        results.push({ name: secretDef.name, status: 'ok' });
      } catch (error) {
        results.push({
          name: secretDef.name,
          status: 'missing',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log('\n📊 Validation Results:');
    results.forEach(result => {
      const icon = result.status === 'ok' ? '✅' : '❌';
      console.log(`${icon} ${result.name}: ${result.status}`);
      if (result.message) {
        console.log(`   ${result.message}`);
      }
    });

    const missingCount = results.filter(r => r.status !== 'ok').length;
    if (missingCount > 0) {
      console.log(`\n⚠️  ${missingCount} secrets need attention`);
      process.exit(1);
    } else {
      console.log('\n🎉 All secrets are properly configured!');
    }
  }

  /**
   * @param {SecretDefinition} secretDef
   */
  async initializeSecret(secretDef) {
    // Check if secret already exists
    try {
      if (secretDef.type === 'secret') {
        await this.secretsManager.getSecret(secretDef.name);
      } else {
        await this.secretsManager.getParameter(secretDef.name);
      }
      console.log(`ℹ️  ${secretDef.name} already exists, skipping`);
      return;
    } catch {
      // Secret doesn't exist, create it
    }

    let value;

    if (secretDef.generator) {
      value = secretDef.generator();
      console.log(`🎲 Generated new value for ${secretDef.name}`);
    } else {
      value = await this.promptForSecret(secretDef);
    }

    if (secretDef.type === 'secret') {
      await this.secretsManager.createSecret(secretDef.name, value, secretDef.description);
    } else {
      await this.secretsManager.createParameter(secretDef.name, value, secretDef.description);
    }
  }

  async initializeLocalSecrets() {
    console.log('📁 Checking local environment configuration...');

    const envExample = '.env.example';
    const envLocal = '.env.local';

    try {
      await access(envLocal);
      console.log(`✅ ${envLocal} exists`);
    } catch {
      console.log(`📋 Creating ${envLocal} from ${envExample}...`);
      try {
        const exampleContent = await readFile(envExample, 'utf8');
        await writeFile(envLocal, exampleContent);
        console.log(`✅ Created ${envLocal} - please review and update values`);
      } catch (error) {
        console.error(`❌ Failed to create ${envLocal}:`, error);
      }
    }
  }

  /**
   * @param {SecretDefinition} secretDef
   * @returns {Promise<string>}
   */
  async promptForSecret(secretDef) {
    // In a real implementation, you might use a proper CLI prompt library
    // For now, we'll provide instructions for manual setup

    console.log(`\n📝 Manual setup required for: ${secretDef.name}`);
    console.log(`Description: ${secretDef.description}`);
    console.log(`Type: ${secretDef.type} (secure: ${secretDef.secure})`);

    if (secretDef.name === 'database-credentials') {
      return JSON.stringify({
        host: 'your-rds-endpoint',
        port: 5432,
        database: 'enterprise_db',
        username: 'enterprise',
        password: crypto.randomBytes(32).toString('hex')
      });
    }

    if (secretDef.name === 'redis-url') {
      return 'redis://your-elasticache-endpoint:6379';
    }

    if (secretDef.name === 'api-base-url') {
      return `https://api.${this.environment}.yourdomain.com`;
    }

    if (secretDef.name === 'cors-origins') {
      return `https://${this.environment}.yourdomain.com,https://admin.${this.environment}.yourdomain.com`;
    }

    return 'please-set-this-value';
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const environment = args[1];

  if (!command || !environment) {
    console.log('Usage:');
    console.log('  npx tsx scripts/secrets-init.js init <environment>');
    console.log('  npx tsx scripts/secrets-init.js rotate <environment> <secret-name>');
    console.log('  npx tsx scripts/secrets-init.js validate <environment>');
    console.log('');
    console.log('Environments: development, staging, production, test');
    process.exit(1);
  }

  // Validate environment
  const validEnvironments = ['development', 'staging', 'production', 'test'];
  if (!validEnvironments.includes(environment)) {
    console.error(`❌ Invalid environment: ${environment}`);
    console.error(`Valid environments: ${validEnvironments.join(', ')}`);
    process.exit(1);
  }

  const initializer = new SecretsInitializer(environment);

  try {
    switch (command) {
      case 'init':
        await initializer.initializeSecrets();
        break;
      case 'rotate': {
        const secretName = args[2];
        if (!secretName) {
          console.error('❌ Secret name is required for rotation');
          process.exit(1);
        }
        await initializer.rotateSecret(secretName);
        break;
      }
      case 'validate':
        await initializer.validateSecrets();
        break;
      default:
        console.error(`❌ Unknown command: ${command}`);
        console.error('Valid commands: init, rotate, validate');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Operation failed:', error);
    process.exit(1);
  }
}

// Only run main if this file is executed directly (ES module compatible)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

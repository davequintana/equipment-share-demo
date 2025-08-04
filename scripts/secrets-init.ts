#!/usr/bin/env node

/**
 * Enterprise Secrets Initialization Script
 * 
 * This script helps initialize secrets in AWS Secrets Manager and Parameter Store
 * for different environments (development, staging, production).
 * 
 * Usage:
 *   pnpm run secrets:init <environment>
 *   pnpm run secrets:rotate <environment> <secret-name>
 *   pnpm run secrets:validate <environment>
 */

import { EnterpriseSecretsManager } from '../libs/secrets/src/secrets-manager';
import * as crypto from 'crypto';

interface SecretDefinition {
  name: string;
  type: 'secret' | 'parameter';
  secure: boolean;
  generator?: () => string;
  description: string;
}

const SECRETS_DEFINITIONS: SecretDefinition[] = [
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
  private secretsManager: EnterpriseSecretsManager;
  private environment: string;

  constructor(environment: string) {
    this.environment = environment;
    this.secretsManager = new EnterpriseSecretsManager(environment);
  }

  async initializeSecrets(): Promise<void> {
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

  async rotateSecret(secretName: string): Promise<void> {
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
      await this.secretsManager.putSecret(secretName, newValue);
    } else {
      await this.secretsManager.putParameter(secretName, newValue, secretDef.secure);
    }

    console.log(`✅ Secret ${secretName} rotated successfully`);
  }

  async validateSecrets(): Promise<void> {
    console.log(`🔍 Validating secrets for environment: ${this.environment}`);

    const results: Array<{ name: string; status: 'ok' | 'missing' | 'error'; message?: string }> = [];

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

  private async initializeSecret(secretDef: SecretDefinition): Promise<void> {
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

    let value: string;

    if (secretDef.generator) {
      value = secretDef.generator();
      console.log(`🎲 Generated new value for ${secretDef.name}`);
    } else {
      value = await this.promptForSecret(secretDef);
    }

    if (secretDef.type === 'secret') {
      await this.secretsManager.putSecret(secretDef.name, value);
    } else {
      await this.secretsManager.putParameter(secretDef.name, value, secretDef.secure);
    }
  }

  private async initializeLocalSecrets(): Promise<void> {
    console.log('📁 Checking local environment configuration...');
    
    const envExample = '.env.example';
    const envLocal = '.env.local';
    
    try {
      const fs = await import('fs/promises');
      await fs.access(envLocal);
      console.log(`✅ ${envLocal} exists`);
    } catch {
      console.log(`📋 Creating ${envLocal} from ${envExample}...`);
      try {
        const fs = await import('fs/promises');
        const exampleContent = await fs.readFile(envExample, 'utf8');
        await fs.writeFile(envLocal, exampleContent);
        console.log(`✅ Created ${envLocal} - please review and update values`);
      } catch (error) {
        console.error(`❌ Failed to create ${envLocal}:`, error);
      }
    }
  }

  private async promptForSecret(secretDef: SecretDefinition): Promise<string> {
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
        password: 'generated-secure-password'
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
    console.log('  node scripts/secrets-init.js init <environment>');
    console.log('  node scripts/secrets-init.js rotate <environment> <secret-name>');
    console.log('  node scripts/secrets-init.js validate <environment>');
    console.log('');
    console.log('Environments: development, staging, production');
    process.exit(1);
  }

  const initializer = new SecretsInitializer(environment);

  try {
    switch (command) {
      case 'init':
        await initializer.initializeSecrets();
        break;
      case 'rotate':
        const secretName = args[2];
        if (!secretName) {
          console.error('Secret name is required for rotation');
          process.exit(1);
        }
        await initializer.rotateSecret(secretName);
        break;
      case 'validate':
        await initializer.validateSecrets();
        break;
      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Operation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

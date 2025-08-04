import { SecretsManagerClient, GetSecretValueCommand, CreateSecretCommand, UpdateSecretCommand } from '@aws-sdk/client-secrets-manager';
import { SSMClient, GetParameterCommand, PutParameterCommand } from '@aws-sdk/client-ssm';

interface DatabaseCredentials {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export class EnterpriseSecretsManager {
  private secretsClient: SecretsManagerClient;
  private ssmClient: SSMClient;
  private environment: string;
  private region: string;

  constructor(environment = process.env.NODE_ENV || 'development', region = 'us-east-1') {
    this.environment = environment;
    this.region = region;

    // Initialize AWS clients with proper configuration
    this.secretsClient = new SecretsManagerClient({
      region: this.region,
      // In production, this will use IAM roles
      // In development, it will use AWS credentials or environment variables
    });

    this.ssmClient = new SSMClient({
      region: this.region,
    });
  }

  /**
   * Retrieve a secret from AWS Secrets Manager
   */
  async getSecret(secretName: string): Promise<string | Record<string, unknown>> {
    try {
      const command = new GetSecretValueCommand({
        SecretId: this.buildSecretName(secretName),
      });

      const response = await this.secretsClient.send(command);

      if (response.SecretString) {
        // Handle JSON secrets (like database credentials)
        try {
          const parsed = JSON.parse(response.SecretString);
          return parsed;
        } catch {
          // Handle plain text secrets
          return response.SecretString;
        }
      }

      throw new Error(`Secret ${secretName} not found or empty`);
    } catch (error) {
      // Fallback to environment variables for development
      if (this.environment === 'development' || this.environment === 'test') {
        const envVar = this.getEnvFallback(secretName);
        if (envVar) {
          console.warn(`Using environment fallback for secret: ${secretName}`);
          return envVar;
        }
      }

      console.error(`Failed to retrieve secret ${secretName}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve a parameter from AWS Systems Manager Parameter Store
   */
  async getParameter(parameterName: string, decrypt = true): Promise<string> {
    try {
      const command = new GetParameterCommand({
        Name: this.buildParameterName(parameterName),
        WithDecryption: decrypt,
      });

      const response = await this.ssmClient.send(command);

      if (response.Parameter?.Value) {
        return response.Parameter.Value;
      }

      throw new Error(`Parameter ${parameterName} not found`);
    } catch (error) {
      // Fallback to environment variables for development
      if (this.environment === 'development' || this.environment === 'test') {
        const envVar = this.getEnvFallback(parameterName);
        if (envVar) {
          console.warn(`Using environment fallback for parameter: ${parameterName}`);
          return envVar;
        }
      }

      console.error(`Failed to retrieve parameter ${parameterName}:`, error);
      throw error;
    }
  }

  /**
   * Create or update a secret in AWS Secrets Manager
   */
  async putSecret(secretName: string, secretValue: string | object): Promise<void> {
    if (this.environment === 'development' || this.environment === 'test') {
      console.warn(`Skipping secret creation in ${this.environment} environment`);
      return;
    }

    try {
      const secretString = typeof secretValue === 'object' ? JSON.stringify(secretValue) : secretValue;
      const secretId = this.buildSecretName(secretName);

      // Try to update existing secret first
      try {
        await this.secretsClient.send(new UpdateSecretCommand({
          SecretId: secretId,
          SecretString: secretString,
        }));
      } catch {
        // If update fails, create new secret
        await this.secretsClient.send(new CreateSecretCommand({
          Name: secretId,
          SecretString: secretString,
          Description: `${secretName} for ${this.environment} environment`,
        }));
      }
    } catch (error) {
      console.error(`Failed to store secret ${secretName}:`, error);
      throw error;
    }
  }

  /**
   * Store a parameter in AWS Systems Manager Parameter Store
   */
  async putParameter(parameterName: string, parameterValue: string, secure = true): Promise<void> {
    if (this.environment === 'development' || this.environment === 'test') {
      console.warn(`Skipping parameter creation in ${this.environment} environment`);
      return;
    }

    try {
      await this.ssmClient.send(new PutParameterCommand({
        Name: this.buildParameterName(parameterName),
        Value: parameterValue,
        Type: secure ? 'SecureString' : 'String',
        Overwrite: true,
        Description: `${parameterName} for ${this.environment} environment`,
      }));
    } catch (error) {
      console.error(`Failed to store parameter ${parameterName}:`, error);
      throw error;
    }
  }

  /**
   * Get database credentials as a structured object
   */
  async getDatabaseCredentials(): Promise<DatabaseCredentials> {
    const secret = await this.getSecret('database-credentials');

    if (typeof secret === 'string') {
      // Parse connection string format
      return this.parseConnectionString(secret);
    }

    return secret as unknown as DatabaseCredentials;
  }

  /**
   * Get JWT secret for authentication
   */
  async getJwtSecret(): Promise<string> {
    const secret = await this.getSecret('jwt-secret');
    return typeof secret === 'string' ? secret : String(secret);
  }

  /**
   * Get Redis connection URL
   */
  async getRedisUrl(): Promise<string> {
    return await this.getParameter('redis-url');
  }

  /**
   * Build environment-specific secret name
   */
  private buildSecretName(secretName: string): string {
    return `/${this.environment}/secrets/${secretName}`;
  }

  /**
   * Build environment-specific parameter name
   */
  private buildParameterName(parameterName: string): string {
    return `/${this.environment}/config/${parameterName}`;
  }

  /**
   * Fallback to environment variables for development
   */
  private getEnvFallback(name: string): string | undefined {
    const envMappings: Record<string, string> = {
      'database-credentials': 'DATABASE_URL',
      'jwt-secret': 'JWT_SECRET',
      'redis-url': 'REDIS_URL',
    };

    const envVar = envMappings[name] || name.toUpperCase().replace(/-/g, '_');
    return process.env[envVar];
  }

  /**
   * Parse database connection string into components
   */
  private parseConnectionString(connectionString: string): DatabaseCredentials {
    // Parse postgresql://username:password@host:port/database
    const url = new URL(connectionString);

    return {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1),
      username: url.username,
      password: url.password,
    };
  }
}

// Singleton instance for application use
export const secretsManager = new EnterpriseSecretsManager();

import { SecretsManagerClient, GetSecretValueCommand, CreateSecretCommand, UpdateSecretCommand } from '@aws-sdk/client-secrets-manager';
import { SSMClient, GetParameterCommand, PutParameterCommand } from '@aws-sdk/client-ssm';

export interface DatabaseCredentials {
  username: string;
  password: string;
  host: string;
  port: number;
  database: string;
}

export interface SecretConfig {
  secretName: string;
  parameterName: string;
  fallbackEnvVar?: string;
}

export class EnterpriseSecretsManager {
  private secretsClient: SecretsManagerClient | null = null;
  private ssmClient: SSMClient | null = null;
  private environment: string;
  private region: string;

  constructor(environment = process.env['NODE_ENV'] || 'development', region = 'us-east-1') {
    this.environment = environment;
    this.region = region;

    // Only initialize AWS clients in production or staging environments
    if (this.environment === 'production' || this.environment === 'staging') {
      this.secretsClient = new SecretsManagerClient({ region: this.region });
      this.ssmClient = new SSMClient({ region: this.region });
    }
  }

  async getSecret(secretName: string, fallbackEnvVar?: string): Promise<string> {
    // Development/test environment fallback
    if (!this.secretsClient || this.environment === 'development' || this.environment === 'test') {
      const fallbackValue = fallbackEnvVar ? process.env[fallbackEnvVar] : undefined;
      if (fallbackValue) {
        return fallbackValue;
      }
      throw new Error(`Secret ${secretName} not available in ${this.environment} environment and no fallback provided`);
    }

    try {
      const command = new GetSecretValueCommand({ SecretId: secretName });
      const response = await this.secretsClient.send(command);

      if (response.SecretString) {
        return response.SecretString;
      }

      throw new Error(`Secret ${secretName} value is empty`);
    } catch (error) {
      console.error(`Failed to retrieve secret ${secretName}:`, error);

      // Fallback to environment variable if available
      if (fallbackEnvVar && process.env[fallbackEnvVar]) {
        console.warn(`Using fallback environment variable ${fallbackEnvVar} for secret ${secretName}`);
        return process.env[fallbackEnvVar] as string;
      }

      throw error;
    }
  }

  async getParameter(parameterName: string, fallbackEnvVar?: string): Promise<string> {
    // Development/test environment fallback
    if (!this.ssmClient || this.environment === 'development' || this.environment === 'test') {
      const fallbackValue = fallbackEnvVar ? process.env[fallbackEnvVar] : undefined;
      if (fallbackValue) {
        return fallbackValue;
      }
      throw new Error(`Parameter ${parameterName} not available in ${this.environment} environment and no fallback provided`);
    }

    try {
      const command = new GetParameterCommand({
        Name: parameterName,
        WithDecryption: true
      });
      const response = await this.ssmClient.send(command);

      if (response.Parameter?.Value) {
        return response.Parameter.Value;
      }

      throw new Error(`Parameter ${parameterName} value is empty`);
    } catch (error) {
      console.error(`Failed to retrieve parameter ${parameterName}:`, error);

      // Fallback to environment variable if available
      if (fallbackEnvVar && process.env[fallbackEnvVar]) {
        console.warn(`Using fallback environment variable ${fallbackEnvVar} for parameter ${parameterName}`);
        return process.env[fallbackEnvVar] as string;
      }

      throw error;
    }
  }

  async getDatabaseCredentials(): Promise<DatabaseCredentials> {
    const secretName = `${this.environment}/database/credentials`;

    try {
      const secretString = await this.getSecret(secretName);
      const credentials = JSON.parse(secretString);

      return {
        username: credentials.username,
        password: credentials.password,
        host: credentials.host,
        port: credentials.port || 5432,
        database: credentials.database
      };
    } catch (error) {
      // Fallback to environment variables for development
      if (this.environment === 'development' || this.environment === 'test') {
        // First try to parse DATABASE_URL if available
        if (process.env['DATABASE_URL']) {
          const dbUrl = new URL(process.env['DATABASE_URL']);
          return {
            username: dbUrl.username || 'postgres',
            password: dbUrl.password || 'password',
            host: dbUrl.hostname || 'localhost',
            port: parseInt(dbUrl.port || '5432'),
            database: dbUrl.pathname.slice(1) || 'app_db' // Remove leading slash
          };
        }

        // Fall back to individual environment variables
        return {
          username: process.env['DB_USERNAME'] || 'postgres',
          password: process.env['DB_PASSWORD'] || 'password',
          host: process.env['DB_HOST'] || 'localhost',
          port: parseInt(process.env['DB_PORT'] || '5432'),
          database: process.env['DB_NAME'] || 'app_db'
        };
      }

      throw error;
    }
  }

  async getJwtSecret(): Promise<string> {
    const secretName = `${this.environment}/jwt/secret`;
    return this.getSecret(secretName, 'JWT_SECRET');
  }

  async getApiKey(serviceName: string): Promise<string> {
    const secretName = `${this.environment}/api-keys/${serviceName}`;
    return this.getSecret(secretName, `${serviceName.toUpperCase()}_API_KEY`);
  }

  // Utility methods for secret management
  async createSecret(secretName: string, secretValue: string, description?: string): Promise<void> {
    if (!this.secretsClient) {
      throw new Error('Secrets Manager client not initialized for this environment');
    }

    try {
      const command = new CreateSecretCommand({
        Name: secretName,
        SecretString: secretValue,
        Description: description || `Secret for ${this.environment} environment`
      });

      await this.secretsClient.send(command);
    } catch (error) {
      console.error(`Failed to create secret ${secretName}:`, error);
      throw error;
    }
  }

  async updateSecret(secretName: string, secretValue: string): Promise<void> {
    if (!this.secretsClient) {
      throw new Error('Secrets Manager client not initialized for this environment');
    }

    try {
      const command = new UpdateSecretCommand({
        SecretId: secretName,
        SecretString: secretValue
      });

      await this.secretsClient.send(command);
    } catch (error) {
      console.error(`Failed to update secret ${secretName}:`, error);
      throw error;
    }
  }

  async createParameter(parameterName: string, parameterValue: string, description?: string): Promise<void> {
    if (!this.ssmClient) {
      throw new Error('SSM client not initialized for this environment');
    }

    try {
      const command = new PutParameterCommand({
        Name: parameterName,
        Value: parameterValue,
        Type: 'SecureString',
        Description: description || `Parameter for ${this.environment} environment`,
        Overwrite: false
      });

      await this.ssmClient.send(command);
    } catch (error) {
      console.error(`Failed to create parameter ${parameterName}:`, error);
      throw error;
    }
  }

  // Health check method
  async healthCheck(): Promise<{ secretsManager: boolean; parameterStore: boolean }> {
    const result = {
      secretsManager: false,
      parameterStore: false
    };

    if (this.secretsClient) {
      try {
        // Try to list secrets (this requires minimal permissions)
        await this.secretsClient.send(new GetSecretValueCommand({ SecretId: 'health-check-secret' }));
        result.secretsManager = true;
      } catch (error) {
        // Expected to fail if secret doesn't exist, but client is working
        if (error instanceof Error && error.name === 'ResourceNotFoundException') {
          result.secretsManager = true;
        }
      }
    } else {
      // In development, consider it healthy if we have fallback environment variables
      result.secretsManager = true;
    }

    if (this.ssmClient) {
      try {
        await this.ssmClient.send(new GetParameterCommand({ Name: 'health-check-parameter' }));
        result.parameterStore = true;
      } catch (error) {
        // Expected to fail if parameter doesn't exist, but client is working
        if (error instanceof Error && error.name === 'ParameterNotFound') {
          result.parameterStore = true;
        }
      }
    } else {
      // In development, consider it healthy
      result.parameterStore = true;
    }

    return result;
  }
}

import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction, type MockedClass } from 'vitest';
import { EnterpriseSecretsManager } from './enterprise-secrets-manager';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { SSMClient } from '@aws-sdk/client-ssm';

// Mock AWS SDK clients
vi.mock('@aws-sdk/client-secrets-manager');
vi.mock('@aws-sdk/client-ssm');

const MockedSecretsManagerClient = SecretsManagerClient as unknown as MockedClass<typeof SecretsManagerClient>;
const MockedSSMClient = SSMClient as unknown as MockedClass<typeof SSMClient>;

describe('EnterpriseSecretsManager', () => {
  let secretsManager: EnterpriseSecretsManager;
  let mockSecretsClient: {
    send: MockedFunction<(command: unknown) => Promise<unknown>>;
  };
  let mockSSMClient: {
    send: MockedFunction<(command: unknown) => Promise<unknown>>;
  };

  // Store original environment variables to restore later
  const originalEnv = process.env;

  // Helper functions to reduce nesting complexity
  const createConsoleSpy = (method: 'warn' | 'error') => {
    return vi.spyOn(console, method).mockImplementation(() => undefined);
  };

  const restoreConsoleSpy = (spy: ReturnType<typeof vi.spyOn>) => {
    spy.mockRestore();
  };

  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv };

    // Clear all mocks
    vi.clearAllMocks();

    // Setup mock clients
    mockSecretsClient = {
      send: vi.fn()
    };
    mockSSMClient = {
      send: vi.fn()
    };

    MockedSecretsManagerClient.mockImplementation(() => mockSecretsClient as unknown as SecretsManagerClient);
    MockedSSMClient.mockImplementation(() => mockSSMClient as unknown as SSMClient);
  });  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  describe('Constructor', () => {
    it('should initialize with default environment and region', () => {
      process.env.NODE_ENV = 'development';
      secretsManager = new EnterpriseSecretsManager();

      expect(secretsManager).toBeInstanceOf(EnterpriseSecretsManager);
    });

    it('should initialize AWS clients in production environment', () => {
      secretsManager = new EnterpriseSecretsManager('production', 'us-west-2');

      expect(MockedSecretsManagerClient).toHaveBeenCalledWith({ region: 'us-west-2' });
      expect(MockedSSMClient).toHaveBeenCalledWith({ region: 'us-west-2' });
    });

    it('should initialize AWS clients in staging environment', () => {
      secretsManager = new EnterpriseSecretsManager('staging', 'eu-west-1');

      expect(MockedSecretsManagerClient).toHaveBeenCalledWith({ region: 'eu-west-1' });
      expect(MockedSSMClient).toHaveBeenCalledWith({ region: 'eu-west-1' });
    });

    it('should not initialize AWS clients in development environment', () => {
      secretsManager = new EnterpriseSecretsManager('development');

      expect(MockedSecretsManagerClient).not.toHaveBeenCalled();
      expect(MockedSSMClient).not.toHaveBeenCalled();
    });

    it('should not initialize AWS clients in test environment', () => {
      secretsManager = new EnterpriseSecretsManager('test');

      expect(MockedSecretsManagerClient).not.toHaveBeenCalled();
      expect(MockedSSMClient).not.toHaveBeenCalled();
    });
  });

  describe('getSecret', () => {
    describe('in development/test environment', () => {
      beforeEach(() => {
        secretsManager = new EnterpriseSecretsManager('development');
      });

      it('should return fallback environment variable when available', async () => {
        process.env.TEST_SECRET = 'fallback-value';

        const result = await secretsManager.getSecret('test-secret', 'TEST_SECRET');

        expect(result).toBe('fallback-value');
      });

      it('should throw error when no fallback is provided', async () => {
        await expect(secretsManager.getSecret('test-secret')).rejects.toThrow(
          'Secret test-secret not available in development environment and no fallback provided'
        );
      });

      it('should throw error when fallback environment variable is not set', async () => {
        await expect(secretsManager.getSecret('test-secret', 'MISSING_VAR')).rejects.toThrow(
          'Secret test-secret not available in development environment and no fallback provided'
        );
      });
    });

    describe('in production environment', () => {
      beforeEach(() => {
        secretsManager = new EnterpriseSecretsManager('production');
      });

      it('should retrieve secret from AWS Secrets Manager', async () => {
        const mockSecretValue = 'production-secret-value';
        mockSecretsClient.send.mockResolvedValue({
          SecretString: mockSecretValue
        });

        const result = await secretsManager.getSecret('prod-secret');

        expect(result).toBe(mockSecretValue);
        expect(mockSecretsClient.send).toHaveBeenCalledWith(
          expect.any(GetSecretValueCommand)
        );
      });

      it('should throw error when secret value is empty', async () => {
        mockSecretsClient.send.mockResolvedValue({
          SecretString: undefined
        });

        await expect(secretsManager.getSecret('empty-secret')).rejects.toThrow(
          'Secret empty-secret value is empty'
        );
      });

      it('should fallback to environment variable when AWS call fails', async () => {
        const consoleWarnSpy = createConsoleSpy('warn');
        const consoleErrorSpy = createConsoleSpy('error');

        mockSecretsClient.send.mockRejectedValue(new Error('AWS Error'));
        process.env.FALLBACK_SECRET = 'fallback-value';

        const result = await secretsManager.getSecret('failing-secret', 'FALLBACK_SECRET');

        expect(result).toBe('fallback-value');
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to retrieve secret failing-secret:',
          expect.any(Error)
        );
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'Using fallback environment variable FALLBACK_SECRET for secret failing-secret'
        );

        restoreConsoleSpy(consoleWarnSpy);
        restoreConsoleSpy(consoleErrorSpy);
      });

      it('should throw error when AWS call fails and no fallback is available', async () => {
        const consoleErrorSpy = createConsoleSpy('error');

        const awsError = new Error('AWS Error');
        mockSecretsClient.send.mockRejectedValue(awsError);

        await expect(secretsManager.getSecret('failing-secret')).rejects.toThrow('AWS Error');

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to retrieve secret failing-secret:',
          awsError
        );

        restoreConsoleSpy(consoleErrorSpy);
      });
    });
  });

  describe('getParameter', () => {
    describe('in development/test environment', () => {
      beforeEach(() => {
        secretsManager = new EnterpriseSecretsManager('test');
      });

      it('should return fallback environment variable when available', async () => {
        process.env.TEST_PARAM = 'param-fallback-value';

        const result = await secretsManager.getParameter('/test/param', 'TEST_PARAM');

        expect(result).toBe('param-fallback-value');
      });

      it('should throw error when no fallback is provided', async () => {
        await expect(secretsManager.getParameter('/test/param')).rejects.toThrow(
          'Parameter /test/param not available in test environment and no fallback provided'
        );
      });
    });

    describe('in production environment', () => {
      beforeEach(() => {
        secretsManager = new EnterpriseSecretsManager('production');
      });

      it('should retrieve parameter from AWS SSM Parameter Store', async () => {
        const mockParameterValue = 'production-parameter-value';
        mockSSMClient.send.mockResolvedValue({
          Parameter: {
            Value: mockParameterValue
          }
        });

        const result = await secretsManager.getParameter('/prod/parameter');

        expect(result).toBe(mockParameterValue);
        expect(mockSSMClient.send).toHaveBeenCalledWith(
          expect.any(Object)
        );
      });

      it('should throw error when parameter value is empty', async () => {
        mockSSMClient.send.mockResolvedValue({
          Parameter: {
            Value: undefined
          }
        });

        await expect(secretsManager.getParameter('/empty/param')).rejects.toThrow(
          'Parameter /empty/param value is empty'
        );
      });

      it('should fallback to environment variable when AWS call fails', async () => {
        const consoleWarnSpy = createConsoleSpy('warn');
        const consoleErrorSpy = createConsoleSpy('error');

        mockSSMClient.send.mockRejectedValue(new Error('SSM Error'));
        process.env.FALLBACK_PARAM = 'param-fallback-value';

        const result = await secretsManager.getParameter('/failing/param', 'FALLBACK_PARAM');

        expect(result).toBe('param-fallback-value');
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to retrieve parameter /failing/param:',
          expect.any(Error)
        );
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'Using fallback environment variable FALLBACK_PARAM for parameter /failing/param'
        );

        restoreConsoleSpy(consoleWarnSpy);
        restoreConsoleSpy(consoleErrorSpy);
      });
    });
  });

  describe('getDatabaseCredentials', () => {
    describe('in development environment', () => {
      beforeEach(() => {
        secretsManager = new EnterpriseSecretsManager('development');
      });

      it('should parse DATABASE_URL when available', async () => {
        process.env.DATABASE_URL = 'postgresql://testuser:testpass@testhost:5433/testdb';

        const result = await secretsManager.getDatabaseCredentials();

        expect(result).toEqual({
          username: 'testuser',
          password: 'testpass',
          host: 'testhost',
          port: 5433,
          database: 'testdb'
        });
      });

      it('should handle DATABASE_URL with missing components', async () => {
        process.env.DATABASE_URL = 'postgresql://localhost:5432/mydb';

        const result = await secretsManager.getDatabaseCredentials();

        expect(result).toEqual({
          username: 'postgres',
          password: 'password',
          host: 'localhost',
          port: 5432,
          database: 'mydb'
        });
      });

      it('should fallback to individual environment variables', async () => {
        delete process.env.DATABASE_URL;
        process.env.DB_USERNAME = 'envuser';
        process.env.DB_PASSWORD = 'envpass';
        process.env.DB_HOST = 'envhost';
        process.env.DB_PORT = '3306';
        process.env.DB_NAME = 'envdb';

        const result = await secretsManager.getDatabaseCredentials();

        expect(result).toEqual({
          username: 'envuser',
          password: 'envpass',
          host: 'envhost',
          port: 3306,
          database: 'envdb'
        });
      });

      it('should use default values when environment variables are missing', async () => {
        delete process.env.DATABASE_URL;
        delete process.env.DB_USERNAME;
        delete process.env.DB_PASSWORD;
        delete process.env.DB_HOST;
        delete process.env.DB_PORT;
        delete process.env.DB_NAME;

        const result = await secretsManager.getDatabaseCredentials();

        expect(result).toEqual({
          username: 'postgres',
          password: 'password',
          host: 'localhost',
          port: 5432,
          database: 'app_db'
        });
      });
    });

    describe('in production environment', () => {
      beforeEach(() => {
        secretsManager = new EnterpriseSecretsManager('production');
      });

      it('should retrieve and parse database credentials from AWS Secrets Manager', async () => {
        const mockCredentials = {
          username: 'prod_user',
          password: 'prod_password',
          host: 'prod.database.com',
          port: 5432,
          database: 'prod_db'
        };

        mockSecretsClient.send.mockResolvedValue({
          SecretString: JSON.stringify(mockCredentials)
        });

        const result = await secretsManager.getDatabaseCredentials();

        expect(result).toEqual(mockCredentials);
        expect(mockSecretsClient.send).toHaveBeenCalledWith(
          expect.any(GetSecretValueCommand)
        );
      });

      it('should use default port when not specified in secret', async () => {
        const mockCredentials = {
          username: 'prod_user',
          password: 'prod_password',
          host: 'prod.database.com',
          database: 'prod_db'
          // port is missing
        };

        mockSecretsClient.send.mockResolvedValue({
          SecretString: JSON.stringify(mockCredentials)
        });

        const result = await secretsManager.getDatabaseCredentials();

        expect(result).toEqual({
          ...mockCredentials,
          port: 5432
        });
      });

      it('should throw error when AWS call fails in production', async () => {
        const awsError = new Error('Secret not found');
        mockSecretsClient.send.mockRejectedValue(awsError);

        await expect(secretsManager.getDatabaseCredentials()).rejects.toThrow('Secret not found');
      });
    });
  });

  describe('getJwtSecret', () => {
    it('should call getSecret with correct parameters', async () => {
      secretsManager = new EnterpriseSecretsManager('development');
      process.env.JWT_SECRET = 'test-jwt-secret';

      const result = await secretsManager.getJwtSecret();

      expect(result).toBe('test-jwt-secret');
    });
  });

  describe('getApiKey', () => {
    it('should call getSecret with correct parameters for service API key', async () => {
      secretsManager = new EnterpriseSecretsManager('development');
      process.env.STRIPE_API_KEY = 'test-stripe-key';

      const result = await secretsManager.getApiKey('stripe');

      expect(result).toBe('test-stripe-key');
    });

    it('should handle service names with different cases', async () => {
      secretsManager = new EnterpriseSecretsManager('development');
      process.env.PAYMENT_SERVICE_API_KEY = 'test-payment-key';

      const result = await secretsManager.getApiKey('payment_service');

      expect(result).toBe('test-payment-key');
    });
  });

  describe('createSecret', () => {
    beforeEach(() => {
      secretsManager = new EnterpriseSecretsManager('production');
    });

    it('should create secret in AWS Secrets Manager', async () => {
      mockSecretsClient.send.mockResolvedValue({});

      await secretsManager.createSecret('new-secret', 'secret-value', 'Test description');

      expect(mockSecretsClient.send).toHaveBeenCalledWith(
        expect.any(Object)
      );
    });

    it('should use default description when not provided', async () => {
      mockSecretsClient.send.mockResolvedValue({});

      await secretsManager.createSecret('new-secret', 'secret-value');

      expect(mockSecretsClient.send).toHaveBeenCalledWith(
        expect.any(Object)
      );
    });

    it('should throw error when client is not initialized', async () => {
      secretsManager = new EnterpriseSecretsManager('development');

      await expect(secretsManager.createSecret('secret', 'value')).rejects.toThrow(
        'Secrets Manager client not initialized for this environment'
      );
    });

    it('should handle AWS errors', async () => {
      const consoleErrorSpy = createConsoleSpy('error');

      const awsError = new Error('AWS Create Error');
      mockSecretsClient.send.mockRejectedValue(awsError);

      await expect(secretsManager.createSecret('failing-secret', 'value')).rejects.toThrow('AWS Create Error');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to create secret failing-secret:',
        awsError
      );

      restoreConsoleSpy(consoleErrorSpy);
    });
  });

  describe('updateSecret', () => {
    beforeEach(() => {
      secretsManager = new EnterpriseSecretsManager('production');
    });

    it('should update secret in AWS Secrets Manager', async () => {
      mockSecretsClient.send.mockResolvedValue({});

      await secretsManager.updateSecret('existing-secret', 'new-value');

      expect(mockSecretsClient.send).toHaveBeenCalledWith(
        expect.any(Object)
      );
    });

    it('should throw error when client is not initialized', async () => {
      secretsManager = new EnterpriseSecretsManager('development');

      await expect(secretsManager.updateSecret('secret', 'value')).rejects.toThrow(
        'Secrets Manager client not initialized for this environment'
      );
    });

    it('should handle AWS errors', async () => {
      const consoleErrorSpy = createConsoleSpy('error');

      const awsError = new Error('AWS Update Error');
      mockSecretsClient.send.mockRejectedValue(awsError);

      await expect(secretsManager.updateSecret('failing-secret', 'value')).rejects.toThrow('AWS Update Error');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to update secret failing-secret:',
        awsError
      );

      restoreConsoleSpy(consoleErrorSpy);
    });
  });

  describe('createParameter', () => {
    beforeEach(() => {
      secretsManager = new EnterpriseSecretsManager('production');
    });

    it('should create parameter in AWS SSM Parameter Store', async () => {
      mockSSMClient.send.mockResolvedValue({});

      await secretsManager.createParameter('/new/parameter', 'parameter-value', 'Test description');

      expect(mockSSMClient.send).toHaveBeenCalledWith(
        expect.any(Object)
      );
    });

    it('should use default description when not provided', async () => {
      mockSSMClient.send.mockResolvedValue({});

      await secretsManager.createParameter('/new/parameter', 'parameter-value');

      expect(mockSSMClient.send).toHaveBeenCalledWith(
        expect.any(Object)
      );
    });

    it('should throw error when client is not initialized', async () => {
      secretsManager = new EnterpriseSecretsManager('development');

      await expect(secretsManager.createParameter('/param', 'value')).rejects.toThrow(
        'SSM client not initialized for this environment'
      );
    });

    it('should handle AWS errors', async () => {
      const consoleErrorSpy = createConsoleSpy('error');

      const awsError = new Error('AWS Parameter Error');
      mockSSMClient.send.mockRejectedValue(awsError);

      await expect(secretsManager.createParameter('/failing/param', 'value')).rejects.toThrow('AWS Parameter Error');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to create parameter /failing/param:',
        awsError
      );

      restoreConsoleSpy(consoleErrorSpy);
    });
  });

  describe('healthCheck', () => {
    describe('in development environment', () => {
      beforeEach(() => {
        secretsManager = new EnterpriseSecretsManager('development');
      });

      it('should return healthy status for development environment', async () => {
        const result = await secretsManager.healthCheck();

        expect(result).toEqual({
          secretsManager: true,
          parameterStore: true
        });
      });
    });

    describe('in production environment', () => {
      beforeEach(() => {
        secretsManager = new EnterpriseSecretsManager('production');
      });

      it('should return healthy status when ResourceNotFoundException is thrown', async () => {
        const resourceNotFoundError = new Error('ResourceNotFoundException');
        resourceNotFoundError.name = 'ResourceNotFoundException';

        const parameterNotFoundError = new Error('ParameterNotFound');
        parameterNotFoundError.name = 'ParameterNotFound';

        mockSecretsClient.send.mockRejectedValue(resourceNotFoundError);
        mockSSMClient.send.mockRejectedValue(parameterNotFoundError);

        const result = await secretsManager.healthCheck();

        expect(result).toEqual({
          secretsManager: true,
          parameterStore: true
        });
      });

      it('should return healthy status when services respond successfully', async () => {
        mockSecretsClient.send.mockResolvedValue({ SecretString: 'test' });
        mockSSMClient.send.mockResolvedValue({ Parameter: { Value: 'test' } });

        const result = await secretsManager.healthCheck();

        expect(result).toEqual({
          secretsManager: true,
          parameterStore: true
        });
      });

      it('should return unhealthy status when unexpected errors occur', async () => {
        const unexpectedError = new Error('Unexpected AWS Error');
        mockSecretsClient.send.mockRejectedValue(unexpectedError);
        mockSSMClient.send.mockRejectedValue(unexpectedError);

        const result = await secretsManager.healthCheck();

        expect(result).toEqual({
          secretsManager: false,
          parameterStore: false
        });
      });

      it('should handle mixed health statuses', async () => {
        const resourceNotFoundError = new Error('ResourceNotFoundException');
        resourceNotFoundError.name = 'ResourceNotFoundException';

        const unexpectedError = new Error('Unexpected Error');

        mockSecretsClient.send.mockRejectedValue(resourceNotFoundError);
        mockSSMClient.send.mockRejectedValue(unexpectedError);

        const result = await secretsManager.healthCheck();

        expect(result).toEqual({
          secretsManager: true,
          parameterStore: false
        });
      });
    });
  });

  describe('ReDoS Protection Tests', () => {
    beforeEach(() => {
      secretsManager = new EnterpriseSecretsManager('development');
    });

    it('should handle malicious input patterns safely', async () => {
      const startTime = Date.now();

      // Test with potentially malicious patterns that could cause ReDoS
      const maliciousPatterns = [
        'a'.repeat(10000),
        'secret-' + 'a'.repeat(5000) + '-key',
        '/param/' + 'b'.repeat(5000),
        JSON.stringify({ key: 'a'.repeat(10000) })
      ];

      // Test secret names
      for (const pattern of maliciousPatterns) {
        process.env.TEST_SECRET = 'safe-value';
        await secretsManager.getSecret(pattern, 'TEST_SECRET').catch(() => {
          // Expected to fail, we're testing performance not success
        });
      }

      const endTime = Date.now();

      // Must complete under 100ms even with attack patterns
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should handle malicious DATABASE_URL patterns safely', async () => {
      const startTime = Date.now();

      const maliciousUrls = [
        'postgresql://user:pass@host:5432/' + 'a'.repeat(10000),
        'postgresql://' + 'u'.repeat(1000) + ':' + 'p'.repeat(1000) + '@host:5432/db',
      ];

      for (const url of maliciousUrls) {
        process.env.DATABASE_URL = url;
        try {
          await secretsManager.getDatabaseCredentials();
        } catch {
          // Expected to fail, we're testing performance
        }
      }

      const endTime = Date.now();

      // Must complete under 100ms even with attack patterns
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});

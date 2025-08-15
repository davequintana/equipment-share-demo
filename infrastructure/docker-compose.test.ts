import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';

describe('Docker Compose PostgreSQL Configuration Tests', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let compose: any;

  beforeAll(async () => {
    const composePath = path.join(process.cwd(), 'docker-compose.yml');
    const composeContent = await fs.readFile(composePath, 'utf8');
    compose = yaml.parse(composeContent);
  });

  describe('PostgreSQL Service Configuration', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let postgresService: any;
    beforeAll(() => {
      postgresService = compose.services.postgres;
    });

    it('should use PostgreSQL 16.2 enterprise image', () => {
      expect(postgresService.image).toBe('postgres:16.2');
    });

    it('should have enterprise environment configuration', () => {
      const env = postgresService.environment;
      expect(env.POSTGRES_DB).toBe('enterprise_db');
      expect(env.POSTGRES_USER).toBe('enterprise');
      expect(env.POSTGRES_PASSWORD).toBe('${POSTGRES_PASSWORD:-enterprise_secure_password}');
      expect(env.POSTGRES_INITDB_ARGS).toBe('--auth-host=scram-sha-256 --auth-local=scram-sha-256');
    });

    it('should mount enterprise configuration files', () => {
      const volumes = postgresService.volumes;
      expect(volumes).toContain('./infrastructure/postgres/postgresql.conf:/etc/postgresql/postgresql.conf:ro');
      expect(volumes).toContain('./infrastructure/postgres/pg_hba.conf:/etc/postgresql/pg_hba.conf:ro');
      expect(volumes).toContain('./infrastructure/postgres/enterprise-config.sql:/docker-entrypoint-initdb.d/01-enterprise-config.sql:ro');
    });

    it('should have performance and security command flags', () => {
      const command = postgresService.command;
      expect(command).toContain('-c config_file=/etc/postgresql/postgresql.conf');
      expect(command).toContain('-c hba_file=/etc/postgresql/pg_hba.conf');
      expect(command).toContain('-c shared_preload_libraries=pg_stat_statements,auto_explain');
      expect(command).toContain('-c log_statement=mod');
      expect(command).toContain('-c log_min_duration_statement=5000');
    });

    it('should expose standard PostgreSQL port', () => {
      expect(postgresService.ports).toContain('5432:5432');
    });

    it('should have proper restart policy', () => {
      expect(postgresService.restart).toBe('unless-stopped');
    });

    it('should have persistent volume configuration', () => {
      const volumes = postgresService.volumes;
      expect(volumes).toContain('postgres_data:/var/lib/postgresql/data');
    });

    it('should have health check configuration', () => {
      const healthcheck = postgresService.healthcheck;
      expect(healthcheck.test).toContain('pg_isready');
      expect(healthcheck.test).toContain('-U enterprise');
      expect(healthcheck.test).toContain('-d enterprise_db');
      expect(healthcheck.interval).toBe('10s');
      expect(healthcheck.timeout).toBe('5s');
      expect(healthcheck.retries).toBe(5);
      expect(healthcheck.start_period).toBe('30s');
    });

    it('should have proper logging configuration', () => {
      const logging = postgresService.logging;
      expect(logging.driver).toBe('json-file');
      expect(logging.options['max-size']).toBe('10m');
      expect(logging.options['max-file']).toBe('3');
    });

    it('should have security labels for enterprise deployment', () => {
      const labels = postgresService.labels;
      expect(labels['app.type']).toBe('database');
      expect(labels['app.env']).toBe('development');
      expect(labels['security.level']).toBe('enterprise');
      expect(labels['backup.required']).toBe('true');
      expect(labels['monitoring.enabled']).toBe('true');
    });
  });

  describe('Volume Configuration', () => {
    it('should have postgres_data volume defined', () => {
      expect(compose.volumes).toHaveProperty('postgres_data');
      expect(compose.volumes.postgres_data.driver).toBe('local');
    });
  });

  describe('Network Configuration', () => {
    it('should use app-network for service isolation', () => {
      const postgresService = compose.services.postgres;
      expect(postgresService.networks).toContain('app-network');
    });

    it('should have app-network defined', () => {
      expect(compose.networks).toHaveProperty('app-network');
      expect(compose.networks['app-network'].driver).toBe('bridge');
    });
  });

  describe('Redis Service Integration', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let redisService: any;

    beforeAll(() => {
      redisService = compose.services.redis;
    });

    it('should have Redis configured for caching', () => {
      expect(redisService.image).toBe('redis:7-alpine');
      expect(redisService.restart).toBe('unless-stopped');
    });

    it('should have Redis health check', () => {
      const healthcheck = redisService.healthcheck;
      expect(healthcheck.test).toContain('redis-cli ping');
      expect(healthcheck.interval).toBe('10s');
    });

    it('should expose Redis port', () => {
      expect(redisService.ports).toContain('6379:6379');
    });

    it('should use same network as PostgreSQL', () => {
      expect(redisService.networks).toContain('app-network');
    });
  });

  describe('Service Dependencies', () => {
    it('should have postgres and redis as core services', () => {
      expect(compose.services).toHaveProperty('postgres');
      expect(compose.services).toHaveProperty('redis');
    });

    it('should have proper service isolation via networks', () => {
      const services = ['postgres', 'redis'];
      services.forEach(serviceName => {
        const service = compose.services[serviceName];
        expect(service.networks).toContain('app-network');
      });
    });
  });

  describe('Development Environment', () => {
    it('should expose database ports for development access', () => {
      const postgresService = compose.services.postgres;
      expect(postgresService.ports).toContain('5432:5432');
    });

    it('should have appropriate restart policies for development', () => {
      const services = ['postgres', 'redis'];
      services.forEach(serviceName => {
        const service = compose.services[serviceName];
        expect(service.restart).toBe('unless-stopped');
      });
    });
  });
});

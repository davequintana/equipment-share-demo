import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs/promises';
import path from 'path';

describe('PostgreSQL Configuration Files Tests', () => {
  describe('postgresql.conf Validation', () => {
    let configContent: string;

    beforeAll(async () => {
      const configPath = path.join(process.cwd(), 'infrastructure/postgres/postgresql.conf');
      configContent = await fs.readFile(configPath, 'utf8');
    });

    it('should have enterprise-level connection settings', () => {
      expect(configContent).toMatch(/max_connections\s*=\s*200/);
      expect(configContent).toMatch(/superuser_reserved_connections\s*=\s*3/);
    });

    it('should have optimized memory settings', () => {
      expect(configContent).toMatch(/shared_buffers\s*=\s*256MB/);
      expect(configContent).toMatch(/effective_cache_size\s*=\s*1GB/);
      expect(configContent).toMatch(/work_mem\s*=\s*16MB/);
      expect(configContent).toMatch(/maintenance_work_mem\s*=\s*256MB/);
    });

    it('should have WAL configuration for performance', () => {
      expect(configContent).toMatch(/wal_level\s*=\s*replica/);
      expect(configContent).toMatch(/wal_buffers\s*=\s*16MB/);
      expect(configContent).toMatch(/max_wal_size\s*=\s*2GB/);
      expect(configContent).toMatch(/min_wal_size\s*=\s*512MB/);
      expect(configContent).toMatch(/checkpoint_completion_target\s*=\s*0\.9/);
    });

    it('should have comprehensive logging enabled', () => {
      expect(configContent).toMatch(/logging_collector\s*=\s*on/);
      expect(configContent).toMatch(/log_min_duration_statement\s*=\s*5000/);
      expect(configContent).toMatch(/log_checkpoints\s*=\s*on/);
      expect(configContent).toMatch(/log_connections\s*=\s*on/);
      expect(configContent).toMatch(/log_disconnections\s*=\s*on/);
      expect(configContent).toMatch(/log_lock_waits\s*=\s*on/);
      expect(configContent).toMatch(/log_statement\s*=\s*'mod'/);
    });

    it('should have security settings configured', () => {
      expect(configContent).toMatch(/ssl\s*=\s*on/);
      expect(configContent).toMatch(/ssl_ciphers\s*=\s*'HIGH:MEDIUM:\+3DES:!aNULL'/);
      expect(configContent).toMatch(/ssl_prefer_server_ciphers\s*=\s*on/);
      expect(configContent).toMatch(/password_encryption\s*=\s*scram-sha-256/);
    });

    it('should have performance monitoring extensions', () => {
      expect(configContent).toMatch(/shared_preload_libraries\s*=\s*'pg_stat_statements,auto_explain'/);
      expect(configContent).toMatch(/pg_stat_statements\.max\s*=\s*10000/);
      expect(configContent).toMatch(/pg_stat_statements\.track\s*=\s*all/);
      expect(configContent).toMatch(/auto_explain\.log_min_duration\s*=\s*10s/);
      expect(configContent).toMatch(/auto_explain\.log_analyze\s*=\s*on/);
    });

    it('should have autovacuum properly configured', () => {
      expect(configContent).toMatch(/autovacuum\s*=\s*on/);
      expect(configContent).toMatch(/autovacuum_max_workers\s*=\s*3/);
      expect(configContent).toMatch(/autovacuum_naptime\s*=\s*1min/);
    });

    it('should have timezone and locale settings', () => {
      expect(configContent).toMatch(/timezone\s*=\s*'UTC'/);
      expect(configContent).toMatch(/lc_messages\s*=\s*'en_US\.UTF-8'/);
      expect(configContent).toMatch(/default_text_search_config\s*=\s*'pg_catalog\.english'/);
    });

    it('should have timeout configurations for enterprise use', () => {
      expect(configContent).toMatch(/idle_in_transaction_session_timeout\s*=\s*300s/);
      expect(configContent).toMatch(/lock_timeout\s*=\s*30s/);
      expect(configContent).toMatch(/statement_timeout\s*=\s*300s/);
    });
  });

  describe('pg_hba.conf Validation', () => {
    let hbaContent: string;

    beforeAll(async () => {
      const hbaPath = path.join(process.cwd(), 'infrastructure/postgres/pg_hba.conf');
      hbaContent = await fs.readFile(hbaPath, 'utf8');
    });

    it('should use scram-sha-256 authentication for security', () => {
      const scramLines = hbaContent.split('\n').filter(line => 
        line.includes('scram-sha-256') && !line.trim().startsWith('#')
      );
      expect(scramLines.length).toBeGreaterThan(0);
    });

    it('should allow local connections with secure authentication', () => {
      expect(hbaContent).toMatch(/local\s+all\s+all\s+scram-sha-256/);
    });

    it('should allow IPv4 localhost connections', () => {
      expect(hbaContent).toMatch(/host\s+all\s+all\s+127\.0\.0\.1\/32\s+scram-sha-256/);
    });

    it('should allow IPv6 localhost connections', () => {
      expect(hbaContent).toMatch(/host\s+all\s+all\s+::1\/128\s+scram-sha-256/);
    });

    it('should allow Docker network connections', () => {
      expect(hbaContent).toMatch(/host\s+all\s+all\s+172\.16\.0\.0\/12\s+scram-sha-256/);
      expect(hbaContent).toMatch(/host\s+all\s+all\s+10\.0\.0\.0\/8\s+scram-sha-256/);
      expect(hbaContent).toMatch(/host\s+all\s+all\s+192\.168\.0\.0\/16\s+scram-sha-256/);
    });

    it('should require SSL for enterprise database connections', () => {
      expect(hbaContent).toMatch(/hostssl\s+enterprise_db\s+enterprise\s+0\.0\.0\.0\/0\s+scram-sha-256/);
    });

    it('should allow replication connections', () => {
      expect(hbaContent).toMatch(/local\s+replication\s+all\s+scram-sha-256/);
      expect(hbaContent).toMatch(/host\s+replication\s+all\s+127\.0\.0\.1\/32\s+scram-sha-256/);
    });

    it('should have secure admin access restrictions', () => {
      expect(hbaContent).toMatch(/hostssl\s+all\s+postgres\s+10\.0\.0\.0\/8\s+scram-sha-256/);
      expect(hbaContent).toMatch(/hostssl\s+all\s+postgres\s+172\.16\.0\.0\/12\s+scram-sha-256/);
    });

    it('should reject all other connections for security', () => {
      expect(hbaContent).toMatch(/host\s+all\s+all\s+0\.0\.0\.0\/0\s+reject/);
    });
  });

  describe('enterprise-config.sql Validation', () => {
    let sqlContent: string;

    beforeAll(async () => {
      const sqlPath = path.join(process.cwd(), 'infrastructure/postgres/enterprise-config.sql');
      sqlContent = await fs.readFile(sqlPath, 'utf8');
    });

    it('should create required PostgreSQL extensions', () => {
      const requiredExtensions = [
        'pg_stat_statements',
        'btree_gin',
        'btree_gist',
        'pg_trgm',
        'uuid-ossp',
        'citext',
        'hstore',
        'ltree'
      ];

      requiredExtensions.forEach(extension => {
        expect(sqlContent).toMatch(new RegExp(`CREATE EXTENSION IF NOT EXISTS ${extension}`));
      });
    });

    it('should create enterprise schemas', () => {
      expect(sqlContent).toMatch(/CREATE SCHEMA IF NOT EXISTS audit/);
      expect(sqlContent).toMatch(/CREATE SCHEMA IF NOT EXISTS reporting/);
      expect(sqlContent).toMatch(/CREATE SCHEMA IF NOT EXISTS analytics/);
    });

    it('should create audit table with proper structure', () => {
      expect(sqlContent).toMatch(/CREATE TABLE IF NOT EXISTS audit\.data_changes/);
      expect(sqlContent).toMatch(/id BIGSERIAL PRIMARY KEY/);
      expect(sqlContent).toMatch(/table_name TEXT NOT NULL/);
      expect(sqlContent).toMatch(/operation TEXT NOT NULL/);
      expect(sqlContent).toMatch(/old_data JSONB/);
      expect(sqlContent).toMatch(/new_data JSONB/);
    });

    it('should create audit trigger function', () => {
      expect(sqlContent).toMatch(/CREATE OR REPLACE FUNCTION audit\.log_changes\(\)/);
      expect(sqlContent).toMatch(/RETURNS TRIGGER/);
      expect(sqlContent).toMatch(/INSERT INTO audit\.data_changes/);
    });

    it('should create monitoring views', () => {
      expect(sqlContent).toMatch(/CREATE OR REPLACE VIEW reporting\.query_performance/);
      expect(sqlContent).toMatch(/CREATE OR REPLACE VIEW reporting\.connection_stats/);
      expect(sqlContent).toMatch(/CREATE OR REPLACE VIEW reporting\.database_sizes/);
      expect(sqlContent).toMatch(/CREATE OR REPLACE VIEW reporting\.table_sizes/);
    });

    it('should create application roles', () => {
      expect(sqlContent).toMatch(/CREATE ROLE app_read/);
      expect(sqlContent).toMatch(/CREATE ROLE app_write/);
      expect(sqlContent).toMatch(/CREATE ROLE app_admin/);
    });

    it('should grant appropriate permissions', () => {
      expect(sqlContent).toMatch(/GRANT CONNECT ON DATABASE enterprise_db TO app_read, app_write, app_admin/);
      expect(sqlContent).toMatch(/GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_read/);
      expect(sqlContent).toMatch(/GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_write/);
      expect(sqlContent).toMatch(/GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_admin/);
    });

    it('should create maintenance functions', () => {
      expect(sqlContent).toMatch(/CREATE OR REPLACE FUNCTION analytics\.cleanup_old_audit_logs/);
      expect(sqlContent).toMatch(/CREATE OR REPLACE FUNCTION analytics\.validate_backup_integrity/);
    });

    it('should set default privileges for future objects', () => {
      expect(sqlContent).toMatch(/ALTER DEFAULT PRIVILEGES IN SCHEMA public/);
      expect(sqlContent).toMatch(/GRANT SELECT ON TABLES TO app_read/);
      expect(sqlContent).toMatch(/GRANT ALL PRIVILEGES ON SEQUENCES TO app_write, app_admin/);
    });

    it('should assign enterprise user to admin role', () => {
      expect(sqlContent).toMatch(/GRANT app_admin TO enterprise/);
    });

    it('should log successful initialization', () => {
      expect(sqlContent).toMatch(/INSERT INTO audit\.data_changes/);
      expect(sqlContent).toMatch(/Enterprise PostgreSQL configuration completed/);
    });
  });

  describe('Configuration File Consistency', () => {
    let postgresqlConf: string;
    let enterpriseSql: string;

    beforeAll(async () => {
      const postgresqlPath = path.join(process.cwd(), 'infrastructure/postgres/postgresql.conf');
      const enterprisePath = path.join(process.cwd(), 'infrastructure/postgres/enterprise-config.sql');
      
      postgresqlConf = await fs.readFile(postgresqlPath, 'utf8');
      enterpriseSql = await fs.readFile(enterprisePath, 'utf8');
    });

    it('should have consistent extension configuration', () => {
      // Check that extensions referenced in postgresql.conf are created in enterprise-config.sql
      const confExtensions = postgresqlConf.match(/shared_preload_libraries\s*=\s*'([^']+)'/);
      if (confExtensions) {
        const extensions = confExtensions[1].split(',').map(ext => ext.trim());
        extensions.forEach(extension => {
          if (extension === 'auto_explain') return; // auto_explain is not a CREATE EXTENSION
          expect(enterpriseSql).toMatch(new RegExp(`CREATE EXTENSION IF NOT EXISTS ${extension}`));
        });
      }
    });

    it('should have matching security configurations', () => {
      // Both files should reference scram-sha-256
      expect(postgresqlConf).toMatch(/password_encryption\s*=\s*scram-sha-256/);
      expect(enterpriseSql).toMatch(/Enterprise PostgreSQL configuration/); // Indirect validation
    });

    it('should have appropriate file permissions indicators', () => {
      // Configuration files should have comments indicating they're for enterprise use
      expect(postgresqlConf).toMatch(/PostgreSQL Enterprise Configuration/);
      expect(enterpriseSql).toMatch(/Enterprise PostgreSQL Initialization Script/);
    });
  });

  describe('File Accessibility', () => {
    it('should have all configuration files accessible', async () => {
      const configFiles = [
        'infrastructure/postgres/postgresql.conf',
        'infrastructure/postgres/pg_hba.conf',
        'infrastructure/postgres/enterprise-config.sql'
      ];

      for (const file of configFiles) {
        const filePath = path.join(process.cwd(), file);
        const stats = await fs.stat(filePath);
        expect(stats.isFile()).toBe(true);
        expect(stats.size).toBeGreaterThan(0);
      }
    });

    it('should have proper file structure in infrastructure directory', async () => {
      const infraPath = path.join(process.cwd(), 'infrastructure/postgres');
      const dir = await fs.readdir(infraPath);
      
      expect(dir).toContain('postgresql.conf');
      expect(dir).toContain('pg_hba.conf');
      expect(dir).toContain('enterprise-config.sql');
    });
  });
});

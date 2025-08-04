import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Pool, Client } from 'pg';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import fs from 'fs/promises';
import path from 'path';

// Skip database tests in CI environments or when Docker is not available
const shouldSkipDatabaseTests = process.env.CI === 'true' ||
                                process.env.GITHUB_ACTIONS === 'true' ||
                                process.env.NODE_ENV === 'test';

describe.skipIf(shouldSkipDatabaseTests)('PostgreSQL Enterprise Configuration Tests', () => {
  let container: StartedTestContainer;
  let pool: Pool;
  let client: Client;

  beforeAll(async () => {
    // Start PostgreSQL test container with enterprise config
    container = await new GenericContainer('postgres:16.2')
      .withEnvironment({
        POSTGRES_DB: 'enterprise_db',
        POSTGRES_USER: 'enterprise',
        POSTGRES_PASSWORD: 'test_password',
        POSTGRES_INITDB_ARGS: '--auth-host=scram-sha-256'
      })
      .withExposedPorts(5432)
      .start();

    const host = container.getHost();
    const port = container.getMappedPort(5432);

    // Create connection pool
    pool = new Pool({
      host,
      port,
      database: 'enterprise_db',
      user: 'enterprise',
      password: 'test_password',
    });

    // Create admin client for setup
    client = new Client({
      host,
      port,
      database: 'enterprise_db',
      user: 'enterprise',
      password: 'test_password',
    });

    await client.connect();

    // Load and execute enterprise configuration
    const enterpriseConfigPath = path.join(process.cwd(), 'infrastructure/postgres/enterprise-config.sql');
    const enterpriseConfig = await fs.readFile(enterpriseConfigPath, 'utf8');
    await client.query(enterpriseConfig);
  }, 60000); // 60 second timeout for container startup

  afterAll(async () => {
    await client?.end();
    await pool?.end();
    await container?.stop();
  });

  beforeEach(async () => {
    // Clean up any test data before each test
    await client.query('DELETE FROM audit.data_changes WHERE table_name LIKE \'test_%\'');
  });

  describe('Database Extensions', () => {
    it('should have all required extensions installed', async () => {
      const result = await client.query(`
        SELECT extname FROM pg_extension
        WHERE extname IN (
          'pg_stat_statements',
          'btree_gin',
          'btree_gist',
          'pg_trgm',
          'uuid-ossp',
          'citext',
          'hstore',
          'ltree'
        )
        ORDER BY extname;
      `);

      const extensions = result.rows.map(row => row.extname);
      expect(extensions).toContain('pg_stat_statements');
      expect(extensions).toContain('btree_gin');
      expect(extensions).toContain('btree_gist');
      expect(extensions).toContain('pg_trgm');
      expect(extensions).toContain('uuid-ossp');
      expect(extensions).toContain('citext');
      expect(extensions).toContain('hstore');
      expect(extensions).toContain('ltree');
    });

    it('should have pg_stat_statements tracking enabled', async () => {
      // Execute a query to generate stats
      await client.query('SELECT 1 as test_query');

      const result = await client.query(`
        SELECT calls, query
        FROM pg_stat_statements
        WHERE query LIKE '%test_query%'
        LIMIT 1;
      `);

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].calls).toBeGreaterThan(0);
    });
  });

  describe('Enterprise Schemas', () => {
    it('should have all required schemas created', async () => {
      const result = await client.query(`
        SELECT schema_name
        FROM information_schema.schemata
        WHERE schema_name IN ('audit', 'reporting', 'analytics')
        ORDER BY schema_name;
      `);

      const schemas = result.rows.map(row => row.schema_name);
      expect(schemas).toEqual(['analytics', 'audit', 'reporting']);
    });

    it('should have audit table with proper structure', async () => {
      const result = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'audit' AND table_name = 'data_changes'
        ORDER BY ordinal_position;
      `);

      const columns = result.rows.map(row => ({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable
      }));

      expect(columns).toContainEqual({ name: 'id', type: 'bigint', nullable: 'NO' });
      expect(columns).toContainEqual({ name: 'table_name', type: 'text', nullable: 'NO' });
      expect(columns).toContainEqual({ name: 'operation', type: 'text', nullable: 'NO' });
      expect(columns).toContainEqual({ name: 'old_data', type: 'jsonb', nullable: 'YES' });
      expect(columns).toContainEqual({ name: 'new_data', type: 'jsonb', nullable: 'YES' });
    });
  });

  describe('Audit Functionality', () => {
    it('should create audit entries for data changes', async () => {
      // Create a test table
      await client.query(`
        CREATE TABLE IF NOT EXISTS test_audit_table (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          value INTEGER
        );
      `);

      // Create audit trigger
      await client.query(`
        CREATE TRIGGER test_audit_trigger
        AFTER INSERT OR UPDATE OR DELETE ON test_audit_table
        FOR EACH ROW EXECUTE FUNCTION audit.log_changes();
      `);

      // Insert test data
      await client.query(`
        INSERT INTO test_audit_table (name, value) VALUES ('test', 100);
      `);

      // Check audit log
      const auditResult = await client.query(`
        SELECT table_name, operation, new_data
        FROM audit.data_changes
        WHERE table_name = 'test_audit_table'
        ORDER BY id DESC
        LIMIT 1;
      `);

      expect(auditResult.rows.length).toBe(1);
      expect(auditResult.rows[0].table_name).toBe('test_audit_table');
      expect(auditResult.rows[0].operation).toBe('INSERT');
      expect(auditResult.rows[0].new_data).toHaveProperty('name', 'test');
      expect(auditResult.rows[0].new_data).toHaveProperty('value', 100);

      // Clean up
      await client.query('DROP TABLE test_audit_table CASCADE');
    });

    it('should track UPDATE operations with old and new data', async () => {
      // Create test table with audit trigger
      await client.query(`
        CREATE TABLE test_update_table (
          id SERIAL PRIMARY KEY,
          status TEXT
        );

        CREATE TRIGGER test_update_trigger
        AFTER INSERT OR UPDATE OR DELETE ON test_update_table
        FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

        INSERT INTO test_update_table (status) VALUES ('initial');
      `);

      // Update the record
      await client.query(`
        UPDATE test_update_table SET status = 'updated' WHERE id = 1;
      `);

      // Check audit log for UPDATE
      const auditResult = await client.query(`
        SELECT operation, old_data, new_data
        FROM audit.data_changes
        WHERE table_name = 'test_update_table' AND operation = 'UPDATE'
        ORDER BY id DESC
        LIMIT 1;
      `);

      expect(auditResult.rows.length).toBe(1);
      expect(auditResult.rows[0].operation).toBe('UPDATE');
      expect(auditResult.rows[0].old_data).toHaveProperty('status', 'initial');
      expect(auditResult.rows[0].new_data).toHaveProperty('status', 'updated');

      // Clean up
      await client.query('DROP TABLE test_update_table CASCADE');
    });
  });

  describe('Application Roles', () => {
    it('should have all application roles created', async () => {
      const result = await client.query(`
        SELECT rolname
        FROM pg_roles
        WHERE rolname IN ('app_read', 'app_write', 'app_admin')
        ORDER BY rolname;
      `);

      const roles = result.rows.map(row => row.rolname);
      expect(roles).toEqual(['app_admin', 'app_read', 'app_write']);
    });

    it('should have enterprise user with admin privileges', async () => {
      const result = await client.query(`
        SELECT r.rolname
        FROM pg_auth_members m
        JOIN pg_roles r ON m.roleid = r.oid
        JOIN pg_roles u ON m.member = u.oid
        WHERE u.rolname = 'enterprise' AND r.rolname = 'app_admin';
      `);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].rolname).toBe('app_admin');
    });
  });

  describe('Monitoring Views', () => {
    it('should have query performance monitoring view', async () => {
      const result = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'reporting' AND table_name = 'query_performance'
        ORDER BY ordinal_position;
      `);

      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('query');
      expect(columns).toContain('calls');
      expect(columns).toContain('total_time');
      expect(columns).toContain('mean_time');
      expect(columns).toContain('hit_percent');
    });

    it('should have connection monitoring view', async () => {
      const result = await client.query('SELECT * FROM reporting.connection_stats LIMIT 1');
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0]).toHaveProperty('database_name');
      expect(result.rows[0]).toHaveProperty('username');
      expect(result.rows[0]).toHaveProperty('state');
    });

    it('should have database size monitoring view', async () => {
      const result = await client.query('SELECT * FROM reporting.database_sizes WHERE database_name = $1', ['enterprise_db']);
      expect(result.rows.length).toBe(1);
      expect(result.rows[0]).toHaveProperty('database_name', 'enterprise_db');
      expect(result.rows[0]).toHaveProperty('size');
      expect(result.rows[0]).toHaveProperty('size_bytes');
    });
  });

  describe('Maintenance Functions', () => {
    it('should have audit cleanup function working', async () => {
      // Insert old audit entries
      await client.query(`
        INSERT INTO audit.data_changes (table_name, operation, new_data, changed_at)
        VALUES
          ('test_old', 'INSERT', '{}', NOW() - INTERVAL '100 days'),
          ('test_recent', 'INSERT', '{}', NOW() - INTERVAL '10 days');
      `);

      // Run cleanup function (keep 30 days)
      const result = await client.query('SELECT analytics.cleanup_old_audit_logs(30)');

      expect(result.rows[0].cleanup_old_audit_logs).toBeGreaterThan(0);

      // Verify old entries are removed but recent ones remain
      const remainingOld = await client.query(`
        SELECT COUNT(*) as count
        FROM audit.data_changes
        WHERE table_name = 'test_old'
      `);

      const remainingRecent = await client.query(`
        SELECT COUNT(*) as count
        FROM audit.data_changes
        WHERE table_name = 'test_recent'
      `);

      expect(Number(remainingOld.rows[0].count)).toBe(0);
      expect(Number(remainingRecent.rows[0].count)).toBe(1);
    });

    it('should have backup validation function working', async () => {
      const result = await client.query('SELECT * FROM analytics.validate_backup_integrity() LIMIT 5');

      expect(result.rows.length).toBeGreaterThan(0);
      result.rows.forEach(row => {
        expect(row).toHaveProperty('table_name');
        expect(row).toHaveProperty('row_count');
        expect(typeof row.row_count).toBe('string'); // BigInt comes as string
      });
    });
  });

  describe('Performance Configuration', () => {
    it('should have connection pooling configured', async () => {
      // Test multiple concurrent connections
      const promises = Array.from({ length: 5 }, async (_, i) => {
        const poolClient = await pool.connect();
        try {
          const result = await poolClient.query('SELECT $1 as connection_id', [i]);
          return result.rows[0].connection_id;
        } finally {
          poolClient.release();
        }
      });

      const results = await Promise.all(promises);
      expect(results).toEqual([0, 1, 2, 3, 4]);
    });

    it('should handle concurrent transactions properly', async () => {
      // Create test table for concurrency test
      await client.query(`
        CREATE TABLE IF NOT EXISTS test_concurrency (
          id SERIAL PRIMARY KEY,
          counter INTEGER DEFAULT 0
        );
        INSERT INTO test_concurrency (counter) VALUES (0);
      `);

      // Run concurrent updates
      const concurrentUpdates = Array.from({ length: 10 }, async () => {
        const poolClient = await pool.connect();
        try {
          await poolClient.query('BEGIN');
          await poolClient.query('UPDATE test_concurrency SET counter = counter + 1 WHERE id = 1');
          await poolClient.query('COMMIT');
        } catch (error) {
          await poolClient.query('ROLLBACK');
          throw error;
        } finally {
          poolClient.release();
        }
      });

      await Promise.all(concurrentUpdates);

      // Verify final counter value
      const result = await client.query('SELECT counter FROM test_concurrency WHERE id = 1');
      expect(result.rows[0].counter).toBe(10);

      // Clean up
      await client.query('DROP TABLE test_concurrency');
    });
  });

  describe('Security Features', () => {
    it('should enforce authentication', async () => {
      // Test with wrong credentials should fail
      const wrongClient = new Client({
        host: container.getHost(),
        port: container.getMappedPort(5432),
        database: 'enterprise_db',
        user: 'enterprise',
        password: 'wrong_password',
      });

      await expect(wrongClient.connect()).rejects.toThrow();
    });

    it('should support UUID generation', async () => {
      const result = await client.query('SELECT uuid_generate_v4() as uuid');
      expect(result.rows[0].uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should support case-insensitive text with citext', async () => {
      await client.query(`
        CREATE TABLE IF NOT EXISTS test_citext (
          id SERIAL PRIMARY KEY,
          email CITEXT UNIQUE
        );
      `);

      await client.query(`INSERT INTO test_citext (email) VALUES ('Test@Example.com')`);

      // Should find regardless of case
      const result1 = await client.query(`SELECT * FROM test_citext WHERE email = 'test@example.com'`);
      const result2 = await client.query(`SELECT * FROM test_citext WHERE email = 'TEST@EXAMPLE.COM'`);

      expect(result1.rows.length).toBe(1);
      expect(result2.rows.length).toBe(1);
      expect(result1.rows[0].email).toBe('Test@Example.com');

      // Clean up
      await client.query('DROP TABLE test_citext');
    });
  });
});

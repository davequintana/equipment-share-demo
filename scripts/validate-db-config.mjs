#!/usr/bin/env node

/**
 * Manual validation script for PostgreSQL Enterprise Configuration
 * This script validates the configuration files without requiring vitest
 */

import fs from 'fs/promises';
import path from 'path';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function validatePostgreSQLConf() {
  log('\n🔍 Validating postgresql.conf...', colors.blue);
  
  try {
    const configPath = path.join(process.cwd(), 'infrastructure/postgres/postgresql.conf');
    const content = await fs.readFile(configPath, 'utf8');

    const checks = [
      { pattern: /max_connections\s*=\s*200/, name: 'Connection limit set to 200' },
      { pattern: /shared_buffers\s*=\s*256MB/, name: 'Shared buffers configured' },
      { pattern: /effective_cache_size\s*=\s*1GB/, name: 'Cache size optimized' },
      { pattern: /wal_level\s*=\s*replica/, name: 'WAL level for replication' },
      { pattern: /ssl\s*=\s*on/, name: 'SSL encryption enabled' },
      { pattern: /password_encryption\s*=\s*scram-sha-256/, name: 'SCRAM-SHA-256 authentication' },
      { pattern: /shared_preload_libraries\s*=\s*'pg_stat_statements,auto_explain'/, name: 'Performance extensions loaded' },
      { pattern: /log_statement\s*=\s*'mod'/, name: 'Statement logging enabled' },
      { pattern: /autovacuum\s*=\s*on/, name: 'Autovacuum enabled' }
    ];

    let passed = 0;
    for (const check of checks) {
      if (check.pattern.test(content)) {
        log(`  ✅ ${check.name}`, colors.green);
        passed++;
      } else {
        log(`  ❌ ${check.name}`, colors.red);
      }
    }

    log(`\n📊 postgresql.conf: ${passed}/${checks.length} checks passed`, 
        passed === checks.length ? colors.green : colors.yellow);
    
    return passed === checks.length;
  } catch (error) {
    log(`❌ Error reading postgresql.conf: ${error.message}`, colors.red);
    return false;
  }
}

async function validatePgHba() {
  log('\n🔍 Validating pg_hba.conf...', colors.blue);
  
  try {
    const hbaPath = path.join(process.cwd(), 'infrastructure/postgres/pg_hba.conf');
    const content = await fs.readFile(hbaPath, 'utf8');

    const checks = [
      { pattern: /local\s+all\s+all\s+scram-sha-256/, name: 'Local SCRAM authentication' },
      { pattern: /host\s+all\s+all\s+127\.0\.0\.1\/32\s+scram-sha-256/, name: 'IPv4 localhost authentication' },
      { pattern: /host\s+all\s+all\s+172\.16\.0\.0\/12\s+scram-sha-256/, name: 'Docker network access' },
      { pattern: /hostssl\s+enterprise_db\s+enterprise\s+0\.0\.0\.0\/0\s+scram-sha-256/, name: 'SSL required for enterprise DB' },
      { pattern: /host\s+replication\s+all/, name: 'Replication configured' },
      { pattern: /host\s+all\s+all\s+0\.0\.0\.0\/0\s+reject/, name: 'Default reject rule' }
    ];

    let passed = 0;
    for (const check of checks) {
      if (check.pattern.test(content)) {
        log(`  ✅ ${check.name}`, colors.green);
        passed++;
      } else {
        log(`  ❌ ${check.name}`, colors.red);
      }
    }

    log(`\n📊 pg_hba.conf: ${passed}/${checks.length} checks passed`, 
        passed === checks.length ? colors.green : colors.yellow);
    
    return passed === checks.length;
  } catch (error) {
    log(`❌ Error reading pg_hba.conf: ${error.message}`, colors.red);
    return false;
  }
}

async function validateEnterpriseSQL() {
  log('\n🔍 Validating enterprise-config.sql...', colors.blue);
  
  try {
    const sqlPath = path.join(process.cwd(), 'infrastructure/postgres/enterprise-config.sql');
    const content = await fs.readFile(sqlPath, 'utf8');

    const checks = [
      { pattern: /CREATE EXTENSION IF NOT EXISTS pg_stat_statements/, name: 'pg_stat_statements extension' },
      { pattern: /CREATE EXTENSION IF NOT EXISTS uuid-ossp/, name: 'UUID extension' },
      { pattern: /CREATE EXTENSION IF NOT EXISTS citext/, name: 'Case-insensitive text extension' },
      { pattern: /CREATE SCHEMA IF NOT EXISTS audit/, name: 'Audit schema created' },
      { pattern: /CREATE SCHEMA IF NOT EXISTS reporting/, name: 'Reporting schema created' },
      { pattern: /CREATE TABLE IF NOT EXISTS audit\.data_changes/, name: 'Audit table created' },
      { pattern: /CREATE OR REPLACE FUNCTION audit\.log_changes/, name: 'Audit trigger function' },
      { pattern: /CREATE OR REPLACE VIEW reporting\.query_performance/, name: 'Query performance view' },
      { pattern: /CREATE ROLE app_read/, name: 'Read-only role created' },
      { pattern: /CREATE ROLE app_write/, name: 'Read-write role created' },
      { pattern: /CREATE ROLE app_admin/, name: 'Admin role created' },
      { pattern: /GRANT app_admin TO enterprise/, name: 'Enterprise user has admin rights' }
    ];

    let passed = 0;
    for (const check of checks) {
      if (check.pattern.test(content)) {
        log(`  ✅ ${check.name}`, colors.green);
        passed++;
      } else {
        log(`  ❌ ${check.name}`, colors.red);
      }
    }

    log(`\n📊 enterprise-config.sql: ${passed}/${checks.length} checks passed`, 
        passed === checks.length ? colors.green : colors.yellow);
    
    return passed === checks.length;
  } catch (error) {
    log(`❌ Error reading enterprise-config.sql: ${error.message}`, colors.red);
    return false;
  }
}

async function validateDockerCompose() {
  log('\n🔍 Validating docker-compose.yml...', colors.blue);
  
  try {
    const composePath = path.join(process.cwd(), 'docker-compose.yml');
    const content = await fs.readFile(composePath, 'utf8');

    const checks = [
      { pattern: /image:\s*postgres:16\.2/, name: 'PostgreSQL 16.2 image' },
      { pattern: /POSTGRES_DB:\s*enterprise_db/, name: 'Enterprise database name' },
      { pattern: /POSTGRES_USER:\s*enterprise/, name: 'Enterprise user configured' },
      { pattern: /POSTGRES_INITDB_ARGS:.*scram-sha-256/, name: 'SCRAM authentication in init' },
      { pattern: /\.\/infrastructure\/postgres\/postgresql\.conf/, name: 'PostgreSQL config mounted' },
      { pattern: /\.\/infrastructure\/postgres\/pg_hba\.conf/, name: 'HBA config mounted' },
      { pattern: /\.\/infrastructure\/postgres\/enterprise-config\.sql/, name: 'Enterprise SQL script mounted' },
      { pattern: /shared_preload_libraries=pg_stat_statements/, name: 'Extensions preloaded' },
      { pattern: /healthcheck:/, name: 'Health check configured' },
      { pattern: /restart:\s*unless-stopped/, name: 'Restart policy set' }
    ];

    let passed = 0;
    for (const check of checks) {
      if (check.pattern.test(content)) {
        log(`  ✅ ${check.name}`, colors.green);
        passed++;
      } else {
        log(`  ❌ ${check.name}`, colors.red);
      }
    }

    log(`\n📊 docker-compose.yml: ${passed}/${checks.length} checks passed`, 
        passed === checks.length ? colors.green : colors.yellow);
    
    return passed === checks.length;
  } catch (error) {
    log(`❌ Error reading docker-compose.yml: ${error.message}`, colors.red);
    return false;
  }
}

async function main() {
  log('🏢 PostgreSQL Enterprise Configuration Validator', colors.blue);
  log('=' .repeat(60), colors.blue);

  const results = await Promise.all([
    validatePostgreSQLConf(),
    validatePgHba(),
    validateEnterpriseSQL(),
    validateDockerCompose()
  ]);

  const totalPassed = results.filter(Boolean).length;
  const totalTests = results.length;

  log('\n' + '='.repeat(60), colors.blue);
  log(`\n🎯 Overall Results: ${totalPassed}/${totalTests} components validated`, 
      totalPassed === totalTests ? colors.green : colors.yellow);

  if (totalPassed === totalTests) {
    log('\n🎉 All PostgreSQL enterprise configurations are valid!', colors.green);
    log('✅ Your database is ready for enterprise deployment.', colors.green);
  } else {
    log('\n⚠️  Some configuration issues were found.', colors.yellow);
    log('🔧 Please review and fix the failed checks above.', colors.yellow);
  }

  process.exit(totalPassed === totalTests ? 0 : 1);
}

main().catch(error => {
  log(`💥 Validation failed: ${error.message}`, colors.red);
  process.exit(1);
});

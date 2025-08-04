-- Enterprise PostgreSQL Initialization Script
-- This script sets up the database for enterprise-level operations

-- Create extensions for monitoring and performance
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS btree_gin;
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS uuid-ossp;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS hstore;
CREATE EXTENSION IF NOT EXISTS ltree;

-- Create database schema
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS reporting;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Create audit table for tracking changes
CREATE TABLE IF NOT EXISTS audit.data_changes (
    id BIGSERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_user TEXT DEFAULT SESSION_USER,
    client_addr INET DEFAULT INET_CLIENT_ADDR()
);

-- Create index for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_table_name ON audit.data_changes(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_changed_at ON audit.data_changes(changed_at);
CREATE INDEX IF NOT EXISTS idx_audit_changed_by ON audit.data_changes(changed_by);

-- Create function for audit triggers
CREATE OR REPLACE FUNCTION audit.log_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit.data_changes (table_name, operation, old_data)
        VALUES (TG_TABLE_NAME, TG_OP, to_jsonb(OLD));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit.data_changes (table_name, operation, old_data, new_data)
        VALUES (TG_TABLE_NAME, TG_OP, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit.data_changes (table_name, operation, new_data)
        VALUES (TG_TABLE_NAME, TG_OP, to_jsonb(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create performance monitoring view
CREATE OR REPLACE VIEW reporting.query_performance AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    stddev_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
ORDER BY mean_time DESC;

-- Create connection monitoring view
CREATE OR REPLACE VIEW reporting.connection_stats AS
SELECT 
    datname as database_name,
    usename as username,
    client_addr,
    state,
    backend_start,
    query_start,
    state_change,
    query
FROM pg_stat_activity
WHERE state IS NOT NULL;

-- Create database size monitoring view
CREATE OR REPLACE VIEW reporting.database_sizes AS
SELECT 
    datname as database_name,
    pg_size_pretty(pg_database_size(datname)) as size,
    pg_database_size(datname) as size_bytes
FROM pg_database
ORDER BY pg_database_size(datname) DESC;

-- Create table size monitoring view
CREATE OR REPLACE VIEW reporting.table_sizes AS
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation,
    most_common_vals,
    most_common_freqs,
    histogram_bounds
FROM pg_stats
ORDER BY schemaname, tablename;

-- Grant permissions for monitoring
GRANT USAGE ON SCHEMA audit TO enterprise;
GRANT USAGE ON SCHEMA reporting TO enterprise;
GRANT USAGE ON SCHEMA analytics TO enterprise;
GRANT SELECT ON ALL TABLES IN SCHEMA reporting TO enterprise;
GRANT SELECT ON audit.data_changes TO enterprise;

-- Create application-specific roles
CREATE ROLE app_read;
CREATE ROLE app_write;
CREATE ROLE app_admin;

-- Grant basic permissions to roles
GRANT CONNECT ON DATABASE enterprise_db TO app_read, app_write, app_admin;
GRANT USAGE ON SCHEMA public TO app_read, app_write, app_admin;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_read;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_write;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_write, app_admin;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO app_read;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_write;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO app_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO app_write, app_admin;

-- Add enterprise user to appropriate roles
GRANT app_admin TO enterprise;

-- Create maintenance procedures
CREATE OR REPLACE FUNCTION analytics.cleanup_old_audit_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit.data_changes 
    WHERE changed_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE 'Deleted % old audit log entries', deleted_count;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create backup validation function
CREATE OR REPLACE FUNCTION analytics.validate_backup_integrity()
RETURNS TABLE(table_name TEXT, row_count BIGINT, last_modified TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::TEXT,
        COALESCE(s.n_tup_ins + s.n_tup_upd + s.n_tup_del, 0) as row_count,
        GREATEST(s.last_vacuum, s.last_autovacuum, s.last_analyze, s.last_autoanalyze) as last_modified
    FROM information_schema.tables t
    LEFT JOIN pg_stat_user_tables s ON t.table_name = s.relname
    WHERE t.table_schema = 'public'
    ORDER BY row_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Log successful initialization
INSERT INTO audit.data_changes (table_name, operation, new_data)
VALUES ('system', 'INIT', '{"message": "Enterprise PostgreSQL configuration completed", "timestamp": "' || NOW() || '"}');

-- Display completion message
DO $$
BEGIN
    RAISE NOTICE 'Enterprise PostgreSQL configuration completed successfully';
    RAISE NOTICE 'Database: %', current_database();
    RAISE NOTICE 'User: %', current_user;
    RAISE NOTICE 'Timestamp: %', NOW();
END $$;

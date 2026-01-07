-- PostgreSQL initialization script for production
-- This script runs when the container starts for the first time

-- Create additional databases if needed
-- CREATE DATABASE avenirbank_test;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- Create indexes for better performance (will be created by TypeORM migrations)
-- These are just examples, actual indexes should be in migrations

-- Performance tuning
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- Reload configuration
SELECT pg_reload_conf();

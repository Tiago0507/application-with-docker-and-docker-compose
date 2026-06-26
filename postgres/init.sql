-- This script runs once when the PostgreSQL container starts for the first time.
-- POSTGRES_DB already creates "devboard"; we only need to add "devboard_metrics".

\c postgres

SELECT 'CREATE DATABASE devboard_metrics OWNER devboard'
WHERE NOT EXISTS (
    SELECT FROM pg_database WHERE datname = 'devboard_metrics'
)\gexec

-- Grant all privileges on both databases to the app user
GRANT ALL PRIVILEGES ON DATABASE devboard         TO devboard;
GRANT ALL PRIVILEGES ON DATABASE devboard_metrics TO devboard;

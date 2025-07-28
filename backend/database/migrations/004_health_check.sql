-- =====================================================
-- HEALTH CHECK TABLE
-- A simple, publicly-readable table for health checks
-- =====================================================

CREATE TABLE health_check (
    id INT PRIMARY KEY,
    status VARCHAR(50) NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert a default record
INSERT INTO health_check (id, status) VALUES (1, 'ok');

-- Enable RLS
ALTER TABLE health_check ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public can read health check"
ON health_check FOR SELECT
TO public
USING (true); 
-- Migration: Add produto_id column to links_uteis table
-- This allows associating links with specific products for the public Produtos page

ALTER TABLE public.links_uteis ADD COLUMN IF NOT EXISTS produto_id TEXT;

-- Allow public (unauthenticated) read access to links for the public Produtos page
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Acesso público a links' AND polrelid = 'public.links_uteis'::regclass) THEN
        CREATE POLICY "Acesso público a links" ON public.links_uteis FOR SELECT USING (true);
    END IF;
END $$;

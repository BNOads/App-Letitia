-- Migration: Add collab_plataformas column to conteudo_pautas
-- This enables a post to appear under multiple profile filters (collaboration feature)

ALTER TABLE conteudo_pautas 
ADD COLUMN IF NOT EXISTS collab_plataformas TEXT[] DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN conteudo_pautas.collab_plataformas IS 'Array of secondary profile names for collaborative posts. When set, the post appears under both the main plataforma filter and these additional profiles.';

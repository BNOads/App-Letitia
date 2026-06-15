-- Correção: Todas as políticas "Equipe acesso total" tinham apenas USING (cobre SELECT/DELETE)
-- mas faltava WITH CHECK (necessário para INSERT/UPDATE).
-- Isso impedia criação e edição de conteúdos, tarefas, tickets, etc.

DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'tarefas', 'vendas', 'conteudo_pautas', 'theway_aplicacoes', 
            'tickets', 'contatos', 'pastas', 'documentos', 'eventos', 
            'links_uteis', 'ticket_comments', 'senhas', 'perfis_sociais'
        )
    LOOP
        -- Remove a política antiga sem WITH CHECK
        EXECUTE format('DROP POLICY IF EXISTS "Equipe acesso total" ON public.%I', t);
        
        -- Recria com USING + WITH CHECK para permitir INSERT/UPDATE
        EXECUTE format(
            'CREATE POLICY "Equipe acesso total" ON public.%I FOR ALL USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')', 
            t
        );
    END LOOP;
END $$;

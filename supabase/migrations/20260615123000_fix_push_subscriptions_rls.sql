-- Correção: A política RLS para push_subscriptions não tinha WITH CHECK,
-- o que impedia INSERT e UPDATE (causando erro 403).

-- Remove a política antiga que só tinha USING
DROP POLICY IF EXISTS "Usuários gerenciam suas próprias assinaturas" ON public.push_subscriptions;

-- Recria com USING (para SELECT/DELETE) e WITH CHECK (para INSERT/UPDATE)
CREATE POLICY "Usuários gerenciam suas próprias assinaturas"
  ON public.push_subscriptions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

CREATE POLICY "Users can update their own created tasks" ON public.tarefas FOR UPDATE USING (auth.uid() = created_by);

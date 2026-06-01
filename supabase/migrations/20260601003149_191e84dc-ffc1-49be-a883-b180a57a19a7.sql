
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS estado text,
  ADD COLUMN IF NOT EXISTS idade integer;

DROP POLICY IF EXISTS "users update own profile safe fields" ON public.profiles;
CREATE POLICY "users update own profile safe fields"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND plan = (SELECT p.plan FROM public.profiles p WHERE p.id = auth.uid())
  AND plan_vitalicio = (SELECT p.plan_vitalicio FROM public.profiles p WHERE p.id = auth.uid())
  AND NOT (plan_expires_at IS DISTINCT FROM (SELECT p.plan_expires_at FROM public.profiles p WHERE p.id = auth.uid()))
);

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
CREATE POLICY "avatars public read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars user upload" ON storage.objects;
CREATE POLICY "avatars user upload" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "avatars user update" ON storage.objects;
CREATE POLICY "avatars user update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "avatars user delete" ON storage.objects;
CREATE POLICY "avatars user delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP FUNCTION IF EXISTS public.get_ranking_global();
CREATE OR REPLACE FUNCTION public.get_ranking_global()
RETURNS TABLE(user_id uuid, nome text, melhor_nota integer, total_redacoes bigint, avatar_url text, estado text, idade integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT
    r.user_id,
    COALESCE(split_part(p.full_name, ' ', 1), 'Aluno') AS nome,
    MAX(r.nota_total) AS melhor_nota,
    COUNT(*) AS total_redacoes,
    p.avatar_url,
    p.estado,
    p.idade
  FROM public.redacoes r
  LEFT JOIN public.profiles p ON p.id = r.user_id
  WHERE r.nota_total IS NOT NULL
  GROUP BY r.user_id, p.full_name, p.avatar_url, p.estado, p.idade
  ORDER BY MAX(r.nota_total) DESC NULLS LAST
  LIMIT 100;
$function$;

CREATE POLICY "premium pdfs paid plan select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'premium-pdfs'
  AND public.user_plan_tier(auth.uid()) IN ('light','pro','full','vitalicio')
);
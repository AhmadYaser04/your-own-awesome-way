CREATE POLICY "Users delete own pending requests"
ON public.equivalency_requests
FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending');
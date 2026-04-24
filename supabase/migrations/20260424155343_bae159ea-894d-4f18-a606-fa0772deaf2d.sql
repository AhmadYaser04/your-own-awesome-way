ALTER TABLE public.equivalency_requests
ADD COLUMN IF NOT EXISTS reviewer_name TEXT;
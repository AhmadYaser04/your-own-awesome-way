ALTER TABLE public.equivalency_requests DROP CONSTRAINT IF EXISTS equivalency_requests_student_type_check;

ALTER TABLE public.equivalency_requests
  ADD CONSTRAINT equivalency_requests_student_type_check
  CHECK (student_type = ANY (ARRAY['same_major','different_major','diploma','non_enrolled']));

ALTER TABLE public.equivalency_requests DROP CONSTRAINT IF EXISTS equivalency_requests_transfer_type_check;
ALTER TABLE public.equivalency_requests
  ADD CONSTRAINT equivalency_requests_transfer_type_check
  CHECK (transfer_type IS NULL OR transfer_type = ANY (ARRAY['same_major','different_major','diploma','non_enrolled']));
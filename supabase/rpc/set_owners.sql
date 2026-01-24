-- Set function owners to a trusted role (postgres)
-- Run this after deploying functions to ensure SECURITY DEFINER functions run under admin role

ALTER FUNCTION public.book_session(uuid, uuid) OWNER TO postgres;
ALTER FUNCTION public.approve_swap(uuid, uuid) OWNER TO postgres;

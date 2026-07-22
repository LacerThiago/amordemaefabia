drop policy if exists "Service role can manage roles" on public.user_roles;

revoke execute on function public.has_role(uuid, public.app_role) from public;
revoke execute on function public.has_role(uuid, public.app_role) from anon;

grant execute on function public.has_role(uuid, public.app_role) to authenticated;

-- Ensure service role can still manage user_roles directly via grants
grant all on public.user_roles to service_role;
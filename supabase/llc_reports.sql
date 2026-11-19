-- Ejecutar este archivo completo en Supabase > SQL Editor.
-- La tabla no expone datos a clientes; solo la service_role de Cloudflare accede.

create table if not exists public.llc_reports (
  id uuid primary key default gen_random_uuid(),
  client_email text not null unique,
  client_name text,
  answers jsonb,
  report_model jsonb,
  completed_at timestamptz,
  completed_by text,
  pending_client_name text,
  pending_answers jsonb,
  pending_report_model jsonb,
  pending_token uuid,
  pending_updated_at timestamptz,
  pending_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint llc_reports_email_normalized
    check (
      client_email = lower(btrim(client_email))
      and client_email <> ''
      and length(client_email) <= 254
    ),
  constraint llc_reports_answers_object
    check (answers is null or jsonb_typeof(answers) = 'object'),
  constraint llc_reports_model_object
    check (report_model is null or jsonb_typeof(report_model) = 'object'),
  constraint llc_reports_pending_answers_object
    check (pending_answers is null or jsonb_typeof(pending_answers) = 'object'),
  constraint llc_reports_pending_model_object
    check (
      pending_report_model is null
      or jsonb_typeof(pending_report_model) = 'object'
    )
);

create index if not exists llc_reports_updated_at_idx
  on public.llc_reports (updated_at desc);

alter table public.llc_reports enable row level security;
revoke all on table public.llc_reports from anon, authenticated;
grant all on table public.llc_reports to service_role;

create or replace function public.save_llc_report_draft(
  p_client_email text,
  p_client_name text,
  p_answers jsonb,
  p_report_model jsonb,
  p_admin_email text
)
returns setof public.llc_reports
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_email text := lower(btrim(p_client_email));
begin
  if normalized_email is null
    or normalized_email = ''
    or p_client_name is null
    or btrim(p_client_name) = ''
    or p_answers is null
    or jsonb_typeof(p_answers) <> 'object'
    or p_report_model is null
    or jsonb_typeof(p_report_model) <> 'object'
    or p_admin_email is null
    or btrim(p_admin_email) = ''
  then
    raise exception 'Invalid report draft';
  end if;

  return query
  insert into public.llc_reports (
    client_email,
    pending_client_name,
    pending_answers,
    pending_report_model,
    pending_token,
    pending_updated_at,
    pending_by,
    updated_at
  )
  values (
    normalized_email,
    btrim(p_client_name),
    p_answers,
    p_report_model,
    gen_random_uuid(),
    now(),
    lower(btrim(p_admin_email)),
    now()
  )
  on conflict (client_email) do update
  set pending_client_name = excluded.pending_client_name,
      pending_answers = excluded.pending_answers,
      pending_report_model = excluded.pending_report_model,
      pending_token = excluded.pending_token,
      pending_updated_at = excluded.pending_updated_at,
      pending_by = excluded.pending_by,
      updated_at = now()
  returning public.llc_reports.*;
end;
$$;

create or replace function public.complete_llc_report(
  p_report_id uuid,
  p_pending_token uuid,
  p_admin_email text
)
returns setof public.llc_reports
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  update public.llc_reports
  set client_name = pending_client_name,
      answers = pending_answers,
      report_model = pending_report_model,
      completed_at = now(),
      completed_by = lower(btrim(p_admin_email)),
      pending_client_name = null,
      pending_answers = null,
      pending_report_model = null,
      pending_token = null,
      pending_updated_at = null,
      pending_by = null,
      updated_at = now()
  where id = p_report_id
    and pending_token = p_pending_token
    and pending_answers is not null
    and pending_report_model is not null
  returning public.llc_reports.*;
end;
$$;

revoke all on function public.save_llc_report_draft(
  text, text, jsonb, jsonb, text
) from public, anon, authenticated;
revoke all on function public.complete_llc_report(
  uuid, uuid, text
) from public, anon, authenticated;
grant execute on function public.save_llc_report_draft(
  text, text, jsonb, jsonb, text
) to service_role;
grant execute on function public.complete_llc_report(
  uuid, uuid, text
) to service_role;

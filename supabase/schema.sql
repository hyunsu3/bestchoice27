create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  university_name text not null,
  department text not null,
  admission_type text not null default '',
  capacity text not null default '',
  admission_summary text not null default '',
  result_summary text not null default '',
  created_at timestamptz not null default now(),
  view_count integer not null default 0
);

alter table cards enable row level security;

create or replace function increment_card_view(card_id uuid)
returns integer
language sql
as $$
  update cards set view_count = view_count + 1 where id = card_id returning view_count;
$$;

create table if not exists university_colors (
  university_name text primary key,
  color text not null,
  updated_at timestamptz not null default now()
);

alter table university_colors enable row level security;

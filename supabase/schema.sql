create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  university_name text not null,
  department text not null,
  admission_type text not null default '',
  capacity text not null default '',
  admission_summary text not null default '',
  result_summary text not null default '',
  created_at timestamptz not null default now()
);

alter table cards enable row level security;

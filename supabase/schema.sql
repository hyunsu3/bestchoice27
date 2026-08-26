create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  university_name text not null,
  department text not null,
  admission_type text not null default '',
  capacity text not null default '',
  min_requirement text not null default '',
  admission_summary text not null default '',
  result_summary text not null default '',
  created_at timestamptz not null default now(),
  view_count integer not null default 0,
  is_favorite boolean not null default false,
  pick_tier text not null default 'none'
);

alter table cards add column if not exists is_favorite boolean not null default false;
alter table cards add column if not exists min_requirement text not null default '';
-- 즐겨찾기(on/off)를 상향/적정/안정 3단계 + 해제로 대체. 기존에 즐겨찾기로
-- 표시해둔 카드는 정보 손실 없이 '적정'으로 옮겨서 계속 선택된 상태로 둔다.
alter table cards add column if not exists pick_tier text not null default 'none';
update cards set pick_tier = 'target' where is_favorite and pick_tier = 'none';

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

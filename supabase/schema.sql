create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  university_name text not null,
  department text not null,
  admission_type text not null default '',
  capacity text not null default '',
  min_requirement text not null default '',
  interview_date text not null default '',
  result_announcement_date text not null default '',
  admission_summary text not null default '',
  result_summary text not null default '',
  department_link text not null default '',
  created_at timestamptz not null default now(),
  view_count integer not null default 0,
  is_favorite boolean not null default false,
  pick_tier text not null default 'none',
  pick_rank double precision not null default 0,
  marked boolean not null default false
);

alter table cards add column if not exists is_favorite boolean not null default false;
alter table cards add column if not exists min_requirement text not null default '';
alter table cards add column if not exists department_link text not null default '';
alter table cards add column if not exists interview_date text not null default '';
alter table cards add column if not exists result_announcement_date text not null default '';
-- 카드 리스트 화면에서 모서리 아이콘으로 켜고 끄는 테두리 표시 여부.
alter table cards add column if not exists marked boolean not null default false;
-- 즐겨찾기(on/off)를 상향/적정/안정 3단계 + 해제로 대체. 기존에 즐겨찾기로
-- 표시해둔 카드는 정보 손실 없이 '적정'으로 옮겨서 계속 선택된 상태로 둔다.
alter table cards add column if not exists pick_tier text not null default 'none';
update cards set pick_tier = 'target' where is_favorite and pick_tier = 'none';
-- 선택등급순 보기에서 같은 등급 안 카드를 좌우 화살표로 직접 줄세우는 우선순위
-- 값. 모든 카드는 0에서 시작하고, 앞으로 보내면 +1, 뒤로 보내면 -1씩 바뀐다.
alter table cards add column if not exists pick_rank double precision not null default 0;
update cards set pick_rank = 0;
-- 완전 삭제 대신 보류(held) 처리: 목록 맨 뒤로 보내고 흐리게 표시한다.
alter table cards add column if not exists held boolean not null default false;
-- 지원완료 여부: 선택(marked)과 별개로 카드 테두리를 초록색으로 표시한다.
alter table cards add column if not exists applied boolean not null default false;

-- 연도별 경쟁률(최종 경쟁률 등, "12.3:1" 같은 자유 형식 텍스트)과 원서 접수
-- 마감 일시. 마감일은 D-day 계산을 위해 date/time 입력값을 그대로 저장한다.
-- 원서 접수 기간(자유 텍스트, 예: "9/7 10시~ 9/11 18시"). 카드리스트 앞면에
-- 면접일 아래 노란색으로 노출된다.
alter table cards add column if not exists application_period text not null default '';
alter table cards add column if not exists ratio_2026 text not null default '';
alter table cards add column if not exists ratio_2025 text not null default '';
alter table cards add column if not exists ratio_2024 text not null default '';
alter table cards add column if not exists apply_deadline_date text not null default '';
alter table cards add column if not exists apply_deadline_time text not null default '';

alter table cards enable row level security;

-- 지원현황 추이 기록: 카드(학과)별로 특정 일시에 확인한 누적 지원자 수를
-- 쌓아두고, 모집인원과 함께 경쟁률 추이 그래프를 그리는 데 쓴다.
create table if not exists application_stats (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references cards(id) on delete cascade,
  recorded_at timestamptz not null,
  applicant_count integer not null,
  created_at timestamptz not null default now()
);

create index if not exists application_stats_card_id_idx
  on application_stats(card_id, recorded_at);

alter table application_stats enable row level security;

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

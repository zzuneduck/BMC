-- profiles 테이블
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  nickname text,
  avatar_url text,
  blog_url text,
  kakao_id text,
  role text default 'user',
  created_at timestamptz default now()
);

-- RLS 활성화
alter table profiles enable row level security;

-- 본인 프로필 읽기
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

-- 본인 프로필 수정
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

-- 신규 유저 자동 프로필 생성 (insert는 트리거로)
create policy "profiles_insert_self" on profiles
  for insert with check (auth.uid() = id);

-- 자동 프로필 생성 트리거
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, nickname, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- 기존 트리거 제거 후 재생성
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

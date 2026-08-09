-- MyWealth — custom monthly cycle start day + weekly start day
-- Jalankan sekali di Supabase SQL Editor.

alter table families add column if not exists month_start_day smallint not null default 1 check (month_start_day between 1 and 28);
alter table families add column if not exists week_start_day smallint not null default 1 check (week_start_day between 0 and 6);
-- week_start_day: 0=Sunday, 1=Monday, ... 6=Saturday

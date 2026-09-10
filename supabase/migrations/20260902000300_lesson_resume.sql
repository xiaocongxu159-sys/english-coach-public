alter table public.lesson_instances
  add column if not exists resolution_key text,
  add column if not exists revision bigint not null default 0 check (revision >= 0);

create unique index if not exists lesson_instances_one_live_resolution_idx
  on public.lesson_instances (user_id, resolution_key)
  where resolution_key is not null and status <> 'abandoned';

create index if not exists lesson_instances_user_resolution_idx
  on public.lesson_instances (user_id, resolution_key);

comment on column public.lesson_instances.resolution_key is
  'Server-owned stable Daily Plan request key used to resume/reuse one non-abandoned Lesson Instance.';

comment on column public.lesson_instances.revision is
  'Server-owned optimistic concurrency revision for monotonic stage checkpoint updates.';
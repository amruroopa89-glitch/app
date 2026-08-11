-- Create government_schemes table
create table if not exists public.government_schemes (
  id          uuid primary key default gen_random_uuid(),
  title       text not null unique,
  body        text not null,
  created_at  timestamptz not null default now()
);

-- Enable RLS
alter table public.government_schemes enable row level security;

-- Authenticated users can read
create policy "Authenticated can read government schemes"
  on public.government_schemes for select
  to authenticated
  using (true);

-- Grant permissions
grant select on public.government_schemes to authenticated;
grant all on public.government_schemes to service_role;

-- Seed data
insert into public.government_schemes (title, body) values
  ('PM-KISAN', '₹6,000/year direct benefit to farmer accounts.'),
  ('PMFBY', 'Crop insurance against natural calamities.'),
  ('KCC', 'Kisan Credit Card up to ₹3 lakh at 4% interest.')
on conflict (title) do update set body = excluded.body;

-- Create mandi_prices table
create table if not exists public.mandi_prices (
  id          uuid primary key default gen_random_uuid(),
  crop        text not null,
  price_inr   integer not null,    -- price per quintal in ₹
  unit        text not null default 'quintal',
  change_pct  numeric(5,2) not null default 0,  -- e.g. 8.50 means +8.50%
  state       text,                -- null = national average
  updated_at  timestamptz not null default now()
);

-- Enable RLS
alter table public.mandi_prices enable row level security;

-- Authenticated users can read
create policy "Authenticated can read mandi prices"
  on public.mandi_prices for select
  to authenticated
  using (true);

-- Seed data (Kharif 2025 indicative rates)
insert into public.mandi_prices (crop, price_inr, unit, change_pct, state) values
  ('Groundnut',   6400, 'quintal',  8.50, 'Andhra Pradesh'),
  ('Cotton',      7100, 'quintal',  2.10, 'Andhra Pradesh'),
  ('Maize',       2150, 'quintal', -1.20, 'Andhra Pradesh'),
  ('Paddy',       2300, 'quintal',  3.40, null),
  ('Soybean',     4200, 'quintal',  5.80, null),
  ('Turmeric',   14500, 'quintal', 12.30, 'Telangana'),
  ('Onion',       1800, 'quintal', -4.50, 'Maharashtra'),
  ('Tomato',      1200, 'quintal', 22.00, 'Karnataka'),
  ('Chilli',      8900, 'quintal',  6.70, 'Andhra Pradesh'),
  ('Sugarcane',    340, 'quintal',  1.50, null)
on conflict do nothing;

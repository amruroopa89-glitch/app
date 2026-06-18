-- Create crop_alerts table
create table if not exists public.crop_alerts (
  id          uuid primary key default gen_random_uuid(),
  icon        text not null default '📢',
  title       text not null,
  body        text not null,
  state       text,           -- null = all-India alert
  created_at  timestamptz not null default now()
);

-- Enable RLS
alter table public.crop_alerts enable row level security;

-- Authenticated users can read all alerts
create policy "Authenticated can read alerts"
  on public.crop_alerts for select
  to authenticated
  using (true);

-- Seed data: national + common state alerts
insert into public.crop_alerts (icon, title, body, state) values
  ('🌧️', 'IMD Monsoon Alert', 'Above-normal rainfall expected this Kharif season. Ensure field drainage channels are clear.', null),
  ('🐛', 'Pest Alert: Fall Armyworm', 'FAW sightings reported in maize fields. Apply Emamectin Benzoate 5% SG @ 220 ml/acre.', null),
  ('💰', 'PM-KISAN Instalment', 'Next PM-KISAN instalment of ₹2,000 expected in July. Ensure Aadhaar-linked bank account is active.', null),
  ('🌡️', 'Heat Stress Warning', 'Temperatures above 38°C forecast for next 3 days. Irrigate in early morning or evening.', null),
  ('🐛', 'Pink Bollworm Alert', 'Pink bollworm activity reported in cotton-growing belts. Monitor pheromone traps weekly.', 'Andhra Pradesh'),
  ('💧', 'Drought Advisory', 'Low reservoir levels. Shift to drip irrigation and short-duration varieties where possible.', 'Andhra Pradesh'),
  ('🌾', 'Paddy Procurement Open', 'MSP paddy procurement centres now open. Carry land records and Aadhaar for registration.', 'Telangana'),
  ('🐛', 'Leaf Miner in Tomato', 'Leaf miner infestation reported. Apply Cyantraniliprole 10.26% OD @ 300 ml/acre.', 'Karnataka'),
  ('🌱', 'Soil Health Card Camps', 'Free soil testing camps this month. Collect Soil Health Card from your nearest KVK.', null),
  ('💸', 'Fertilizer Subsidy Update', 'DAP subsidy rate revised to ₹1,350/bag under NBS scheme for Kharif 2025.', null)
on conflict do nothing;

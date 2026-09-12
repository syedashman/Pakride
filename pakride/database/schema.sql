-- ============================================
--   PakRide Database Schema
--   Run this in Supabase SQL Editor
-- ============================================

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  email varchar(150) unique not null,
  password varchar(255) not null,
  phone varchar(20),
  role varchar(10) default 'rider' check (role in ('rider', 'driver', 'both')),
  rating decimal(2,1) default 5.0,
  cnic_verified boolean default false,
  created_at timestamp default now()
);

create table if not exists rides (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid references users(id) on delete cascade,
  pickup_address text,
  drop_address text,
  pickup_lat decimal(10,7) not null,
  pickup_lng decimal(10,7) not null,
  drop_lat decimal(10,7) not null,
  drop_lng decimal(10,7) not null,
  seats_available integer default 3,
  seats_booked integer default 0,
  departure_time timestamp,
  cost_pkr integer default 0,
  distance_km decimal(6,2),
  status varchar(20) default 'open' check (status in ('open', 'full', 'in_progress', 'completed', 'cancelled')),
  created_at timestamp default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid references rides(id) on delete cascade,
  rider_id uuid references users(id) on delete cascade,
  status varchar(20) default 'confirmed' check (status in ('confirmed', 'cancelled', 'completed')),
  created_at timestamp default now(),
  unique(ride_id, rider_id)
);

create table if not exists ratings (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid references rides(id) on delete cascade,
  given_by uuid references users(id) on delete cascade,
  ratee_id uuid references users(id) on delete cascade,
  score integer check (score >= 1 and score <= 5),
  comment text,
  created_at timestamp default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  type varchar(50),
  message text,
  is_read boolean default false,
  sent_at timestamp default now()
);

-- Sample data for testing
insert into users (name, email, password, phone, role, rating, cnic_verified) values
  ('Ali Hassan', 'ali@test.com', '$2a$10$example_hashed_password', '0300-1234567', 'driver', 4.8, true),
  ('Sara Ahmed', 'sara@test.com', '$2a$10$example_hashed_password', '0311-9876543', 'rider', 4.5, false);

-- Note: Use the /api/auth/register endpoint to create real users with hashed passwords

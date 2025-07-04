-- ===============================
-- CIRCUIT TRANSFERS SCHEMA (FINAL VERSION WITH CALCULATION NOTES)
-- ===============================

create table public.circuit_transfers (
  id uuid not null default gen_random_uuid(), -- read-only (auto-generated)

  event_id uuid null references public.events (id) on delete cascade, -- form input (dropdown: events)
  hotel_id uuid null references public.gpgt_hotels (id) on delete cascade, -- form input (dropdown: hotels)

  transfer_type text not null check (transfer_type in ('coach', 'mpv')), -- form input (dropdown: coach/mpv)

  used integer null default 0, -- form input (number of seats booked)
  coach_capacity integer not null, -- form input
  days integer not null, -- form input

  quote_hours integer null, -- form input
  expected_hours integer null, -- form input

  supplier text null, -- form input

  coach_cost_per_day_local numeric(10, 2) null, -- form input
  coach_cost_per_hour_local numeric(10, 2) null, -- form input (optional override)

  coach_extra_cost_per_hour_local numeric(10, 2) null, -- calculated in frontend: coach_cost_per_day_local / quote_hours

  coach_vat numeric(5, 2) null, -- form input (percentage, e.g. 20 = 20%)
  parking_ticket_per_coach_per_day numeric(10, 2) null, -- form input
  supplier_currency text null default 'EUR', -- form input (dropdown)

  guide_included boolean null default true, -- form input (toggle)
  guide_cost_per_day numeric(10, 2) null, -- form input
  guide_cost_per_hour_local numeric(10, 2) null, -- form input (optional override)

  guide_extra_cost_per_hour_local numeric(10, 2) null, -- calculated in frontend: guide_cost_per_day / quote_hours

  guide_vat numeric(5, 2) null, -- form input (percentage)

  markup_percent numeric(5, 2) null default 0.00, -- form input (percentage)

  coaches_required integer generated always as (
    ceil(used::numeric / coach_capacity)
  ) stored, -- read-only (auto-calculated)

  coach_cost_local numeric null, -- read-only (calculated in frontend)
  guide_cost_local numeric null, -- read-only (calculated in frontend)

  utilisation_percent numeric(5, 2) null default 100, -- form input
  utilisation_cost_per_seat_local numeric null, -- read-only (calculated in frontend)

  coach_cost_gbp numeric null, -- read-only (calculated in frontend)
  guide_cost_gbp numeric null, -- read-only (calculated in frontend)

  utilisation_cost_per_seat_gbp numeric null, -- read-only (calculated in frontend)
  sell_price_per_seat_gbp numeric null, -- read-only (calculated in frontend)

  active boolean null default true, -- form input (toggle)
  notes text null, -- form input (optional)

  created_at timestamp without time zone null default now(), -- read-only
  updated_at timestamp without time zone null default now() -- read-only
);

-- ===============================
-- ➤ CALCULATIONS TO PERFORM IN FRONTEND / API:
-- ===============================

-- ➤ Calculate coach_extra_cost_per_hour_local:
-- coach_extra_cost_per_hour_local = coach_cost_per_day_local / quote_hours

-- ➤ Calculate guide_extra_cost_per_hour_local:
-- guide_extra_cost_per_hour_local = guide_cost_per_day / quote_hours

-- ➤ Calculate coach_cost_local (per coach):
-- coach_cost_local = (
--   (coach_cost_per_day_local * days) +
--   (coach_extra_cost_per_hour_local * (expected_hours - quote_hours) * days) +
--   (parking_ticket_per_coach_per_day * days * coaches_required)
-- ) * (1 + coach_vat / 100)

-- ➤ Calculate guide_cost_local (per coach):
-- IF guide_included THEN:
--   guide_cost_local = (
--     (guide_cost_per_day * days) +
--     (guide_extra_cost_per_hour_local * (expected_hours - quote_hours) * days)
--   ) * (1 + guide_vat / 100)
-- ELSE:
--   guide_cost_local = 0

-- ➤ Calculate utilisation_cost_per_seat_local:
-- utilisation_cost_per_seat_local = (coach_cost_local + guide_cost_local) / (coach_capacity * (utilisation_percent / 100))

-- ➤ Currency conversion to GBP (exchange rate provided by your API):
-- coach_cost_gbp = coach_cost_local * exchange_rate
-- guide_cost_gbp = guide_cost_local * exchange_rate

-- ➤ Calculate utilisation_cost_per_seat_gbp:
-- utilisation_cost_per_seat_gbp = (coach_cost_gbp + guide_cost_gbp) / (coach_capacity * (utilisation_percent / 100))

-- ➤ Apply markup to get sell_price_per_seat_gbp:
-- sell_price_per_seat_gbp = utilisation_cost_per_seat_gbp * (1 + markup_percent / 100)

-- ===============================

-- ===============================
-- CIRCUIT TRANSFERS SCHEMA (VAT INCLUDED)
-- ===============================

create table public.circuit_transfers (
  id uuid not null default gen_random_uuid(),
  event_id uuid null references public.events (id) on delete cascade,
  hotel_id uuid null references public.gpgt_hotels (id) on delete cascade,
  circuit_transfer_id uuid null,

  transfer_type text not null check (transfer_type in ('coach', 'mpv')),

  used integer null default 0,
  coach_capacity integer not null,
  coaches_required integer not null,
  days integer not null,

  quote_hours integer null,
  expected_hours integer null,

  provider_coach text null,
  cost_per_day_invoice_ccy numeric(10, 2) null,
  cost_per_extra_hour_per_coach_per_day numeric(10, 2) null,
  vat_tax_if_not_included_in_price numeric(5, 2) null,
  parking_ticket_per_coach_per_day numeric(10, 2) null,
  currency text null default 'EUR',

  guide_included_in_coach_cost boolean null default true,
  guide_cost_per_day numeric(10, 2) null,
  cost_per_extra_hour_per_guide_per_day numeric(10, 2) null,
  vat_tax_if_not_included_in_guide_price numeric(5, 2) null,

  coach_cost_local numeric(10, 2) null,
  coach_cost_gbp numeric(10, 2) null,

  guide_cost_local numeric(10, 2) null,
  guide_cost_gbp numeric(10, 2) null,

  provider_guides text null,

  utilisation_percent numeric(5, 2) null default 100,
  utilisation_cost_per_seat_local numeric(10, 2) null,
  utilisation_cost_per_seat_gbp numeric(10, 2) null,

  markup_percent numeric(5, 2) null default 0.00,

  sell_price_per_seat_gbp numeric(10, 2) null,

  active boolean null default true,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),

  constraint circuit_transfers_pkey primary key (id)
);
create table public.hotel_rooms (
  id uuid not null default gen_random_uuid (),
  hotel_id uuid not null,
  room_type_id text not null,
  event_id uuid null,
  check_in date not null,
  check_out date not null,
  quantity_total integer not null,
  quantity_reserved integer null default 0,
  quantity_provisional integer null default 0,
  quantity_available integer GENERATED ALWAYS as (
    (
      (quantity_total - quantity_reserved) - quantity_provisional
    )
  ) STORED null,
  supplier_price_per_night numeric(10, 2) null,
  supplier_currency text null default 'EUR'::text,
  markup_percent numeric(5, 2) null default 0.00,
  price_per_night_gbp numeric GENERATED ALWAYS as (
    (
      supplier_price_per_night + (
        (supplier_price_per_night * markup_percent) / (100)::numeric
      )
    )
  ) STORED null,
  vat_percentage numeric(5, 2) null,
  price_per_night_gbp_incl_vat numeric GENERATED ALWAYS as (
    (
      (
        supplier_price_per_night + (
          (supplier_price_per_night * markup_percent) / (100)::numeric
        )
      ) + (
        (
          (
            supplier_price_per_night + (
              (supplier_price_per_night * markup_percent) / (100)::numeric
            )
          ) * COALESCE(vat_percentage, (0)::numeric)
        ) / (100)::numeric
      )
    )
  ) STORED null,
  resort_fee numeric(10, 2) null,
  resort_fee_type text null default 'per_night'::text,
  city_tax numeric(10, 2) null,
  city_tax_type text null default 'per_person_per_night'::text,
  total_stay_price_gbp_incl_vat numeric GENERATED ALWAYS as (
    (
      (
        (
          supplier_price_per_night + (
            (supplier_price_per_night * markup_percent) / (100)::numeric
          )
        ) + (
          (
            (
              supplier_price_per_night + (
                (supplier_price_per_night * markup_percent) / (100)::numeric
              )
            ) * COALESCE(vat_percentage, (0)::numeric)
          ) / (100)::numeric
        )
      ) * ((check_out - check_in))::numeric
    )
  ) STORED null,
  breakfast_included boolean null default true,
  extra_night_markup_percent numeric(5, 2) null,
  contracted boolean null default false,
  attrition_deadline date null,
  release_allowed_percent numeric(5, 2) null,
  penalty_terms text null,
  supplier text null,
  supplier_ref text null,
  contract_file_path text null,
  active boolean null default true,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint hotel_rooms_pkey primary key (id),
  constraint hotel_rooms_event_id_fkey foreign KEY (event_id) references events (id),
  constraint hotel_rooms_hotel_id_fkey foreign KEY (hotel_id) references gpgt_hotels (id) on delete CASCADE
) TABLESPACE pg_default;
create table public.events (
  id uuid not null default gen_random_uuid (),
  sport_id uuid null,
  name text not null,
  location text null,
  start_date date null,
  end_date date null,
  venue_id uuid null,
  constraint events_pkey primary key (id),
  constraint events_sport_id_fkey foreign KEY (sport_id) references sports (id) on delete CASCADE,
  constraint events_venue_id_fkey foreign KEY (venue_id) references venues (id) on delete set null
) TABLESPACE pg_default;
create table public.airport_transfers (
  id uuid not null default gen_random_uuid (),
  event_id uuid null,
  hotel_id uuid null,
  airport_id uuid null,
  transfer_type text not null,
  vehicle_type text not null,
  vehicle_name text null,
  max_capacity integer null,
  pickup_window_start time without time zone null,
  pickup_window_end time without time zone null,
  cost numeric(10, 2) not null,
  markup_percent numeric(5, 2) null default 0.00,
  currency text null default 'EUR'::text,
  client_price numeric GENERATED ALWAYS as (
    (cost + ((cost * markup_percent) / (100)::numeric))
  ) STORED (10, 2) null,
  total_vehicles integer null default 1,
  vehicles_reserved integer null default 0,
  vehicles_provisional integer null default 0,
  vehicles_available integer GENERATED ALWAYS as (
    (
      (total_vehicles - vehicles_reserved) - vehicles_provisional
    )
  ) STORED null,
  supplier text null,
  supplier_ref text null,
  notes text null,
  active boolean null default true,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint airport_transfers_pkey primary key (id),
  constraint airport_transfers_event_id_fkey foreign KEY (event_id) references events (id) on delete CASCADE,
  constraint airport_transfers_hotel_id_fkey foreign KEY (hotel_id) references gpgt_hotels (id),
  constraint airport_transfers_max_capacity_check check ((max_capacity > 0)),
  constraint airport_transfers_transfer_type_check check (
    (
      transfer_type = any (
        array[
          'arrival'::text,
          'departure'::text,
          'return'::text
        ]
      )
    )
  ),
  constraint airport_transfers_vehicle_type_check check (
    (
      vehicle_type = any (
        array[
          'private car'::text,
          'mpv'::text,
          'luxury'::text,
          'chauffeur'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;
create table public.package_components (
  id uuid not null default gen_random_uuid (),
  tier_id uuid not null,
  event_id uuid not null,
  component_type text not null,
  component_id uuid not null,
  default_quantity integer null default 1,
  price_override numeric(10, 2) null,
  notes text null,
  constraint package_components_pkey primary key (id),
  constraint package_components_event_id_fkey foreign KEY (event_id) references events (id) on delete CASCADE,
  constraint package_components_tier_id_fkey foreign KEY (tier_id) references package_tiers (id) on delete CASCADE,
  constraint package_components_component_type_check check (
    (
      component_type = any (
        array[
          'ticket'::text,
          'hotel_room'::text,
          'circuit_transfer'::text,
          'airport_transfer'::text,
          'flight'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;
create table public.package_tiers (
  id uuid not null default gen_random_uuid (),
  package_id uuid null,
  name text not null,
  description text null,
  price_override numeric(10, 2) null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  short_label text null,
  display_order integer null,
  constraint package_tiers_pkey primary key (id),
  constraint package_tiers_package_id_fkey foreign KEY (package_id) references packages (id) on delete CASCADE
) TABLESPACE pg_default;
create table public.packages (
  id uuid not null default gen_random_uuid (),
  event_id uuid null,
  name text not null,
  slug text null,
  description text null,
  base_type text null,
  active boolean null default true,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint packages_pkey primary key (id),
  constraint packages_slug_key unique (slug),
  constraint packages_event_id_fkey foreign KEY (event_id) references events (id) on delete CASCADE,
  constraint packages_base_type_check check (
    (
      base_type = any (array['Grandstand'::text, 'VIP'::text])
    )
  )
) TABLESPACE pg_default;
create table public.sports (
  id uuid not null default gen_random_uuid (),
  name text not null,
  constraint sports_pkey primary key (id),
  constraint sports_name_key unique (name)
) TABLESPACE pg_default;
create table public.sports (
  id uuid not null default gen_random_uuid (),
  name text not null,
  constraint sports_pkey primary key (id),
  constraint sports_name_key unique (name)
) TABLESPACE pg_default;
create table public.tickets (
  id uuid not null default gen_random_uuid (),
  event_id uuid not null,
  ticket_category_id text null,
  quantity_total integer not null,
  quantity_reserved integer not null default 0,
  quantity_provisional integer not null default 0,
  quantity_available integer GENERATED ALWAYS as (
    (
      (quantity_total - quantity_reserved) - quantity_provisional
    )
  ) STORED null,
  price numeric(10, 2) not null,
  markup_percent numeric(5, 2) null default 0.00,
  price_with_markup numeric GENERATED ALWAYS as (
    (
      price + ((price * markup_percent) / (100)::numeric)
    )
  ) STORED (10, 2) null,
  currency text not null default 'EUR'::text,
  delivery_method text null,
  ticket_format text null,
  ticket_type text null,
  ticket_delivery_days integer null,
  available_from date null,
  available_until date null,
  refundable boolean null default false,
  resellable boolean null default false,
  party_size_together integer null,
  supplier text null,
  supplier_ref text null,
  distribution_channel text null,
  ordered boolean null default false,
  ordered_at timestamp without time zone null,
  paid boolean null default false,
  paid_at timestamp without time zone null,
  tickets_received boolean null default false,
  tickets_received_at timestamp without time zone null,
  active boolean null default true,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  metadata jsonb null,
  constraint tickets_pkey primary key (id),
  constraint tickets_event_id_fkey foreign KEY (event_id) references events (id) on delete CASCADE,
  constraint tickets_ticket_category_id_fkey foreign KEY (ticket_category_id) references ticket_categories (id) on delete set null,
  constraint tickets_price_check check ((price >= (0)::numeric)),
  constraint tickets_quantity_provisional_check check ((quantity_provisional >= 0)),
  constraint tickets_quantity_reserved_check check ((quantity_reserved >= 0)),
  constraint tickets_quantity_total_check check ((quantity_total >= 0)),
  constraint tickets_markup_percent_check check ((markup_percent >= (0)::numeric))
) TABLESPACE pg_default;
create table public.venues (
  id uuid not null default gen_random_uuid (),
  name text not null,
  slug text null,
  country text null,
  city text null,
  timezone text null,
  latitude numeric(9, 6) null,
  longitude numeric(9, 6) null,
  description text null,
  images jsonb null,
  map_url text null,
  website text null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint venues_pkey primary key (id),
  constraint venues_slug_key unique (slug)
) TABLESPACE pg_default;
create table lounge_passes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,

  airport_code text,               -- e.g. LHR, MXP
  lounge_name text not null,      -- e.g. Plaza Premium Lounge
  terminal text,                  -- optional terminal info

  supplier text,
  quote_currency text default 'GBP',
  supplier_quote numeric(10, 2),   -- per person
  markup_percent numeric(5, 2) default 0,
  price_gbp numeric(10, 2) generated always as (
    supplier_quote + (supplier_quote * markup_percent / 100)
  ) stored,

  capacity integer,                -- optional max available
  delivery_method text,           -- e.g. e-ticket, physical
  description text,
  notes text,

  is_active boolean default true,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
CREATE TABLE public.flights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id),

  -- Outbound flight
  outbound_flight_number text NOT NULL,
  outbound_departure_airport_code text NOT NULL,
  outbound_departure_airport_name text NOT NULL,
  outbound_arrival_airport_code text NOT NULL,
  outbound_arrival_airport_name text NOT NULL,
  outbound_departure_datetime timestamp NOT NULL,
  outbound_arrival_datetime timestamp NOT NULL,

  -- Inbound flight (optional for one-way trips)
  inbound_flight_number text,
  inbound_departure_airport_code text,
  inbound_departure_airport_name text,
  inbound_arrival_airport_code text,
  inbound_arrival_airport_name text,
  inbound_departure_datetime timestamp,
  inbound_arrival_datetime timestamp,

  -- Pricing & meta
  airline text,
  cabin text,
  total_price_gbp numeric(10,2) NOT NULL,
  currency text DEFAULT 'GBP',
  refundable boolean DEFAULT false,
  baggage_allowance text,
  notes text,
  supplier text,
  supplier_ref text,

  -- Availability & Timestamps
  active boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

create table public.circuit_transfers (
  id uuid not null default gen_random_uuid (),
  event_id uuid null,
  hotel_id uuid null,
  transfer_type text not null,
  vehicle_name text null,
  seat_capacity integer not null,
  pickup_time time without time zone null,
  return_time time without time zone null,
  total_cost numeric(10, 2) not null,
  currency text null default 'EUR'::text,
  markup_percent numeric(5, 2) null default 0.00,
  cost_per_seat numeric GENERATED ALWAYS as ((total_cost / (seat_capacity)::numeric)) STORED (10, 2) null,
  price_per_seat numeric GENERATED ALWAYS as (
    (
      (total_cost / (seat_capacity)::numeric) + (
        (
          (total_cost / (seat_capacity)::numeric) * markup_percent
        ) / (100)::numeric
      )
    )
  ) STORED (10, 2) null,
  min_fill_percent numeric(5, 2) null default 100,
  breakeven_per_seat numeric GENERATED ALWAYS as (
    (
      total_cost / ceil(
        (
          (min_fill_percent / 100.0) * (seat_capacity)::numeric
        )
      )
    )
  ) STORED (10, 2) null,
  profit_per_seat numeric GENERATED ALWAYS as (
    (
      (
        (total_cost / (seat_capacity)::numeric) + (
          (
            (total_cost / (seat_capacity)::numeric) * markup_percent
          ) / (100)::numeric
        )
      ) - (
        total_cost / ceil(
          (
            (min_fill_percent / 100.0) * (seat_capacity)::numeric
          )
        )
      )
    )
  ) STORED (10, 2) null,
  seats_reserved integer null default 0,
  seats_provisional integer null default 0,
  seats_available integer GENERATED ALWAYS as (
    (
      (seat_capacity - seats_reserved) - seats_provisional
    )
  ) STORED null,
  guide_included boolean null default true,
  guide_name text null,
  guide_cost numeric(10, 2) null,
  supplier text null,
  supplier_ref text null,
  notes text null,
  active boolean null default true,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint circuit_transfers_pkey primary key (id),
  constraint circuit_transfers_event_id_fkey foreign KEY (event_id) references events (id) on delete CASCADE,
  constraint circuit_transfers_hotel_id_fkey foreign KEY (hotel_id) references gpgt_hotels (id),
  constraint circuit_transfers_transfer_type_check check (
    (
      transfer_type = any (array['coach'::text, 'mpv'::text])
    )
  )
) TABLESPACE pg_default;
create table public.hotel_rooms (
  id uuid not null default gen_random_uuid (),
  hotel_id uuid not null,
  room_type_id text not null,
  event_id uuid null,
  check_in date not null,
  check_out date not null,
  nights integer GENERATED ALWAYS as ((check_out - check_in)) STORED null,
  quantity_total integer not null,
  quantity_reserved integer null default 0,
  quantity_provisional integer null default 0,
  quantity_available integer GENERATED ALWAYS as (
    (
      (quantity_total - quantity_reserved) - quantity_provisional
    )
  ) STORED null,
  base_price numeric(10, 2) not null,
  markup_percent numeric(5, 2) null default 0.00,
  price_with_markup numeric GENERATED ALWAYS as (
    (
      base_price + ((base_price * markup_percent) / (100)::numeric)
    )
  ) STORED (10, 2) null,
  currency text null default 'EUR'::text,
  vat_percent numeric(5, 2) null,
  resort_fee numeric(10, 2) null,
  resort_fee_type text null default 'per_night'::text,
  city_tax_per_person_per_night numeric(10, 2) null,
  contracted boolean null default false,
  attrition_deadline date null,
  release_allowed_percent numeric(5, 2) null,
  penalty_terms text null,
  supplier text null,
  supplier_ref text null,
  active boolean null default true,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint hotel_rooms_pkey primary key (id),
  constraint hotel_rooms_event_id_fkey foreign KEY (event_id) references events (id),
  constraint hotel_rooms_hotel_id_fkey foreign KEY (hotel_id) references gpgt_hotels (id) on delete CASCADE
) TABLESPACE pg_default;
create table public.hotel_rooms (
  id uuid not null default gen_random_uuid (),
  hotel_id uuid not null,
  room_type_id text not null,
  event_id uuid null,
  check_in date not null,
  check_out date not null,
  nights integer GENERATED ALWAYS as ((check_out - check_in)) STORED null,
  quantity_total integer not null,
  quantity_reserved integer null default 0,
  quantity_provisional integer null default 0,
  quantity_available integer GENERATED ALWAYS as (
    (
      (quantity_total - quantity_reserved) - quantity_provisional
    )
  ) STORED null,
  base_price numeric(10, 2) not null,
  markup_percent numeric(5, 2) null default 0.00,
  price_with_markup numeric GENERATED ALWAYS as (
    (
      base_price + ((base_price * markup_percent) / (100)::numeric)
    )
  ) STORED (10, 2) null,
  currency text null default 'EUR'::text,
  vat_percent numeric(5, 2) null,
  resort_fee numeric(10, 2) null,
  resort_fee_type text null default 'per_night'::text,
  city_tax_per_person_per_night numeric(10, 2) null,
  contracted boolean null default false,
  attrition_deadline date null,
  release_allowed_percent numeric(5, 2) null,
  penalty_terms text null,
  supplier text null,
  supplier_ref text null,
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
  tier_id uuid null,
  event_id uuid null,
  component_type text not null,
  component_id uuid not null,
  quantity integer null default 1,
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
          'flight'::text,
          'lounge_pass'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;
create table public.package_tiers (
  id uuid not null default gen_random_uuid (),
  package_id uuid null,
  name text not null,
  short_label text null,
  description text null,
  display_order integer null,
  price_override numeric(10, 2) null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
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
  constraint packages_event_id_fkey foreign KEY (event_id) references events (id) on delete CASCADE
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
create table flights (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,

  departure_airport_code text not null,
  arrival_airport_code text not null,
  return_departure_airport_code text,
  return_arrival_airport_code text,

  airline text,
  flight_class text,
  outbound_flight_number text,
  return_flight_number text,

  outbound_departure_datetime timestamptz,
  outbound_arrival_datetime timestamptz,
  return_departure_datetime timestamptz,
  return_arrival_datetime timestamptz,

  stops_outbound integer default 0,
  stops_return integer default 0,

  layovers_outbound jsonb, -- e.g. [{"airport_code": "FRA", "duration_mins": 90}]
  layovers_return jsonb,   -- e.g. [{"airport_code": "CDG", "duration_mins": 120}]

  supplier text,
  quote_currency text default 'GBP',
  supplier_quote numeric(10, 2),
  markup_percent numeric(5, 2) default 0,
  price_gbp numeric(10, 2) generated always as (
    supplier_quote + (supplier_quote * markup_percent / 100)
  ) stored,

  baggage_policy text,
  notes text,
  is_active boolean default true,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

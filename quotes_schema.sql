create table public.quotes (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  client_id uuid null,
  team_id uuid null,
  consultant_id uuid null,
  client_name text not null,
  client_email text null,
  client_phone text null,
  client_address jsonb null,
  event_id uuid null,
  event_name character varying(255) null,
  event_location character varying(255) null,
  event_start_date date null,
  event_end_date date null,
  package_id uuid null,
  package_name character varying(255) null,
  package_base_type character varying(50) null,
  tier_id uuid null,
  tier_name character varying(255) null,
  tier_description text null,
  tier_price_override numeric(10, 2) null,
  travelers jsonb not null,
  travelers_adults integer null default 1,
  travelers_children integer null default 0,
  travelers_total integer null default 1,
  total_price numeric(10, 2) null,
  currency text null default 'GBP'::text,
  base_cost numeric(10, 2) null,
  payment_deposit numeric(10, 2) null default 0,
  payment_second_payment numeric(10, 2) null default 0,
  payment_final_payment numeric(10, 2) null default 0,
  payment_deposit_date date null,
  payment_second_payment_date date null,
  payment_final_payment_date date null,
  quote_number character varying(50) null,
  quote_reference character varying(100) null,
  status text null default 'draft'::text,
  version integer null default 1,
  is_revision boolean null default false,
  parent_quote_id uuid null,
  selected_components jsonb null,
  selected_package jsonb null,
  selected_tier jsonb null,
  price_breakdown jsonb null,
  internal_notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  expires_at timestamp with time zone null,
  sent_at timestamp with time zone null,
  accepted_at timestamp with time zone null,
  declined_at timestamp with time zone null,
  expired_at timestamp with time zone null,
  constraint quotes_pkey primary key (id),
  constraint quotes_quote_number_key unique (quote_number),
  constraint quotes_package_id_fkey foreign KEY (package_id) references packages (id),
  constraint quotes_client_id_fkey foreign KEY (client_id) references clients (id) on delete set null,
  constraint quotes_parent_quote_id_fkey foreign KEY (parent_quote_id) references quotes (id),
  constraint quotes_consultant_id_fkey foreign KEY (consultant_id) references team_members (id) on delete set null,
  constraint quotes_team_id_fkey foreign KEY (team_id) references teams (id) on delete set null,
  constraint quotes_user_id_fkey foreign KEY (user_id) references auth.users (id),
  constraint quotes_tier_id_fkey foreign KEY (tier_id) references package_tiers (id),
  constraint quotes_event_id_fkey foreign KEY (event_id) references events (id),
  constraint valid_travelers check (
    (
      travelers_total = (travelers_adults + travelers_children)
    )
  ),
  constraint quotes_status_check check (
    (
      status = any (
        array[
          'draft'::text,
          'sent'::text,
          'accepted'::text,
          'declined'::text,
          'expired'::text,
          'confirmed'::text,
          'cancelled'::text
        ]
      )
    )
  ),
  constraint valid_currency check (
    (
      currency = any (
        array[
          'GBP'::text,
          'USD'::text,
          'EUR'::text,
          'CAD'::text,
          'AUD'::text,
          'CHF'::text,
          'JPY'::text,
          'SGD'::text,
          'HKD'::text,
          'NZD'::text
        ]
      )
    )
  ),
  constraint valid_payment_schedule check (
    (
      (
        (payment_deposit + payment_second_payment) + payment_final_payment
      ) = total_price
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_quotes_client_id on public.quotes using btree (client_id) TABLESPACE pg_default;

create index IF not exists idx_quotes_team_id on public.quotes using btree (team_id) TABLESPACE pg_default;

create index IF not exists idx_quotes_status on public.quotes using btree (status) TABLESPACE pg_default;

create index IF not exists idx_quotes_client_email on public.quotes using btree (client_email) TABLESPACE pg_default;

create index IF not exists idx_quotes_created_at on public.quotes using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_quotes_event_id on public.quotes using btree (event_id) TABLESPACE pg_default;

create index IF not exists idx_quotes_consultant_id on public.quotes using btree (consultant_id) TABLESPACE pg_default;

create index IF not exists idx_quotes_quote_number on public.quotes using btree (quote_number) TABLESPACE pg_default;

create index IF not exists idx_quotes_currency on public.quotes using btree (currency) TABLESPACE pg_default;

create index IF not exists idx_quotes_user_id on public.quotes using btree (user_id) TABLESPACE pg_default;
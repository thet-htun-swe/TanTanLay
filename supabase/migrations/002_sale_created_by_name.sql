-- =============================================================================
-- TanTanLay - 002: show who made each sale
--
-- How to run: Supabase dashboard -> SQL Editor -> New query -> paste this whole
-- file -> Run. Run it ONCE, after 001_init.sql. It is one transaction: if
-- anything fails, nothing changes.
--
-- Why a copied name: staff may only read their own row in `profiles` (RLS), so
-- they cannot look up other people's names. The seller's name is saved on the
-- sale itself when it is created, so everyone who can see the sale sees it.
-- It is the name at the time of the sale (renaming a profile later does not
-- change old sales).
-- =============================================================================

begin;

-- 1. New column
alter table public.sales add column created_by_name text;

-- 2. Fill it for sales made before this change
update public.sales s
set created_by_name = p.full_name
from public.profiles p
where p.id = s.created_by
  and s.created_by_name is null;

-- 3. create_sale now also saves the seller's name (rest unchanged from 001)
create or replace function public.create_sale(p_sale jsonb)
returns table (id bigint, invoice_number text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_client_id   uuid;
  v_order_date  timestamptz;
  v_day         date;
  v_number      integer;
  v_invoice     text;
  v_customer_id bigint;
  v_sale_id     bigint;
  v_seller_name text;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  v_client_id := nullif(p_sale ->> 'client_id', '')::uuid;
  if v_client_id is null then
    raise exception 'Missing client_id';
  end if;

  -- Two copies of the same request wait for each other here
  perform pg_advisory_xact_lock(hashtextextended(v_client_id::text, 0));

  -- 1. Already saved? Return it.
  return query
    select s.id, s.invoice_number from public.sales s where s.client_id = v_client_id;
  if found then
    return;
  end if;

  v_order_date := nullif(p_sale ->> 'order_date', '')::timestamptz;
  if v_order_date is null then
    raise exception 'Missing order date';
  end if;
  v_day := coalesce(nullif(p_sale ->> 'order_day', '')::date, v_order_date::date);

  -- Seller's name (profile name, which defaults to the login email)
  select p.full_name into v_seller_name from public.profiles p where p.id = auth.uid();

  -- 3. Customer
  v_customer_id := public._find_or_create_customer(p_sale -> 'customer');

  -- 4. Invoice number: YYMMDD + 3 digits, counted per order day
  insert into public.invoice_counters as c (day, last_number)
  values (v_day, 1)
  on conflict (day) do update set last_number = c.last_number + 1
  returning c.last_number into v_number;
  v_invoice := to_char(v_day, 'YYMMDD') || lpad(v_number::text, 3, '0');

  -- 5. Sale row
  insert into public.sales as s (
    client_id, invoice_number, customer_id, customer_name, customer_contact, customer_address,
    subtotal, total, date, order_date, created_by, created_by_name
  )
  values (
    v_client_id,
    v_invoice,
    v_customer_id,
    trim(coalesce(p_sale -> 'customer' ->> 'name', '')),
    nullif(trim(coalesce(p_sale -> 'customer' ->> 'contact', '')), ''),
    nullif(trim(coalesce(p_sale -> 'customer' ->> 'address', '')), ''),
    coalesce((p_sale ->> 'subtotal')::numeric, 0),
    coalesce((p_sale ->> 'total')::numeric, 0),
    coalesce(nullif(p_sale ->> 'date', '')::timestamptz, now()),
    v_order_date,
    auth.uid(),
    v_seller_name
  )
  returning s.id into v_sale_id;

  -- 2 + 5. Lock/check stock, insert items, take stock out
  perform public._apply_sale_items(v_sale_id, p_sale -> 'items');

  return query select v_sale_id, v_invoice;
end;
$$;

commit;

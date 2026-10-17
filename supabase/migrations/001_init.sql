-- =============================================================================
-- TanTanLay - initial Supabase schema (Phase 1)
--
-- How to run: Supabase dashboard -> SQL Editor -> New query -> paste this whole
-- file -> Run. Run it ONCE on the empty project. It is wrapped in one
-- transaction, so if anything fails nothing is created and you can fix + re-run.
--
-- Contents:
--   1. Tables (profiles, products, customers, sales, sale_items, invoice_counters)
--   2. Triggers (new-user profile, updated_at / updated_by)
--   3. is_admin() helper
--   4. Row Level Security policies
--   5. Sale functions: create_sale, update_sale, delete_sale (+ private helpers)
--   6. Function permissions
--   7. Realtime
--
-- Sale payload (p_sale jsonb) used by create_sale / update_sale:
--   {
--     "client_id":  "<uuid made on the phone>",      -- create_sale only
--     "customer":   { "name": "...", "contact": "...", "address": "..." },
--     "items": [
--       { "product_id": 12,   "custom_key": null,            -- inventory item
--         "product_name": "...", "quantity": 2, "unit_price": 1000, "line_total": 2000 },
--       { "product_id": null, "custom_key": "custom-<uuid>", -- custom item
--         "product_name": "...", "quantity": 1, "unit_price": 500,  "line_total": 500 }
--     ],
--     "subtotal": 2500, "total": 2500,
--     "date":       "<ISO timestamp>",                -- create_sale only
--     "order_date": "<ISO timestamp>",                -- create_sale only
--     "order_day":  "YYYY-MM-DD"                      -- phone's local day of order_date,
--   }                                                 -- used for the invoice number
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Tables
-- -----------------------------------------------------------------------------

create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  role       text not null default 'staff' check (role in ('admin', 'staff')),
  created_at timestamptz not null default now()
);

create table public.products (
  id         bigint generated always as identity primary key,
  name       text not null,
  price      numeric(12, 2) not null check (price >= 0),
  stock_qty  integer not null default 0 check (stock_qty >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);
create index products_name_idx on public.products (name);

create table public.customers (
  id         bigint generated always as identity primary key,
  name       text not null,
  contact    text,
  address    text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index customers_name_idx on public.customers (name);

create table public.sales (
  id               bigint generated always as identity primary key,
  client_id        uuid not null unique,
  invoice_number   text not null unique,
  -- set null: deleting a customer keeps their old sales (name/contact are copied below)
  customer_id      bigint references public.customers (id) on delete set null,
  customer_name    text not null,
  customer_contact text,
  customer_address text,
  subtotal         numeric(12, 2) not null,
  total            numeric(12, 2) not null,
  date             timestamptz not null default now(),
  order_date       timestamptz not null,
  created_at       timestamptz not null default now(),
  created_by       uuid references auth.users (id) on delete set null
);
create index sales_date_idx on public.sales (date);
create index sales_customer_id_idx on public.sales (customer_id);

create table public.sale_items (
  id           bigint generated always as identity primary key,
  sale_id      bigint not null references public.sales (id) on delete cascade,
  product_id   bigint references public.products (id) on delete set null,
  custom_key   text,
  product_name text not null,
  quantity     integer not null check (quantity > 0),
  unit_price   numeric(12, 2) not null,
  line_total   numeric(12, 2) not null
);
create index sale_items_sale_id_idx on public.sale_items (sale_id);
create index sale_items_product_id_idx on public.sale_items (product_id);

create table public.invoice_counters (
  day         date primary key,
  last_number integer not null default 0
);

-- -----------------------------------------------------------------------------
-- 2. Triggers
-- -----------------------------------------------------------------------------

-- Every new login account gets a profile row (role 'staff' by default).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create function public.set_updated_by()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_by := auth.uid();
  return new;
end;
$$;

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create trigger products_set_updated_by
  before insert or update on public.products
  for each row execute function public.set_updated_by();

create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 3. is_admin()
-- -----------------------------------------------------------------------------

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- -----------------------------------------------------------------------------
-- 4. Row Level Security
--    No policy = not allowed. Sales are written only through the functions below.
-- -----------------------------------------------------------------------------

alter table public.profiles         enable row level security;
alter table public.products         enable row level security;
alter table public.customers        enable row level security;
alter table public.sales            enable row level security;
alter table public.sale_items       enable row level security;
alter table public.invoice_counters enable row level security;

-- profiles: see own row (admin sees all); only admin can change (e.g. role)
create policy "profiles: read own or admin" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "profiles: admin update" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- products: everyone signed in can read; only admin can write
create policy "products: read" on public.products
  for select to authenticated using (true);
create policy "products: admin insert" on public.products
  for insert to authenticated with check (public.is_admin());
create policy "products: admin update" on public.products
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "products: admin delete" on public.products
  for delete to authenticated using (public.is_admin());

-- customers: everyone signed in can read/add/edit; only admin can delete
create policy "customers: read" on public.customers
  for select to authenticated using (true);
create policy "customers: insert" on public.customers
  for insert to authenticated with check (true);
create policy "customers: update" on public.customers
  for update to authenticated using (true) with check (true);
create policy "customers: admin delete" on public.customers
  for delete to authenticated using (public.is_admin());

-- sales / sale_items: read only (writes go through create/update/delete_sale)
create policy "sales: read" on public.sales
  for select to authenticated using (true);
create policy "sale_items: read" on public.sale_items
  for select to authenticated using (true);

-- invoice_counters: no policies (only the functions use it)

-- -----------------------------------------------------------------------------
-- 5. Sale functions
-- -----------------------------------------------------------------------------

-- Private: find a customer by name + contact, or create one. Returns its id.
create function public._find_or_create_customer(p_customer jsonb)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name    text := trim(coalesce(p_customer ->> 'name', ''));
  v_contact text := nullif(trim(coalesce(p_customer ->> 'contact', '')), '');
  v_address text := nullif(trim(coalesce(p_customer ->> 'address', '')), '');
  v_id      bigint;
begin
  select c.id into v_id
  from public.customers c
  where c.name = v_name and coalesce(c.contact, '') = coalesce(v_contact, '')
  order by c.id
  limit 1;

  if v_id is null then
    insert into public.customers (name, contact, address)
    values (v_name, v_contact, v_address)
    returning customers.id into v_id;
  end if;

  return v_id;
end;
$$;

-- Private: lock the products in p_items, check stock, insert the items for
-- p_sale_id and take the quantities out of stock. Custom items skip stock.
create function public._apply_sale_items(p_sale_id bigint, p_items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'A sale needs at least one item';
  end if;

  -- Basic checks on every item
  for r in
    select e.x ->> 'product_name' as name,
           nullif(e.x ->> 'product_id', '')::bigint as product_id,
           nullif(e.x ->> 'custom_key', '') as custom_key,
           (e.x ->> 'quantity')::integer as quantity
    from jsonb_array_elements(p_items) as e(x)
  loop
    if r.quantity is null or r.quantity <= 0 then
      raise exception 'Quantity must be more than 0 for %', coalesce(r.name, 'an item');
    end if;
    if r.product_id is null and r.custom_key is null then
      raise exception 'Item % has no product', coalesce(r.name, '');
    end if;
  end loop;

  -- Lock the inventory products (in id order, so two sales never deadlock)
  perform 1
  from public.products p
  where p.id in (
    select nullif(e.x ->> 'product_id', '')::bigint
    from jsonb_array_elements(p_items) as e(x)
  )
  order by p.id
  for update;

  -- Check stock (same product on two lines is added together)
  for r in
    select n.product_id, n.qty, p.id as found_id, p.name, p.stock_qty
    from (
      select nullif(e.x ->> 'product_id', '')::bigint as product_id,
             sum((e.x ->> 'quantity')::integer) as qty
      from jsonb_array_elements(p_items) as e(x)
      where nullif(e.x ->> 'product_id', '') is not null
      group by 1
    ) n
    left join public.products p on p.id = n.product_id
    order by n.product_id
  loop
    if r.found_id is null then
      raise exception 'Product no longer exists (id %)', r.product_id;
    end if;
    if r.stock_qty < r.qty then
      raise exception 'Not enough stock for % (have %, need %)', r.name, r.stock_qty, r.qty;
    end if;
  end loop;

  -- Insert items in the same order as sent
  insert into public.sale_items (sale_id, product_id, custom_key, product_name, quantity, unit_price, line_total)
  select p_sale_id,
         nullif(e.x ->> 'product_id', '')::bigint,
         case when nullif(e.x ->> 'product_id', '') is null then e.x ->> 'custom_key' end,
         coalesce(nullif(e.x ->> 'product_name', ''), p.name, 'Item'),
         (e.x ->> 'quantity')::integer,
         coalesce((e.x ->> 'unit_price')::numeric, 0),
         coalesce((e.x ->> 'line_total')::numeric, 0)
  from jsonb_array_elements(p_items) with ordinality as e(x, ord)
  left join public.products p on p.id = nullif(e.x ->> 'product_id', '')::bigint
  order by e.ord;

  -- Take sold quantities out of stock
  update public.products p
  set stock_qty = p.stock_qty - n.qty
  from (
    select nullif(e.x ->> 'product_id', '')::bigint as product_id,
           sum((e.x ->> 'quantity')::integer) as qty
    from jsonb_array_elements(p_items) as e(x)
    where nullif(e.x ->> 'product_id', '') is not null
    group by 1
  ) n
  where p.id = n.product_id;
end;
$$;

-- Private: put a sale's inventory quantities back into stock.
create function public._restore_sale_stock(p_sale_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.products p
  set stock_qty = p.stock_qty + n.qty
  from (
    select si.product_id, sum(si.quantity) as qty
    from public.sale_items si
    where si.sale_id = p_sale_id and si.product_id is not null
    group by si.product_id
  ) n
  where p.id = n.product_id;
end;
$$;

-- Create a sale (admin and staff). Safe to retry: same client_id returns the
-- sale that was already saved instead of saving it twice.
create function public.create_sale(p_sale jsonb)
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
    subtotal, total, date, order_date, created_by
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
    auth.uid()
  )
  returning s.id into v_sale_id;

  -- 2 + 5. Lock/check stock, insert items, take stock out
  perform public._apply_sale_items(v_sale_id, p_sale -> 'items');

  return query select v_sale_id, v_invoice;
end;
$$;

-- Edit a sale (admin only). Dates and invoice number stay the same.
create function public.update_sale(p_id bigint, p_sale jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id bigint;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if not public.is_admin() then
    raise exception 'Only an admin can edit a sale';
  end if;

  perform 1 from public.sales s where s.id = p_id for update;
  if not found then
    raise exception 'Sale not found';
  end if;

  -- Lock old and new products together, in id order
  perform 1
  from public.products p
  where p.id in (
    select si.product_id from public.sale_items si where si.sale_id = p_id
    union
    select nullif(e.x ->> 'product_id', '')::bigint
    from jsonb_array_elements(coalesce(p_sale -> 'items', '[]'::jsonb)) as e(x)
  )
  order by p.id
  for update;

  -- Give back the old items' stock, then remove the old items
  perform public._restore_sale_stock(p_id);
  delete from public.sale_items si where si.sale_id = p_id;

  v_customer_id := public._find_or_create_customer(p_sale -> 'customer');

  update public.sales s
  set customer_id      = v_customer_id,
      customer_name    = trim(coalesce(p_sale -> 'customer' ->> 'name', '')),
      customer_contact = nullif(trim(coalesce(p_sale -> 'customer' ->> 'contact', '')), ''),
      customer_address = nullif(trim(coalesce(p_sale -> 'customer' ->> 'address', '')), ''),
      subtotal         = coalesce((p_sale ->> 'subtotal')::numeric, 0),
      total            = coalesce((p_sale ->> 'total')::numeric, 0)
  where s.id = p_id;

  -- New items: check stock, insert, take stock out
  perform public._apply_sale_items(p_id, p_sale -> 'items');
end;
$$;

-- Delete a sale (admin only). Stock comes back; items are deleted with it.
create function public.delete_sale(p_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if not public.is_admin() then
    raise exception 'Only an admin can delete a sale';
  end if;

  perform 1 from public.sales s where s.id = p_id for update;
  if not found then
    raise exception 'Sale not found';
  end if;

  perform 1
  from public.products p
  where p.id in (select si.product_id from public.sale_items si where si.sale_id = p_id)
  order by p.id
  for update;

  perform public._restore_sale_stock(p_id);
  delete from public.sales s where s.id = p_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- 6. Function permissions
--    Only signed-in users may call the public functions; nobody may call the
--    private helpers or trigger functions directly.
-- -----------------------------------------------------------------------------

revoke execute on function public.is_admin()                     from public, anon;
revoke execute on function public.create_sale(jsonb)             from public, anon;
revoke execute on function public.update_sale(bigint, jsonb)     from public, anon;
revoke execute on function public.delete_sale(bigint)            from public, anon;
grant  execute on function public.is_admin()                     to authenticated;
grant  execute on function public.create_sale(jsonb)             to authenticated;
grant  execute on function public.update_sale(bigint, jsonb)     to authenticated;
grant  execute on function public.delete_sale(bigint)            to authenticated;

revoke execute on function public._find_or_create_customer(jsonb)    from public, anon, authenticated;
revoke execute on function public._apply_sale_items(bigint, jsonb)   from public, anon, authenticated;
revoke execute on function public._restore_sale_stock(bigint)        from public, anon, authenticated;
revoke execute on function public.handle_new_user()                  from public, anon, authenticated;

-- invoice_counters is only touched by create_sale
revoke all on table public.invoice_counters from anon, authenticated;

-- -----------------------------------------------------------------------------
-- 7. Realtime (live updates on other phones)
-- -----------------------------------------------------------------------------

alter publication supabase_realtime add table public.products, public.sales, public.customers;

commit;

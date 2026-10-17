-- =============================================================================
-- TanTanLay - 003: discounts on sale items
--
-- How to run: Supabase dashboard -> SQL Editor -> New query -> paste this whole
-- file -> Run. Run it ONCE, after 002. It is one transaction: if anything
-- fails, nothing changes.
--
-- Each item can have a discount on the whole line, entered as an amount
-- (e.g. 2000 off) or a percentage (e.g. 10% off):
--   discount        money taken off the line (0 = no discount)
--   discount_type   'amount' or 'percent' (null when no discount)
--   discount_value  what the user typed (2000, or 10 for 10%)
--   line_total      quantity * unit_price - discount   (sent by the app)
-- On the sale: subtotal = before discounts, total = after discounts.
-- =============================================================================

begin;

alter table public.sale_items
  add column discount numeric(12, 2) not null default 0 check (discount >= 0),
  add column discount_type text check (discount_type in ('amount', 'percent')),
  add column discount_value numeric(12, 2) check (discount_value >= 0);

-- Private: lock the products in p_items, check stock, insert the items for
-- p_sale_id and take the quantities out of stock. Custom items skip stock.
-- 003: also saves each item's discount (amount or percent, whole line).
create or replace function public._apply_sale_items(p_sale_id bigint, p_items jsonb)
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
           (e.x ->> 'quantity')::integer as quantity,
           coalesce((e.x ->> 'unit_price')::numeric, 0) as unit_price,
           coalesce(nullif(e.x ->> 'discount', '')::numeric, 0) as discount,
           nullif(e.x ->> 'discount_type', '') as discount_type
    from jsonb_array_elements(p_items) as e(x)
  loop
    if r.quantity is null or r.quantity <= 0 then
      raise exception 'Quantity must be more than 0 for %', coalesce(r.name, 'an item');
    end if;
    if r.product_id is null and r.custom_key is null then
      raise exception 'Item % has no product', coalesce(r.name, '');
    end if;
    if r.discount < 0 or r.discount > r.quantity * r.unit_price then
      raise exception 'Discount for % is more than its price', coalesce(r.name, 'an item');
    end if;
    if r.discount_type is not null and r.discount_type not in ('amount', 'percent') then
      raise exception 'Unknown discount type for %', coalesce(r.name, 'an item');
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
  insert into public.sale_items (
    sale_id, product_id, custom_key, product_name, quantity, unit_price, line_total,
    discount, discount_type, discount_value
  )
  select p_sale_id,
         nullif(e.x ->> 'product_id', '')::bigint,
         case when nullif(e.x ->> 'product_id', '') is null then e.x ->> 'custom_key' end,
         coalesce(nullif(e.x ->> 'product_name', ''), p.name, 'Item'),
         (e.x ->> 'quantity')::integer,
         coalesce((e.x ->> 'unit_price')::numeric, 0),
         coalesce((e.x ->> 'line_total')::numeric, 0),
         coalesce(nullif(e.x ->> 'discount', '')::numeric, 0),
         case when coalesce(nullif(e.x ->> 'discount', '')::numeric, 0) > 0
              then nullif(e.x ->> 'discount_type', '') end,
         case when coalesce(nullif(e.x ->> 'discount', '')::numeric, 0) > 0
              then nullif(e.x ->> 'discount_value', '')::numeric end
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

commit;

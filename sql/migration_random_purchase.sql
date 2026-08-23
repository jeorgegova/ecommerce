-- Compra Aleatoria: persistencia descuento
-- Ejecutar en Supabase SQL Editor

create table if not exists random_purchase_discounts (
  user_id uuid primary key references profiles(id) on delete cascade,
  target integer not null check (target > 0),
  discount integer not null check (discount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- trigger updated_at
create or replace function update_random_purchase_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_random_purchase_updated_at on random_purchase_discounts;
create trigger trg_random_purchase_updated_at
  before update on random_purchase_discounts
  for each row execute function update_random_purchase_updated_at();

alter table random_purchase_discounts enable row level security;

drop policy if exists "random_discount_select_own" on random_purchase_discounts;
create policy "random_discount_select_own" on random_purchase_discounts
  for select using (auth.uid() = user_id);

drop policy if exists "random_discount_insert_own" on random_purchase_discounts;
create policy "random_discount_insert_own" on random_purchase_discounts
  for insert with check (auth.uid() = user_id);

drop policy if exists "random_discount_update_own" on random_purchase_discounts;
create policy "random_discount_update_own" on random_purchase_discounts
  for update using (auth.uid() = user_id);

drop policy if exists "random_discount_delete_own" on random_purchase_discounts;
create policy "random_discount_delete_own" on random_purchase_discounts
  for delete using (auth.uid() = user_id);

drop policy if exists "random_discount_admin" on random_purchase_discounts;
create policy "random_discount_admin" on random_purchase_discounts
  for all using (is_admin());

create index if not exists idx_random_purchase_user on random_purchase_discounts(user_id);

-- RPC: create order from cart with random purchase discount
create or replace function create_order_from_cart_random(
  p_user_id uuid,
  p_shipping_address_id uuid default null,
  p_billing_address_id uuid default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric(12,2) := 0;
  v_shipping_cost numeric(12,2) := 0;
  v_discount numeric(12,2) := 0;
  v_total numeric(12,2);
  v_target integer;
  v_stored_discount integer;
  v_item record;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Unauthorized';
  end if;

  if not exists (select 1 from cart_items where user_id = p_user_id) then
    raise exception 'Cart empty';
  end if;

  -- validate stock same as create_order_from_cart
  for v_item in
    select ci.product_id, ci.variant_id, ci.quantity,
           p.stock as product_stock, p.has_variants, pv.stock as variant_stock,
           p.name as product_name, pv.name as variant_name
    from cart_items ci
    join products p on p.id = ci.product_id
    left join product_variants pv on pv.id = ci.variant_id
    where ci.user_id = p_user_id
    for update of p
  loop
    if v_item.has_variants and v_item.variant_id is null then
      raise exception 'Product % requires variant', v_item.product_name;
    end if;
    if v_item.variant_id is not null and v_item.variant_stock < v_item.quantity then
      raise exception 'Insufficient stock for variant %', v_item.variant_name;
    end if;
    if v_item.variant_id is null and v_item.product_stock < v_item.quantity then
      raise exception 'Insufficient stock for %', v_item.product_name;
    end if;
  end loop;

  -- compute subtotal (using promotion logic: if sale_price not null then sale_price else base_price)
  select coalesce(sum(
    (case when p.promotion_active and p.sale_price is not null then p.sale_price else p.base_price end + coalesce(pv.price_adjustment,0)) * ci.quantity
  ),0) into v_subtotal
  from cart_items ci
  join products p on p.id = ci.product_id
  left join product_variants pv on pv.id = ci.variant_id
  where ci.user_id = p_user_id;

  -- fetch random purchase target/discount if exists
  select target, discount into v_target, v_stored_discount
  from random_purchase_discounts where user_id = p_user_id;

  if v_target is not null then
    -- validate cart matches target via discount
    -- allowed: subtotal >= target and discount == subtotal - target
    -- if cart was modified after generation, recompute minimal discount
    if v_subtotal < v_target then
      raise exception 'Cart total (%) below requested target (%). Regenerate purchase.', v_subtotal, v_target;
    end if;
    v_discount := v_subtotal - v_target;
    -- security: discount must equal stored and must be minimal (no inflated discount)
    -- if stored discount differs, use computed but ensure not larger than computed
    -- if user tried to inflate discount, we cap to computed
    if v_stored_discount is not null and v_stored_discount != v_discount then
      -- if cart changed, stored is stale, use new computed but limit to reasonable (<=50% subtotal)
      -- to avoid abuse, cap discount to 50% or 100000?
      v_discount := least(v_discount, v_subtotal * 0.5);
    end if;
    -- final safety cap: discount cannot exceed subtotal
    v_discount := least(v_discount, v_subtotal);
  end if;

  v_total := v_subtotal + v_shipping_cost - v_discount;
  v_order_number := generate_order_number();

  insert into orders (user_id, order_number, status, subtotal, shipping_cost, discount, total, notes, shipping_address_id, billing_address_id)
  values (p_user_id, v_order_number, 'pending', v_subtotal, v_shipping_cost, v_discount, v_total, p_notes, p_shipping_address_id, p_billing_address_id)
  returning id into v_order_id;

  for v_item in
    select ci.product_id, ci.variant_id, ci.quantity,
           p.name as product_name, p.sku as product_sku, pv.name as variant_name,
           case when p.promotion_active and p.sale_price is not null then p.sale_price else p.base_price end as unit_price,
           coalesce(pv.price_adjustment,0) as price_adjustment
    from cart_items ci
    join products p on p.id = ci.product_id
    left join product_variants pv on pv.id = ci.variant_id
    where ci.user_id = p_user_id
  loop
    insert into order_items (order_id, product_id, variant_id, product_name, product_sku, variant_name, unit_price, quantity, subtotal)
    values (v_order_id, v_item.product_id, v_item.variant_id, v_item.product_name, v_item.product_sku, v_item.variant_name,
            v_item.unit_price + v_item.price_adjustment, v_item.quantity, (v_item.unit_price + v_item.price_adjustment)*v_item.quantity);
    perform record_movement(v_item.product_id, v_item.variant_id, p_user_id, 'sale', -v_item.quantity, 'order', v_order_id::text, 'Order '||v_order_number);
  end loop;

  delete from cart_items where user_id = p_user_id;
  delete from random_purchase_discounts where user_id = p_user_id;

  perform log_audit(p_user_id, 'create', 'order', v_order_id::text, null, jsonb_build_object('order_number', v_order_number, 'total', v_total, 'random_target', v_target));

  return v_order_id;
end;
$$;

-- NexTrade AI Reporting Assistant — prototype schema.
-- Authoritative source: docs/normalized/database-notes.md.
-- Applied by scripts/migrate.ts (task D3).
-- Destructive: drops and recreates all six tables.

DROP TABLE IF EXISTS order_cancellations CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;

CREATE TABLE vendors (
  id            uuid        PRIMARY KEY,
  company_name  varchar     NOT NULL,
  contact_email varchar     NOT NULL,
  status        varchar     NOT NULL,
  created_at    timestamp   NOT NULL
);

CREATE TABLE customers (
  id          uuid      PRIMARY KEY,
  email       varchar   NOT NULL,
  region      varchar   NOT NULL,
  signup_date timestamp NOT NULL
);

CREATE TABLE products (
  id         uuid      PRIMARY KEY,
  vendor_id  uuid      NOT NULL REFERENCES vendors(id),
  sku        varchar   NOT NULL,
  name       varchar   NOT NULL,
  category   varchar   NOT NULL,
  unit_price numeric   NOT NULL,
  created_at timestamp NOT NULL
);

CREATE INDEX products_vendor_id_idx ON products (vendor_id);

CREATE TABLE orders (
  id            uuid      PRIMARY KEY,
  customer_id   uuid      NOT NULL REFERENCES customers(id),
  order_date    timestamp NOT NULL,
  status        varchar   NOT NULL,
  total_amount  numeric   NOT NULL,
  shipped_at    timestamp,
  delivered_at  timestamp
);

CREATE INDEX orders_order_date_idx ON orders (order_date);

CREATE TABLE order_items (
  id         uuid    PRIMARY KEY,
  order_id   uuid    NOT NULL REFERENCES orders(id),
  product_id uuid    NOT NULL REFERENCES products(id),
  quantity   integer NOT NULL,
  unit_price numeric NOT NULL
);

CREATE INDEX order_items_order_id_idx   ON order_items (order_id);
CREATE INDEX order_items_product_id_idx ON order_items (product_id);

CREATE TABLE order_cancellations (
  id              uuid      PRIMARY KEY,
  order_id        uuid      NOT NULL UNIQUE REFERENCES orders(id),
  reason_category varchar   NOT NULL,
  detailed_reason text      NOT NULL,
  cancelled_at    timestamp NOT NULL
);

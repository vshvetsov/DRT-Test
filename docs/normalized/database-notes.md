# Database Notes — Normalized

Source: `docs/raw/database-schema.png`

This document captures only what is visibly readable in the schema diagram. Anything not visible is flagged in `open-questions.md`.

## Visible tables

Six tables are shown:
1. `VENDORS`
2. `CUSTOMERS`
3. `PRODUCTS`
4. `ORDERS`
5. `ORDER_ITEMS`
6. `ORDER_CANCELLATIONS`

## Visible fields by table

### VENDORS
| Column | Type | Key |
|---|---|---|
| id | uuid | PK |
| company_name | varchar | |
| contact_email | varchar | |
| status | varchar | |
| created_at | timestamp | |

### CUSTOMERS
| Column | Type | Key |
|---|---|---|
| id | uuid | PK |
| email | varchar | |
| region | varchar | |
| signup_date | timestamp | |

### PRODUCTS
| Column | Type | Key |
|---|---|---|
| id | uuid | PK |
| vendor_id | uuid | FK |
| sku | varchar | |
| name | varchar | |
| category | varchar | |
| unit_price | decimal | |
| created_at | timestamp | |

### ORDERS
| Column | Type | Key |
|---|---|---|
| id | uuid | PK |
| customer_id | uuid | FK |
| order_date | timestamp | |
| status | varchar | |
| total_amount | decimal | |
| shipped_at | timestamp | |
| delivered_at | timestamp | |

### ORDER_ITEMS
| Column | Type | Key |
|---|---|---|
| id | uuid | PK |
| order_id | uuid | FK |
| product_id | uuid | FK |
| quantity | integer | |
| unit_price | decimal | |

### ORDER_CANCELLATIONS
| Column | Type | Key / Notes |
|---|---|---|
| id | uuid | PK |
| order_id | uuid | FK, marked `unique` in the diagram |
| reason_category | varchar | |
| detailed_reason | text | |
| cancelled_at | timestamp | |

## Visible relationships

The diagram uses crow's-foot notation. Readable relationships are:

- `VENDORS` → `PRODUCTS`, labeled "supplies". Crow's foot on the PRODUCTS side indicates one vendor has many products.
- `CUSTOMERS` → `ORDERS`, labeled "places". One customer has many orders.
- `PRODUCTS` / `ORDERS` → `ORDER_ITEMS`, labeled "listed_in" (from PRODUCTS) and "contains" (from ORDERS). `ORDER_ITEMS` is the join between `ORDERS` and `PRODUCTS`.
- `ORDERS` → `ORDER_CANCELLATIONS`, labeled "may_have". The `order_id` column on `ORDER_CANCELLATIONS` is marked `unique`, which visibly enforces at most one cancellation record per order.

## Observations visible from the schema

- Vendor ownership of products is visible via `PRODUCTS.vendor_id`. There is no direct vendor column on `ORDERS`; vendor context on an order would be inferred through `ORDER_ITEMS.product_id` → `PRODUCTS.vendor_id`.
- The schema matches the operations claim in the call transcript: cancellations record a `reason_category` and `detailed_reason` but no other "why" fields; the transcript states this "why" info is not captured at checkout.
- Dave (Operations) describes the current data layout colloquially as "one giant master database table." The diagram shows multiple tables instead. The contradiction is flagged in `open-questions.md` — it is not resolved here.
- `unit_price` exists on both `PRODUCTS` and `ORDER_ITEMS`. The diagram shows the duplication but does not label the semantic intent. A likely interpretation (catalog price vs. price at time of order) is recorded in `assumptions.md`, not here.

## Items not visible / unreadable / uncertain

Recorded here as cautions; also listed in `open-questions.md`:

- No indexes are shown beyond the `unique` marker on `ORDER_CANCELLATIONS.order_id`.
- No explicit NOT NULL / NULL constraints are shown in the diagram.
- No enumerated values are shown for `VENDORS.status`, `ORDERS.status`, or `ORDER_CANCELLATIONS.reason_category`.
- No `users` / `auth` / `accounts` table is shown — the schema does not visibly include vendor login identities or access control.
- No currency column is shown alongside `decimal` money fields.
- No timezone information is shown for any `timestamp` column.
- Schema version, owning database, and database engine are not shown.

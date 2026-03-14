# EX Group Customer OS — Database Schema

## Overview
All tables use UUID primary keys, `created_at` (timestamptz), and `updated_at` (timestamptz).
Soft deletes use `deleted_at` (timestamptz, nullable).
All customer-facing tables include `brand_id` for multi-brand filtering.
All amounts stored in cents (integer). Never use float for money.

---

## Entity Relationship

```
brands ──< outlets ──< stylists ──< stylist_schedules
                │           │
                │           └──< bookings >── services
                │                   │
customers ──< customer_brand_memberships    │
    │                                       │
    ├──< customer_preferences               │
    ├──< wallets ──< wallet_ledger          │
    ├──< stamp_cards                        │
    ├──< loyalty_ledger                     │
    └──< transactions >────────────────────-┘

admin_users ──< audit_log
campaigns ──< campaign_events
customer_segments ──< customer_segment_members
```

---

## Tables by Agent

### LENNY (Auth & Identity)

#### `brands`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| code | text | UNIQUE, one of: ex_style, ex_beauty, uhair, coulisse |
| name | text | Display name |
| type | text | hair_salon, beauty, scalp_specialist |
| logo_url | text | |
| primary_color | text | Hex color |
| accent_color | text | Hex color |
| created_at | timestamptz | |

#### `customers`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| auth_user_id | uuid | FK → auth.users, UNIQUE |
| phone | text | E.164 format, UNIQUE |
| email | text | nullable |
| display_name | text | |
| avatar_url | text | nullable |
| preferred_language | text | en, ms, zh |
| referral_code | text | UNIQUE, 6-char |
| marketing_consent | boolean | default false |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| deleted_at | timestamptz | nullable |

RLS: Customers can SELECT/UPDATE only their own row. INSERT via signup trigger.

#### `customer_brand_memberships`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| customer_id | uuid | FK → customers |
| brand_id | uuid | FK → brands |
| membership_tier | text | bronze, silver, gold, platinum |
| total_points | integer | default 0 |
| first_visit_at | timestamptz | nullable |
| last_visit_at | timestamptz | nullable |
| total_visits | integer | default 0 |
| created_at | timestamptz | |

UNIQUE(customer_id, brand_id)

#### `customer_preferences`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| customer_id | uuid | FK → customers, UNIQUE |
| preferred_outlet_id | uuid | nullable, FK → outlets |
| preferred_stylist_id | uuid | nullable, FK → stylists |
| hair_type | text | nullable |
| skin_type | text | nullable |
| notes | text | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

### MIKHAIL (Booking)

#### `outlets`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| brand_id | uuid | FK → brands |
| name | text | |
| address | text | |
| city | text | |
| country | text | MY or SG |
| lat | decimal | |
| lng | decimal | |
| phone | text | |
| operating_hours | jsonb | See OperatingHours type |
| is_active | boolean | default true |
| created_at | timestamptz | |

#### `services`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| brand_id | uuid | FK → brands |
| name | text | |
| description | text | |
| duration_minutes | integer | |
| buffer_minutes | integer | default 15 |
| price_cents | integer | |
| currency | text | MYR or SGD |
| category | text | haircut, coloring, treatment, etc. |
| is_active | boolean | default true |
| created_at | timestamptz | |

#### `stylists`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| outlet_id | uuid | FK → outlets |
| name | text | |
| avatar_url | text | nullable |
| specialties | text[] | array |
| bio | text | nullable |
| is_active | boolean | default true |
| created_at | timestamptz | |

#### `stylist_schedules`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| stylist_id | uuid | FK → stylists |
| day_of_week | integer | 0=Sun, 6=Sat |
| start_time | time | |
| end_time | time | |
| is_available | boolean | default true |

UNIQUE(stylist_id, day_of_week)

#### `bookings`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| customer_id | uuid | FK → customers |
| outlet_id | uuid | FK → outlets |
| stylist_id | uuid | nullable, FK → stylists |
| service_id | uuid | FK → services |
| booking_date | date | |
| start_time | time | |
| end_time | time | calculated: start_time + duration + buffer |
| status | text | pending, confirmed, in_progress, completed, cancelled, no_show |
| notes | text | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| cancelled_at | timestamptz | nullable |
| cancellation_reason | text | nullable |

INDEX on (stylist_id, booking_date, start_time) for conflict detection.

---

### PATRICK (Payments & Wallet)

#### `wallets`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| customer_id | uuid | FK → customers |
| currency | text | MYR or SGD |
| created_at | timestamptz | |

UNIQUE(customer_id, currency). Balance = SUM(wallet_ledger.amount_cents).

#### `wallet_ledger`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| wallet_id | uuid | FK → wallets |
| entry_type | text | topup, topup_bonus, payment, refund, adjustment, expiry |
| amount_cents | integer | positive=credit, negative=debit |
| currency | text | MYR or SGD |
| reference_type | text | nullable (booking, topup, etc.) |
| reference_id | uuid | nullable |
| description | text | |
| stripe_payment_intent_id | text | nullable |
| idempotency_key | text | UNIQUE |
| created_at | timestamptz | |

APPEND-ONLY. Never update or delete rows.

#### `transactions`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| customer_id | uuid | FK → customers |
| booking_id | uuid | nullable, FK → bookings |
| outlet_id | uuid | FK → outlets |
| payment_method | text | wallet, card, cash, mixed |
| subtotal_cents | integer | |
| discount_cents | integer | default 0 |
| total_cents | integer | |
| currency | text | MYR or SGD |
| status | text | pending, completed, refunded, failed |
| receipt_url | text | nullable |
| created_at | timestamptz | |

#### `packages`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| brand_id | uuid | FK → brands |
| name | text | |
| description | text | |
| sessions_total | integer | |
| price_cents | integer | |
| currency | text | |
| is_active | boolean | default true |
| created_at | timestamptz | |

#### `customer_packages`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| customer_id | uuid | FK → customers |
| package_id | uuid | FK → packages |
| sessions_remaining | integer | |
| purchased_at | timestamptz | |
| expires_at | timestamptz | nullable |

---

### YUKAI (Loyalty & Gamification)

#### `loyalty_ledger`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| customer_id | uuid | FK → customers |
| brand_id | uuid | FK → brands |
| entry_type | text | earn_booking, earn_referral, earn_streak, earn_birthday, earn_cross_brand, redeem, expire, adjust |
| points | integer | |
| stamps | integer | |
| reference_type | text | nullable |
| reference_id | uuid | nullable |
| description | text | |
| created_at | timestamptz | |

APPEND-ONLY.

#### `stamp_cards`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| customer_id | uuid | FK → customers |
| brand_id | uuid | FK → brands |
| card_type | text | |
| stamps_collected | integer | default 0 |
| stamps_required | integer | |
| is_completed | boolean | default false |
| reward_claimed | boolean | default false |
| created_at | timestamptz | |
| completed_at | timestamptz | nullable |

#### `loyalty_tiers`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| brand_id | uuid | FK → brands |
| tier_name | text | bronze, silver, gold, platinum |
| min_points | integer | |
| benefits | jsonb | |
| created_at | timestamptz | |

#### `rewards`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| brand_id | uuid | FK → brands |
| name | text | |
| description | text | |
| points_cost | integer | |
| stamps_cost | integer | |
| reward_type | text | discount, free_service, product, upgrade |
| is_active | boolean | default true |
| created_at | timestamptz | |

---

### ANDREW (CRM & Intelligence)

#### `customer_health_scores`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| customer_id | uuid | FK → customers |
| score | integer | 0-100 |
| recency_score | integer | |
| frequency_score | integer | |
| monetary_score | integer | |
| risk_level | text | healthy, cooling, at_risk, churning, churned |
| calculated_at | timestamptz | |

#### `customer_segments`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | |
| description | text | |
| criteria | jsonb | |
| is_dynamic | boolean | default true |
| created_at | timestamptz | |

#### `customer_segment_members`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| segment_id | uuid | FK → customer_segments |
| customer_id | uuid | FK → customers |
| entered_at | timestamptz | |
| exited_at | timestamptz | nullable |

#### `campaigns`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | |
| segment_id | uuid | FK → customer_segments |
| channel | text | push, email, sms, whatsapp |
| message_template | text | |
| offer | jsonb | nullable |
| status | text | draft, scheduled, sent, completed |
| scheduled_at | timestamptz | nullable |
| sent_at | timestamptz | nullable |
| created_at | timestamptz | |

#### `campaign_events`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| campaign_id | uuid | FK → campaigns |
| customer_id | uuid | FK → customers |
| event_type | text | sent, delivered, opened, clicked, converted, unsubscribed |
| metadata | jsonb | nullable |
| created_at | timestamptz | |

---

### COO (Admin & Ops)

#### `admin_users`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| auth_user_id | uuid | FK → auth.users |
| email | text | UNIQUE |
| display_name | text | |
| role | text | hq_admin, brand_manager, outlet_manager, staff |
| brand_id | uuid | nullable, FK → brands |
| outlet_id | uuid | nullable, FK → outlets |
| is_active | boolean | default true |
| created_at | timestamptz | |

#### `audit_log`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| admin_user_id | uuid | FK → admin_users |
| action | text | e.g. update_service, cancel_booking |
| entity_type | text | e.g. service, booking, customer |
| entity_id | uuid | |
| changes | jsonb | before/after diff |
| ip_address | text | |
| created_at | timestamptz | |

APPEND-ONLY. Never update or delete.

#### `daily_reports`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| outlet_id | uuid | FK → outlets |
| report_date | date | |
| total_bookings | integer | |
| completed_bookings | integer | |
| cancellations | integer | |
| walk_ins | integer | |
| revenue_cents | integer | |
| currency | text | |
| avg_rating | decimal | nullable |
| created_at | timestamptz | |

UNIQUE(outlet_id, report_date)

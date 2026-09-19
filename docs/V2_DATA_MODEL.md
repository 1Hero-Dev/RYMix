# RYM V2 Data Model & Schema Extensions

This document defines the schema additions and relational models introduced in RYM V2 on top of the V1 PostgreSQL database.

---

## 1. New & Extended Entities

### 1.1 `delivery_batches`
Represents a grouped delivery assignment for a courier.
```sql
CREATE TABLE delivery_batches (
    id VARCHAR(64) PRIMARY KEY,
    courier_id VARCHAR(64) REFERENCES couriers(id),
    status VARCHAR(32) NOT NULL DEFAULT 'FORMED', -- FORMED, OFFERED, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED
    total_distance_meters INTEGER NOT NULL,
    estimated_duration_minutes INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE batch_stops (
    id VARCHAR(64) PRIMARY KEY,
    batch_id VARCHAR(64) NOT NULL REFERENCES delivery_batches(id) ON DELETE CASCADE,
    order_id VARCHAR(64) NOT NULL REFERENCES orders(id),
    stop_type VARCHAR(16) NOT NULL, -- 'PICKUP' | 'DROPOFF'
    sequence_number INTEGER NOT NULL,
    location_name VARCHAR(128) NOT NULL,
    address TEXT NOT NULL,
    lat NUMERIC(9,6) NOT NULL,
    lng NUMERIC(9,6) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_arrival_minutes INTEGER NOT NULL
);
```

### 1.2 `promotions` & `coupons`
```sql
CREATE TABLE coupons (
    code VARCHAR(32) PRIMARY KEY,
    description TEXT NOT NULL,
    discount_type VARCHAR(16) NOT NULL, -- 'PERCENTAGE', 'FIXED_DZD', 'FREE_DELIVERY'
    discount_value NUMERIC(10,2) NOT NULL,
    min_spend_dzd NUMERIC(10,2) NOT NULL DEFAULT 0,
    max_discount_dzd NUMERIC(10,2),
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    usage_limit_per_user INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 1.3 `loyalty_accounts` & `loyalty_transactions`
```sql
CREATE TABLE loyalty_accounts (
    user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id),
    balance_points INTEGER NOT NULL DEFAULT 0,
    lifetime_points INTEGER NOT NULL DEFAULT 0,
    tier VARCHAR(32) NOT NULL DEFAULT 'BRONZE',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE loyalty_transactions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES loyalty_accounts(user_id),
    type VARCHAR(32) NOT NULL, -- 'EARN_PURCHASE', 'REDEEM_CHECKOUT', 'BONUS_SIGNUP'
    points_delta INTEGER NOT NULL,
    order_id VARCHAR(64) REFERENCES orders(id),
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 1.4 `municipal_zones`
```sql
CREATE TABLE municipal_zones (
    zone_id VARCHAR(64) PRIMARY KEY,
    commune_code VARCHAR(8) NOT NULL,
    commune_name VARCHAR(64) NOT NULL,
    wilaya_code VARCHAR(4) NOT NULL DEFAULT '43',
    wilaya_name VARCHAR(64) NOT NULL DEFAULT 'Mila',
    base_delivery_fee_dzd NUMERIC(10,2) NOT NULL DEFAULT 100,
    free_delivery_threshold_dzd NUMERIC(10,2) NOT NULL DEFAULT 2500,
    max_service_radius_meters INTEGER NOT NULL DEFAULT 3000,
    is_active BOOLEAN DEFAULT TRUE,
    center_lat NUMERIC(9,6) NOT NULL,
    center_lng NUMERIC(9,6) NOT NULL
);
```

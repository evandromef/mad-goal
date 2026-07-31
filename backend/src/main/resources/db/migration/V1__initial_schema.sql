create table app_user (
    id uuid primary key,
    name varchar(120) not null,
    email varchar(180) not null unique,
    password_hash varchar(255) not null,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null
);

create table asset (
    id uuid primary key,
    ticker varchar(12) not null unique,
    name varchar(180) not null,
    category varchar(20) not null,
    active boolean not null,
    current_price numeric(19,6),
    price_date date
);

create table wallet (
    id uuid primary key,
    user_id uuid not null references app_user(id) on delete cascade,
    name varchar(80) not null,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    constraint uk_wallet_user_name unique (user_id, name)
);

create table ledger_record (
    id uuid primary key,
    wallet_id uuid not null references wallet(id) on delete cascade,
    asset_id uuid not null references asset(id),
    type varchar(30) not null,
    event_date date not null,
    quantity numeric(19,6),
    unit_price numeric(19,6),
    fees numeric(19,6),
    total_value numeric(19,6),
    new_quantity numeric(19,6),
    ratio varchar(30),
    description varchar(500),
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null
);
create index idx_record_wallet_asset_date on ledger_record(wallet_id, asset_id, event_date);

create table asset_note (
    id uuid primary key,
    wallet_id uuid not null references wallet(id) on delete cascade,
    asset_id uuid not null references asset(id),
    content varchar(2000) not null,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null
);
create index idx_note_wallet_asset on asset_note(wallet_id, asset_id);


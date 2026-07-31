alter table asset alter column current_price type numeric(19,8);
alter table ledger_record alter column quantity type numeric(19,8);
alter table ledger_record alter column unit_price type numeric(19,8);
alter table ledger_record alter column fees type numeric(19,8);
alter table ledger_record alter column total_value type numeric(19,8);
alter table ledger_record alter column new_quantity type numeric(19,8);

alter table app_user add column email_verified boolean not null default true;
alter table app_user add column google_subject varchar(255);
alter table app_user add constraint uk_user_google_subject unique (google_subject);

create table account_token (
    id uuid primary key,
    user_id uuid not null references app_user(id) on delete cascade,
    token_hash varchar(64) not null unique,
    type varchar(30) not null,
    expires_at timestamp with time zone not null,
    used_at timestamp with time zone,
    created_at timestamp with time zone not null
);
create index idx_account_token_user_type on account_token(user_id, type);

create table refresh_token (
    id uuid primary key,
    user_id uuid not null references app_user(id) on delete cascade,
    token_hash varchar(64) not null unique,
    expires_at timestamp with time zone not null,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone not null
);
create index idx_refresh_token_user on refresh_token(user_id);


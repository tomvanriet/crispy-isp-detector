-- Run this in the Supabase SQL Editor to set up the database.

-- Collectors: one row per machine running the agent
create table collectors (
    id         uuid default gen_random_uuid() primary key,
    name       text not null unique,
    isp        text,
    location   text,
    created_at timestamptz default now()
);

-- Ping probes (one row per target per round)
create table ping_results (
    id               bigint generated always as identity primary key,
    collector_id     uuid references collectors(id) not null,
    target_host      text not null,
    target_label     text,
    target_region    text,
    rtt_min          double precision,
    rtt_avg          double precision,
    rtt_max          double precision,
    rtt_mdev         double precision,
    packet_loss      double precision,
    packets_sent     int,
    packets_received int,
    created_at       timestamptz default now()
);

-- Traceroute hops (one row per hop per target per run)
create table traceroute_results (
    id             bigint generated always as identity primary key,
    collector_id   uuid references collectors(id) not null,
    target_host    text not null,
    target_label   text,
    target_region  text,
    hop_number     int not null,
    hop_ip         text,
    hop_hostname   text,
    rtt_avg        double precision,
    packet_loss    double precision,
    created_at     timestamptz default now()
);

-- Speed tests (one row per test)
create table speed_results (
    id             bigint generated always as identity primary key,
    collector_id   uuid references collectors(id) not null,
    download_mbps  double precision,
    upload_mbps    double precision,
    ping_ms        double precision,
    server_name    text,
    created_at     timestamptz default now()
);

-- Indexes for time-series queries
create index idx_ping_time       on ping_results (created_at desc);
create index idx_ping_collector  on ping_results (collector_id, created_at desc);
create index idx_trace_time      on traceroute_results (created_at desc);
create index idx_trace_collector on traceroute_results (collector_id, created_at desc);
create index idx_speed_time      on speed_results (created_at desc);
create index idx_speed_collector on speed_results (collector_id, created_at desc);

-- Row Level Security: allow inserts with the anon key
alter table collectors          enable row level security;
alter table ping_results        enable row level security;
alter table traceroute_results  enable row level security;
alter table speed_results       enable row level security;

create policy "Allow all for anon" on collectors         for all using (true) with check (true);
create policy "Allow all for anon" on ping_results       for all using (true) with check (true);
create policy "Allow all for anon" on traceroute_results for all using (true) with check (true);
create policy "Allow all for anon" on speed_results      for all using (true) with check (true);

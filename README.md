# Crispy ISP Detector

Distributed ISP quality monitor. Run a collector on your home machine or Raspberry Pi to continuously measure your ISP connection and push the data to a shared dashboard — giving them nowhere to hide.

## What It Measures

| Metric | Frequency | Method |
|--------|-----------|--------|
| RTT (min/avg/max), jitter, packet loss | Every 60s | ICMP ping to 9 targets across all continents |
| Traceroute hops with per-hop RTT & loss | Every 15min | mtr (preferred) or traceroute |
| Download & upload bandwidth | Every 30min | speedtest-cli |

## Quick Start

### Docker (recommended)

```bash
git clone https://github.com/tomvanriet/crispy-isp-detector.git && cd crispy-isp-detector
cp .env.example .env
```

Edit `.env` with your details:

```
SUPABASE_URL=<ask the group for this>
SUPABASE_KEY=<ask the group for this>
COLLECTOR_NAME=tom-home            # pick something unique
COLLECTOR_ISP=Your ISP
COLLECTOR_LOCATION=16 Marx Street, Fibre Monopoly Estate
```

Then start the collector:

```bash
docker compose up -d
```

### Raspberry Pi / Bare Metal

```bash
git clone https://github.com/tomvanriet/crispy-isp-detector.git && cd crispy-isp-detector
./setup.sh
```

The setup script installs [uv](https://docs.astral.sh/uv/), syncs dependencies, and optionally installs a systemd (Linux) or launchd (macOS) service so it runs on boot.

### Manual

```bash
uv sync
cp .env.example .env   # fill in values
uv run crispy-isp-detector
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Shared project URL (ask the group) |
| `SUPABASE_KEY` | Shared API key (ask the group) |
| `COLLECTOR_NAME` | A unique name for your collector, e.g. `tom-home` |
| `COLLECTOR_ISP` | Your ISP — defaults to `Your ISP` |
| `COLLECTOR_LOCATION` | Your home address, e.g. `16 Marx Street, Fibre Monopoly Estate` |

## Viewing the Dashboard

The shared Grafana dashboard is available at a link provided by the group. It shows:

- RTT and packet loss over time (filterable by collector and region)
- Speed test trends
- Average RTT by continent
- Latest traceroute hops per collector

## Configuration

You shouldn't need to change anything, but if you want to tweak intervals or add custom targets, edit [`config.yaml`](config.yaml):

```yaml
ping:
  count: 5         # ICMP packets per probe
  interval: 60     # seconds between rounds

traceroute:
  enabled: true
  interval: 900    # 15 minutes

speedtest:
  enabled: true
  interval: 1800   # 30 minutes

targets:
  - host: "1.1.1.1"
    label: "Cloudflare DNS"
    region: "Global"
  # ... see config.yaml for full list
```

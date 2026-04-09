#!/usr/bin/env bash
set -euo pipefail

echo "=== Crispy ISP Dector Setup ==="
echo ""

if ! command -v uv &>/dev/null; then
    echo "Installing uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.local/bin:$PATH"
fi

echo "Installing Python dependencies..."
uv sync

if [ ! -f .env ]; then
    cp .env.example .env
    echo ""
    echo "Created .env from template — edit it now:"
    echo "  nano .env"
    echo ""
    echo "Required values:"
    echo "  SUPABASE_URL      Your Supabase project URL"
    echo "  SUPABASE_KEY      Your Supabase anon/public key"
    echo "  COLLECTOR_NAME    Unique name for this collector"
    echo ""
    echo "Then re-run: ./setup.sh"
    exit 0
fi

source .env
if [ -z "${SUPABASE_URL:-}" ] || [ "${SUPABASE_URL}" = "https://your-project.supabase.co" ]; then
    echo "ERROR: Set SUPABASE_URL in .env" && exit 1
fi
if [ -z "${SUPABASE_KEY:-}" ] || [ "${SUPABASE_KEY}" = "your-anon-key" ]; then
    echo "ERROR: Set SUPABASE_KEY in .env" && exit 1
fi

echo "Config valid ✓"

echo "Registering collector..."
uv run python -c "
from collector.supabase_client import SupabaseClient
c = SupabaseClient()
cid = c.register_collector()
print(f'Registered: {cid}')
"

if [ "$(uname)" = "Linux" ]; then
    echo ""
    read -rp "Install as systemd service? [y/N] " ans
    if [[ "${ans,,}" == "y" ]]; then
        DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
        UV="$(which uv)"

        sudo tee /etc/systemd/system/crispy-isp-detector.service >/dev/null <<EOF
[Unit]
Description=Crispy ISP Dector – ISP Quality Monitor
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$DIR
ExecStart=$UV run crispy-isp-detector
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
        sudo systemctl daemon-reload
        sudo systemctl enable --now crispy-isp-detector
        echo "Service started ✓"
        echo "  Status: sudo systemctl status crispy-isp-detector"
        echo "  Logs:   sudo journalctl -u crispy-isp-detector -f"
    fi
fi

if [ "$(uname)" = "Darwin" ]; then
    echo ""
    read -rp "Install as launchd service? [y/N] " ans
    if [[ "${ans,,}" == "y" ]]; then
        DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
        UV="$(which uv)"
        PLIST="$HOME/Library/LaunchAgents/com.crispy-isp-detector.plist"

        cat >"$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.crispy-isp-detector</string>
    <key>WorkingDirectory</key>
    <string>$DIR</string>
    <key>ProgramArguments</key>
    <array>
        <string>$UV</string>
        <string>run</string>
        <string>crispy-isp-detector</string>
    </array>
    <key>RunAtLoad</key>   <true/>
    <key>KeepAlive</key>   <true/>
    <key>StandardOutPath</key>
    <string>$DIR/collector.log</string>
    <key>StandardErrorPath</key>
    <string>$DIR/collector.err</string>
</dict>
</plist>
EOF
        launchctl load "$PLIST"
        echo "Service started ✓"
        echo "  Logs: tail -f $DIR/collector.log"
    fi
fi

echo ""
echo "To run manually:  uv run crispy-isp-detector"
echo "With Docker:      docker compose up -d"
echo ""
echo "Done!"

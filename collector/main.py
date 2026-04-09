"""Crispy ISP Dector - Distributed ISP Quality Monitor."""

import logging
import signal
import sys
import time
from pathlib import Path

import yaml
from dotenv import load_dotenv

from collector.ping import run_all_pings
from collector.speedtest_runner import run_speed_test
from collector.traceroute import run_all_traceroutes
from collector.supabase_client import SupabaseClient

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("crispy-isp-detector")

running = True


def _shutdown(sig, frame):
    global running
    log.info("Shutting down...")
    running = False


def load_config() -> dict:
    config_path = Path(__file__).parent.parent / "config.yaml"
    with open(config_path) as f:
        return yaml.safe_load(f)


def main():
    load_dotenv()
    signal.signal(signal.SIGINT, _shutdown)
    signal.signal(signal.SIGTERM, _shutdown)

    config = load_config()
    client = SupabaseClient()
    collector_id = client.register_collector()

    targets = config["targets"]
    ping_interval = config["ping"]["interval"]
    traceroute_cfg = config.get("traceroute", {})
    speedtest_cfg = config.get("speedtest", {})

    log.info(f"Collector registered: {collector_id}")
    log.info(f"Monitoring {len(targets)} targets every {ping_interval}s")

    last_traceroute = 0
    last_speedtest = 0

    while running:
        results = run_all_pings(targets, config["ping"])
        if results:
            try:
                client.insert_ping_results(collector_id, results)
                log.info(f"Recorded {len(results)} ping probes")
            except Exception as e:
                log.error(f"Failed to push ping results: {e}")

        now = time.time()

        if traceroute_cfg.get("enabled") and (now - last_traceroute) >= traceroute_cfg.get("interval", 900):
            try:
                hops = run_all_traceroutes(targets, traceroute_cfg)
                if hops:
                    client.insert_traceroute_results(collector_id, hops)
                    log.info(f"Recorded {len(hops)} traceroute hops")
            except Exception as e:
                log.error(f"Traceroute failed: {e}")
            last_traceroute = time.time()

        if speedtest_cfg.get("enabled") and (now - last_speedtest) >= speedtest_cfg.get("interval", 1800):
            try:
                result = run_speed_test()
                if result:
                    client.insert_speed_result(collector_id, result)
                    log.info(f"Speed: ↓{result['download_mbps']:.1f} ↑{result['upload_mbps']:.1f} Mbps")
            except Exception as e:
                log.error(f"Speed test failed: {e}")
            last_speedtest = time.time()

        for _ in range(ping_interval):
            if not running:
                break
            time.sleep(1)

    log.info("Stopped.")

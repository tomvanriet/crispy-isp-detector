"""Traceroute via mtr (preferred) or traceroute fallback."""

import json
import logging
import re
import shutil
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed

log = logging.getLogger("crispy-isp-detector")


def run_traceroute(target: dict, config: dict) -> list[dict] | None:
    """Run a traceroute to a target, returning per-hop results."""
    if shutil.which("mtr"):
        return _run_mtr(target, config)
    if shutil.which("traceroute"):
        return _run_traceroute(target, config)
    log.warning("Neither mtr nor traceroute found — install mtr-tiny")
    return None


def _run_mtr(target: dict, config: dict) -> list[dict] | None:
    host = target["host"]
    count = config.get("count", 5)
    try:
        proc = subprocess.run(
            ["mtr", "--report", "--json", "-c", str(count), host],
            capture_output=True,
            text=True,
            timeout=120,
        )
        data = json.loads(proc.stdout)
        hops = []
        for hub in data["report"]["hubs"]:
            hops.append({
                "target_host": host,
                "target_label": target.get("label", host),
                "target_region": target.get("region", "Unknown"),
                "hop_number": hub["count"],
                "hop_ip": hub.get("host", "???"),
                "hop_hostname": hub.get("host", "???"),
                "rtt_avg": hub.get("Avg"),
                "packet_loss": hub.get("Loss%"),
            })
        return hops
    except (subprocess.TimeoutExpired, json.JSONDecodeError, KeyError) as e:
        log.warning(f"mtr to {host} failed: {e}")
        return None


def _run_traceroute(target: dict, config: dict) -> list[dict] | None:
    """Fallback: parse standard traceroute output."""
    host = target["host"]
    try:
        proc = subprocess.run(
            ["traceroute", "-n", "-w", "3", "-q", "3", host],
            capture_output=True,
            text=True,
            timeout=120,
        )
        hops = []
        for line in proc.stdout.strip().splitlines()[1:]:
            match = re.match(r"\s*(\d+)\s+(.+)", line)
            if not match:
                continue
            hop_num = int(match.group(1))
            rest = match.group(2)

            ip_match = re.search(r"(\d+\.\d+\.\d+\.\d+)", rest)
            rtt_match = re.search(r"([\d.]+)\s*ms", rest)
            hop_ip = ip_match.group(1) if ip_match else "* * *"
            rtt_avg = float(rtt_match.group(1)) if rtt_match else None

            hops.append({
                "target_host": host,
                "target_label": target.get("label", host),
                "target_region": target.get("region", "Unknown"),
                "hop_number": hop_num,
                "hop_ip": hop_ip,
                "hop_hostname": hop_ip,
                "rtt_avg": rtt_avg,
                "packet_loss": None,
            })
        return hops if hops else None
    except (subprocess.TimeoutExpired, FileNotFoundError) as e:
        log.warning(f"traceroute to {host} failed: {e}")
        return None


def run_all_traceroutes(targets: list[dict], config: dict) -> list[dict]:
    """Run traceroutes to all targets concurrently."""
    all_hops = []
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = {pool.submit(run_traceroute, t, config): t for t in targets}
        for future in as_completed(futures):
            hops = future.result()
            if hops:
                all_hops.extend(hops)
    return all_hops

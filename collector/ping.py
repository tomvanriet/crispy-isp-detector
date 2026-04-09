"""ICMP ping probe — works on Linux and macOS."""

import platform
import re
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed


def run_ping_probe(target: dict, config: dict) -> dict | None:
    host = target["host"]
    count = config.get("count", 5)
    timeout = config.get("timeout", 10)

    system = platform.system()
    if system == "Darwin":
        cmd = ["ping", "-c", str(count), "-W", str(timeout * 1000), host]
    else:
        cmd = ["ping", "-c", str(count), "-W", str(timeout), host]

    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout * count + 10)
        return _parse_output(proc.stdout, target)
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return _timeout_result(target, count)


def _timeout_result(target: dict, count: int) -> dict:
    return {
        "target_host": target["host"],
        "target_label": target.get("label", target["host"]),
        "target_region": target.get("region", "Unknown"),
        "packet_loss": 100.0,
        "packets_sent": count,
        "packets_received": 0,
        "rtt_min": None,
        "rtt_avg": None,
        "rtt_max": None,
        "rtt_mdev": None,
    }


def _parse_output(output: str, target: dict) -> dict:
    loss = re.search(r"([\d.]+)% packet loss", output)
    packet_loss = float(loss.group(1)) if loss else 100.0

    pkts = re.search(r"(\d+) packets? transmitted, (\d+) (?:packets? )?received", output)
    packets_sent = int(pkts.group(1)) if pkts else 0
    packets_received = int(pkts.group(2)) if pkts else 0

    rtt = re.search(
        r"(?:round-trip|rtt) min/avg/max/(?:stddev|mdev) = "
        r"([\d.]+)/([\d.]+)/([\d.]+)/([\d.]+)",
        output,
    )
    if rtt:
        rtt_min, rtt_avg, rtt_max, rtt_mdev = (float(rtt.group(i)) for i in range(1, 5))
    else:
        rtt_min = rtt_avg = rtt_max = rtt_mdev = None

    return {
        "target_host": target["host"],
        "target_label": target.get("label", target["host"]),
        "target_region": target.get("region", "Unknown"),
        "packet_loss": packet_loss,
        "packets_sent": packets_sent,
        "packets_received": packets_received,
        "rtt_min": rtt_min,
        "rtt_avg": rtt_avg,
        "rtt_max": rtt_max,
        "rtt_mdev": rtt_mdev,
    }


def run_all_pings(targets: list[dict], config: dict) -> list[dict]:
    results = []
    with ThreadPoolExecutor(max_workers=len(targets)) as pool:
        futures = {pool.submit(run_ping_probe, t, config): t for t in targets}
        for future in as_completed(futures):
            result = future.result()
            if result:
                results.append(result)
    return results

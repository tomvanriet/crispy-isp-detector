"""Bandwidth speed test via speedtest-cli."""

import logging

log = logging.getLogger("crispy-isp-detector")


def run_speed_test() -> dict | None:
    try:
        import speedtest
    except ImportError:
        log.warning("speedtest-cli not installed — skipping")
        return None

    log.info("Running speed test...")
    st = speedtest.Speedtest()
    st.get_best_server()
    st.download()
    st.upload()
    r = st.results.dict()

    return {
        "download_mbps": round(r["download"] / 1_000_000, 2),
        "upload_mbps": round(r["upload"] / 1_000_000, 2),
        "ping_ms": round(r["ping"], 2),
        "server_name": r["server"]["sponsor"],
    }

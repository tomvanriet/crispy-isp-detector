"""Thin Supabase REST API client — no heavy SDK needed."""

import logging
import os

import httpx

log = logging.getLogger("crispy-isp-detector")


class SupabaseClient:
    def __init__(self):
        self.url = os.environ["SUPABASE_URL"].rstrip("/")
        self.key = os.environ["SUPABASE_KEY"]
        self.rest = f"{self.url}/rest/v1"
        self.headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
        }
        self._name = os.environ.get("COLLECTOR_NAME", "default")
        self._isp = os.environ.get("COLLECTOR_ISP", "")
        self._location = os.environ.get("COLLECTOR_LOCATION", "")

    def register_collector(self) -> str:
        """Upsert this collector by name and return its UUID."""
        resp = httpx.post(
            f"{self.rest}/collectors?on_conflict=name",
            headers={**self.headers, "Prefer": "return=representation,resolution=merge-duplicates"},
            json={
                "name": self._name,
                "isp": self._isp,
                "location": self._location,
            },
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()[0]["id"]

    def insert_ping_results(self, collector_id: str, results: list[dict]):
        rows = [{"collector_id": collector_id, **r} for r in results]
        resp = httpx.post(
            f"{self.rest}/ping_results",
            headers={**self.headers, "Prefer": "return=minimal"},
            json=rows,
            timeout=30,
        )
        resp.raise_for_status()

    def insert_traceroute_results(self, collector_id: str, hops: list[dict]):
        rows = [{"collector_id": collector_id, **h} for h in hops]
        resp = httpx.post(
            f"{self.rest}/traceroute_results",
            headers={**self.headers, "Prefer": "return=minimal"},
            json=rows,
            timeout=30,
        )
        resp.raise_for_status()

    def insert_speed_result(self, collector_id: str, result: dict):
        resp = httpx.post(
            f"{self.rest}/speed_results",
            headers={**self.headers, "Prefer": "return=minimal"},
            json={"collector_id": collector_id, **result},
            timeout=30,
        )
        resp.raise_for_status()

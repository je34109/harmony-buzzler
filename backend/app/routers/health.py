from fastapi import APIRouter
import socket
import urllib.request

router = APIRouter()


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.get("/health/network")
async def network_check():
    """Diagnose network connectivity from the container."""
    results = {}

    # DNS test
    for host in ["youtube.com", "www.youtube.com", "google.com"]:
        try:
            ip = socket.gethostbyname(host)
            results[f"dns_{host}"] = ip
        except Exception as e:
            results[f"dns_{host}"] = f"FAILED: {e}"

    # HTTP test
    try:
        req = urllib.request.urlopen("https://www.google.com", timeout=5)
        results["http_google"] = f"OK ({req.status})"
    except Exception as e:
        results["http_google"] = f"FAILED: {e}"

    # Check /etc/resolv.conf
    try:
        with open("/etc/resolv.conf") as f:
            results["resolv_conf"] = f.read().strip()
    except Exception as e:
        results["resolv_conf"] = f"FAILED: {e}"

    return results

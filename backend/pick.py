"""Pick a SerpApi engine and DaisyUI components for a query.

Starts the Jev MCP server (npx @jkudish/jev-mcp) and calls jev_find twice:
once over the SerpApi catalog, once over the DaisyUI catalog. Prints the picks.
Does not call SerpApi.

Usage:
    python pick.py "coffee shops near Koramangala"

Reads JEV_KEY from backend/.env and passes it to the Jev server as TYPESAFE_API_KEY.
OPENROUTER_API_KEY in the environment works as well.
"""

import json
import os
import shutil
import subprocess
import sys
import threading
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SERP_TOP = 1
DAISY_TOP = 3


def load_dotenv():
    """Load backend/.env, then the repo root .env. Does not override existing vars."""
    for path in (ROOT / ".env", ROOT.parent / ".env"):
        if not path.exists():
            continue
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip("\"'"))
    # backend/.env stores the Jev key as JEV_KEY. The MCP server reads TYPESAFE_API_KEY.
    if not os.environ.get("TYPESAFE_API_KEY"):
        for name in ("JEV_KEY", "JEV_API", "JEV_API_KEY"):
            if os.environ.get(name):
                os.environ["TYPESAFE_API_KEY"] = os.environ[name]
                break


def candidates(path):
    data = json.loads(path.read_text(encoding="utf-8"))
    rows = []
    for tool in data["tools"]:
        fn = tool["function"]
        rows.append({"id": fn["name"], "text": fn["description"][:500]})
    return rows


class JevMcp:
    def __init__(self):
        npx = shutil.which("npx")
        if not npx:
            sys.exit("npx is not on PATH. Node.js is required to run the Jev MCP server.")
        self.err = []
        self.proc = subprocess.Popen(
            [npx, "-y", "@jkudish/jev-mcp"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace",
            env={**os.environ, "NO_UPDATE_NOTIFIER": "1", "npm_config_loglevel": "error"},
        )
        threading.Thread(target=self._drain, daemon=True).start()
        self._next = 0
        self._request("initialize", {
            "protocolVersion": "2026-07-28",
            "capabilities": {},
            "clientInfo": {"name": "pick", "version": "0.1"},
        })
        self._send({"jsonrpc": "2.0", "method": "notifications/initialized"})

    def _drain(self):
        for line in self.proc.stderr:
            self.err.append(line)

    def _send(self, message):
        self.proc.stdin.write(json.dumps(message, ensure_ascii=False) + "\n")
        self.proc.stdin.flush()

    def _read(self):
        while True:
            line = self.proc.stdout.readline()
            if not line:
                detail = "".join(self.err).strip()
                sys.exit("Jev MCP server closed.\n" + detail)
            line = line.strip()
            if not line:
                continue
            try:
                return json.loads(line)
            except json.JSONDecodeError:
                continue

    def _request(self, method, params):
        self._next += 1
        msg_id = self._next
        self._send({"jsonrpc": "2.0", "id": msg_id, "method": method, "params": params})
        while True:
            message = self._read()
            if message.get("id") != msg_id:
                continue
            if "error" in message:
                sys.exit(f"Jev MCP {method} failed: {message['error']}")
            return message["result"]

    def find(self, query, rows, top_k):
        result = self._request("tools/call", {
            "name": "jev_find",
            "arguments": {"query": query, "candidates": rows, "top_k": top_k},
        })
        content = result.get("content") or []
        text = content[0].get("text", "") if content else ""
        if result.get("isError"):
            sys.exit(text or "Jev MCP tool call failed.")
        return json.loads(text)

    def close(self):
        try:
            self.proc.stdin.close()
        except Exception:
            pass
        try:
            self.proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            self.proc.kill()


def query_from_args():
    query = " ".join(sys.argv[1:]).strip()
    if query:
        return query
    if sys.stdin.isatty():
        return input("Query: ").strip()
    return sys.stdin.read().strip()


def show(heading, found, catalog):
    print(heading)
    if found.get("status") == "invalid_response":
        print("  " + found.get("reason", "Jev returned an invalid response."))
        return
    verdict = found.get("exists_verdict")
    if verdict and verdict != "answered":
        print(f"  match: {verdict}")
    by_id = {row["id"]: row["text"] for row in catalog}
    for hit in found.get("top") or []:
        name = hit["id"]
        probability = hit.get("probability")
        score = f"  {probability:.2f}  " if isinstance(probability, (int, float)) else "  "
        print(f"{score}{name}")
        description = by_id.get(name, hit.get("text", ""))
        print(f"       {description}")


def main():
    load_dotenv()
    if not (os.environ.get("TYPESAFE_API_KEY") or os.environ.get("OPENROUTER_API_KEY")):
        sys.exit("Put JEV_KEY in backend/.env, or set TYPESAFE_API_KEY / OPENROUTER_API_KEY.")
    query = query_from_args()
    if not query:
        sys.exit("Pass a query: python pick.py \"coffee shops near Menlo Park\"")

    serp = candidates(ROOT / "serpapi_tools.json")
    daisy = candidates(ROOT / "daisyui_components.json")
    jev = JevMcp()
    try:
        serp_found = jev.find(query, serp, SERP_TOP)
        daisy_found = jev.find(
            f"Which DaisyUI components should display the results of this search: {query}",
            daisy,
            DAISY_TOP,
        )
    finally:
        jev.close()

    print(query)
    print()
    show("SerpApi", serp_found, serp)
    print()
    show("DaisyUI", daisy_found, daisy)


if __name__ == "__main__":
    main()

"""Jev MCP client. The server reads TYPESAFE_API_KEY; backend/.env stores it as JEV_KEY."""

import json
import os
import shutil
import subprocess
import sys
import threading
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def load_dotenv():
    for path in (ROOT / ".env", ROOT.parent / ".env"):
        if not path.exists():
            continue
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip("\"'"))
    if not os.environ.get("TYPESAFE_API_KEY"):
        for name in ("JEV_KEY", "JEV_API", "JEV_API_KEY"):
            if os.environ.get(name):
                os.environ["TYPESAFE_API_KEY"] = os.environ[name]
                break


class Jev:
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
        threading.Thread(target=lambda: self.err.extend(self.proc.stderr), daemon=True).start()
        self._next = 0
        self._request("initialize", {
            "protocolVersion": "2026-07-28",
            "capabilities": {},
            "clientInfo": {"name": "query", "version": "0.1"},
        })
        self._send({"jsonrpc": "2.0", "method": "notifications/initialized"})

    def _send(self, message):
        self.proc.stdin.write(json.dumps(message, ensure_ascii=False) + "\n")
        self.proc.stdin.flush()

    def _read(self):
        while True:
            line = self.proc.stdout.readline()
            if not line:
                sys.exit("Jev MCP server closed.\n" + "".join(self.err).strip())
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

    def find(self, text, rows, top_k):
        result = self._request("tools/call", {
            "name": "jev_find",
            "arguments": {"query": text, "candidates": rows, "top_k": top_k},
        })
        content = result.get("content") or []
        body = content[0].get("text", "") if content else ""
        if result.get("isError"):
            sys.exit(body or "Jev MCP tool call failed.")
        found = json.loads(body)
        if found.get("status") == "invalid_response":
            sys.exit(found.get("reason") or "Jev returned an invalid response.")
        return [hit["id"] for hit in found.get("top") or []]

    def close(self):
        try:
            self.proc.stdin.close()
            self.proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            self.proc.kill()
        except Exception:
            pass

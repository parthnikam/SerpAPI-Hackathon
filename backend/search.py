"""Call the SerpApi engine chosen for a query and print the results.

Uses the Jev pick from pick.py, then calls that engine in serpapi_tools.json.
The SerpApi key is SERPAPI_KEY in backend/.env.

Usage:
    python search.py "coffee shops near Koramangala"
"""

import json
import os
import urllib.error
import urllib.parse
import urllib.request

from pick import JevMcp, ROOT, candidates, load_dotenv, query_from_args

QUERY_KEYS = ("q", "query", "search_query", "term", "text", "p", "k", "_nkw", "find_desc", "keywords")
FIXED = {"google_maps": {"type": "search"}}
SKIP_PRINT = {"search_metadata", "search_parameters", "serpapi_pagination", "pagination"}


def serpapi_key():
    for name in ("SERPAPI_KEY", "SERPAPI_API_KEY"):
        if os.environ.get(name):
            return os.environ[name]
    return ""


def tool_catalog():
    data = json.loads((ROOT / "serpapi_tools.json").read_text(encoding="utf-8"))
    return {tool["function"]["name"]: tool for tool in data["tools"]}


def choose_engine(query):
    rows = candidates(ROOT / "serpapi_tools.json")
    jev = JevMcp()
    try:
        found = jev.find(query, rows, 1)
    finally:
        jev.close()
    top = (found.get("top") or [None])[0]
    if not top:
        raise SystemExit(found.get("reason") or "Jev did not choose a SerpApi engine.")
    return top["id"], top.get("probability")


def build_params(tool, query):
    name = tool["function"]["name"]
    props = tool["function"]["parameters"]["properties"]
    required = tool["function"]["parameters"].get("required") or []
    params = {"engine": name, **FIXED.get(name, {})}
    for key in QUERY_KEYS:
        if key in props:
            params[key] = query
            break
    if "find_loc" in required and "find_loc" not in params:
        params["find_loc"] = query
    missing = [key for key in required if key not in params]
    return params, missing


def call_serpapi(params, key):
    url = "https://serpapi.com/search.json?" + urllib.parse.urlencode({**params, "api_key": key})
    request = urllib.request.Request(url, headers={"User-Agent": "serpapi-hackathon"})
    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            body = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", "replace")
    return json.loads(body.replace(key, "[redacted]"))


def visible(payload):
    shown = {}
    for key, value in payload.items():
        if key in SKIP_PRINT:
            continue
        shown[key] = value[:5] if isinstance(value, list) else value
    return shown


def search(query):
    """Pick an engine from the tool list, call it, and return the SerpApi payload."""
    load_dotenv()
    key = serpapi_key()
    if not key:
        raise SystemExit("Put SERPAPI_KEY in backend/.env.")
    if not (os.environ.get("TYPESAFE_API_KEY") or os.environ.get("OPENROUTER_API_KEY")):
        raise SystemExit("Put JEV_KEY in backend/.env so the engine can be chosen.")

    engine, probability = choose_engine(query)
    tool = tool_catalog().get(engine)
    if tool is None:
        raise SystemExit(f"Jev chose {engine}, which is not in serpapi_tools.json.")
    params, missing = build_params(tool, query)
    if missing:
        raise SystemExit(
            f"{engine} needs {', '.join(missing)}, which a plain query does not provide."
        )
    payload = call_serpapi(params, key)
    return {"engine": engine, "probability": probability, "params": params, "results": payload}


def main():
    query = query_from_args()
    if not query:
        raise SystemExit('Pass a query: python search.py "coffee shops near Koramangala"')
    found = search(query)
    score = found["probability"]
    score_text = f" ({score:.2f})" if isinstance(score, (int, float)) else ""
    print(f"{found['engine']}{score_text}")
    print(json.dumps(found["params"], indent=2, ensure_ascii=False))
    results = found["results"]
    if results.get("error"):
        print(results["error"])
        raise SystemExit(1)
    print(json.dumps(visible(results), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()

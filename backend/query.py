"""One query: Jev picks a SerpApi engine and DaisyUI components, then SerpApi runs.

Usage:
    python query.py "coffee shops near Koramangala"
"""

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

from jev import Jev, ROOT, load_dotenv

QUERY_KEYS = ("q", "query", "search_query", "term", "text", "p", "k", "_nkw", "find_desc", "keywords")
SKIP = {"search_metadata", "search_parameters", "serpapi_pagination", "pagination"}


def catalog(name):
    data = json.loads((ROOT / name).read_text(encoding="utf-8"))
    tools, rows = {}, []
    for tool in data["tools"]:
        fn = tool["function"]
        tools[fn["name"]] = fn
        rows.append({"id": fn["name"], "text": fn["description"][:500]})
    return tools, rows


def query(text):
    """Pick the engine and components, call SerpApi, and return both."""
    load_dotenv()
    key = os.environ.get("SERPAPI_KEY") or os.environ.get("SERPAPI_API_KEY")
    if not key:
        sys.exit("Put SERPAPI_KEY in backend/.env.")
    if not (os.environ.get("TYPESAFE_API_KEY") or os.environ.get("OPENROUTER_API_KEY")):
        sys.exit("Put JEV_KEY in backend/.env.")

    engines, engine_rows = catalog("serpapi_tools.json")
    _, component_rows = catalog("daisyui_components.json")
    jev = Jev()
    try:
        engines_found = jev.find(text, engine_rows, 1)
        components = jev.find(text, component_rows, 3)
    finally:
        jev.close()
    if not engines_found:
        sys.exit("Jev did not choose a SerpApi engine.")

    engine = engines_found[0]
    fn = engines[engine]
    props = fn["parameters"]["properties"]
    required = fn["parameters"].get("required") or []
    params = {"engine": engine, **({"type": "search"} if engine == "google_maps" else {})}
    for name in QUERY_KEYS:
        if name in props:
            params[name] = text
            break
    if "find_loc" in required:
        params.setdefault("find_loc", text)
    missing = [name for name in required if name not in params]
    if missing:
        sys.exit(f"{engine} needs {', '.join(missing)}.")

    url = "https://serpapi.com/search.json?" + urllib.parse.urlencode({**params, "api_key": key})
    request = urllib.request.Request(url, headers={"User-Agent": "serpapi-hackathon"})
    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            body = response.read().decode()
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", "replace")
    results = json.loads(body.replace(key, "[redacted]"))
    if results.get("error"):
        sys.exit(results["error"])
    shown = {
        field: (value[:5] if isinstance(value, list) else value)
        for field, value in results.items()
        if field not in SKIP
    }
    return {"engine": engine, "components": components, "params": params, "results": shown}


if __name__ == "__main__":
    text = " ".join(sys.argv[1:]).strip() or input("Query: ").strip()
    if not text:
        sys.exit('Pass a query: python query.py "coffee shops near Koramangala"')
    print(json.dumps(query(text), indent=2, ensure_ascii=False))

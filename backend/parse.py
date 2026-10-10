"""Fill SerpApi parameters from a plain-language query with Gemini Flash-Lite."""

import json
import os
import re
import ssl

import certifi

# This conda build crashes while reading the Windows cert store. Load certifi first.
_cafile = certifi.where()
os.environ.setdefault("SSL_CERT_FILE", _cafile)
os.environ.setdefault("REQUESTS_CA_BUNDLE", _cafile)
_create_default_context = ssl.create_default_context


def _create_context(purpose=ssl.Purpose.SERVER_AUTH, *, cafile=None, capath=None, cadata=None):
    if cafile is None and capath is None and cadata is None:
        cafile = _cafile
    return _create_default_context(purpose, cafile=cafile, capath=capath, cadata=cadata)


ssl.create_default_context = _create_context

from google import genai

MODELS = ("gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-2.5-flash-lite")
QUERY_KEYS = ("q", "query", "search_query", "term", "text", "p", "k", "_nkw", "find_desc", "keywords")
SKIP = {
    "api_key",
    "engine",
    "next_page_token",
    "page_token",
    "property_token",
    "departure_token",
    "booking_token",
    "selected_flights_json",
    "multi_city_json",
}


def gemini_key():
    return os.environ.get("GEMINI_KEY") or os.environ.get("GEMINI_API_KEY")


def needs_parse(properties, required):
    """True when the engine wants a date, price, place, or other field the query must be split into."""
    for name in list(required or []) + list(properties or {}):
        if name in QUERY_KEYS or name in SKIP or name == "type":
            continue
        if any(part in name for part in ("date", "price", "adult", "child", "departure", "arrival", "find_loc", "location")):
            return True
    return False


def as_param(value):
    if value is None or isinstance(value, dict):
        return None
    if isinstance(value, list):
        parts = [as_param(item) for item in value]
        text = ",".join(part for part in parts if part)
        return text or None
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    if isinstance(value, int):
        return str(value)
    text = str(value).strip()
    return text or None


def unwrap(data, properties):
    if isinstance(data, list):
        data = next((item for item in data if isinstance(item, dict)), {})
    if not isinstance(data, dict):
        return {}
    if any(key in properties for key in data):
        return data
    for value in data.values():
        if isinstance(value, dict) and any(key in properties for key in value):
            return value
    return {}


def accepted(raw, properties):
    data = unwrap(raw, properties)
    params = {}
    for name, value in data.items():
        if name not in properties or name in SKIP:
            continue
        text = as_param(value)
        if text:
            params[name] = text
    return params


def _json_from(text):
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", cleaned, flags=re.IGNORECASE).strip()
    return json.loads(cleaned)


def _prompt(text, engine, parameters, today):
    props = parameters.get("properties") or {}
    required = set(parameters.get("required") or [])
    fields = []
    for name, spec in props.items():
        if name in SKIP or not isinstance(spec, dict):
            continue
        fields.append({
            "name": name,
            "required": name in required,
            "description": (spec.get("description") or "")[:240],
        })
    return (
        f"Today is {today}. Search engine: {engine}.\n"
        "Return one JSON object of parameters for this user query. "
        "Use only names from the list. Dates are YYYY-MM-DD, resolved from today when the query says tomorrow, next week, or a month and day. "
        "Prices and counts are digits only. When a description lists option codes, return the code. "
        "Put the place or subject in the main query field. "
        "Omit anything the query does not support. Do not invent tokens, ids, or airport codes.\n"
        f"User query: {text}\n"
        f"Parameters: {json.dumps(fields, ensure_ascii=False)}"
    )


def extract_params(text, engine, parameters, today):
    """Ask Gemini for parameter JSON. Returns {} when the key, model, or JSON is unavailable."""
    key = gemini_key()
    props = (parameters or {}).get("properties") or {}
    if not key or not str(text).strip() or not props:
        return {}
    prompt = _prompt(text, engine, parameters, today)
    client = genai.Client(api_key=key)
    for model in MODELS:
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config={"response_mime_type": "application/json"},
            )
            raw = _json_from(response.text or "")
        except Exception as exc:
            code = getattr(exc, "code", None)
            if code in (400, 404) or "NOT_FOUND" in str(exc):
                continue
            return {}
        return accepted(raw, props)
    return {}

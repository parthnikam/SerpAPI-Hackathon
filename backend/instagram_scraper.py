
import json
import os
import re
import requests
import sys
from pathlib import Path
from urllib.parse import urlparse

from jev import load_dotenv


ROOT = Path(__file__).resolve().parent
MAX_PAGES = 100  # Safety limit


def safe_name(name: str) -> str:
    """Make a string safe to use as a folder or filename."""
    return re.sub(r'[<>:"/\\|?*]', "_", name).strip(" .") or "instagram_profile"


def download_file(url: str, destination: Path) -> bool:
    """Download a media URL without overwriting an existing file."""
    if not url:
        return False

    if destination.exists():
        print(f"Already exists: {destination.name}")
        return True

    try:
        with requests.get(
            url,
            stream=True,
            timeout=(10, 60),
            headers={"User-Agent": "Mozilla/5.0"},
        ) as response:
            response.raise_for_status()

            with destination.open("wb") as file:
                for chunk in response.iter_content(chunk_size=1024 * 1024):
                    if chunk:
                        file.write(chunk)

        print(f"Downloaded: {destination.name}")
        return True

    except (requests.RequestException, OSError) as error:
        # Remove incomplete downloads.
        destination.unlink(missing_ok=True)
        print(f"Failed to download {url}: {error}")
        return False


def get_extension(url: str, is_video: bool = False) -> str:
    """Determine a usable extension from the URL."""
    path = urlparse(url).path.lower()
    extension = Path(path).suffix

    if extension in {".jpg", ".jpeg", ".png", ".webp", ".mp4", ".mov"}:
        return extension

    return ".mp4" if is_video else ".jpg"


def main():
    if len(sys.argv) < 2:
        raise SystemExit("Usage: python instagram_scraper.py <profile_id>")

    profile_id = sys.argv[1].strip().lstrip("@")
    if not profile_id:
        raise SystemExit("Usage: python instagram_scraper.py <profile_id>")

    import serpapi

    load_dotenv()
    api_key = os.environ.get("SERPAPI_KEY") or os.environ.get("SERPAPI_API_KEY")

    if not api_key:
        raise RuntimeError(
            "Put SERPAPI_KEY or SERPAPI_API_KEY in backend/.env."
        )

    # Fetch profile and paginate through the available posts.
    all_posts = []
    seen_posts = set()
    page_count = 0

    params = {
        "engine": "instagram_profile",
        "profile_id": profile_id,
    }

    while params and page_count < MAX_PAGES:
        search = serpapi.GoogleSearch({**params, "api_key": api_key})
        results = search.get_dict()
        page_count += 1

        profile = results.get("profile_results", {})
        posts = profile.get("posts", [])

        for post in posts:
            post_id = post.get("id") or post.get("shortcode")

            if not post_id or post_id in seen_posts:
                continue

            seen_posts.add(post_id)
            all_posts.append(post)

        print(
            f"Page {page_count}: {len(posts)} posts; "
            f"{len(all_posts)} unique posts collected"
        )

        pagination = results.get("serpapi_pagination", {})
        next_token = pagination.get("next_page_token")

        if not next_token:
            break

        # SerpApi's documented pagination parameter.
        params = {
            "engine": "instagram_profile",
            "profile_id": profile_id,
            "next_page_token": next_token,
        }

    # Use the returned username for the folder when available.
    username = profile.get("username") or profile_id
    output_dir = ROOT / safe_name(username)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Save the original API data for later processing.
    with (output_dir / "posts.json").open("w", encoding="utf-8") as file:
        json.dump(all_posts, file, indent=2, ensure_ascii=False)

    # Download media files.
    for index, post in enumerate(all_posts, start=1):
        shortcode = safe_name(
            post.get("shortcode") or post.get("id") or str(index)
        )
        post_dir = output_dir / f"{index:04d}_{shortcode}"
        post_dir.mkdir(parents=True, exist_ok=True)

        # Store metadata next to each post's media.
        metadata = {
            **post,
            "post_url": (
                f"https://www.instagram.com/p/{post['shortcode']}/"
                if post.get("shortcode")
                else None
            ),
        }

        with (post_dir / "metadata.json").open(
            "w", encoding="utf-8"
        ) as file:
            json.dump(metadata, file, indent=2, ensure_ascii=False)

        # Instagram profile results commonly expose display_url.
        # Some responses expose additional media URLs.
        media_urls = []
        for key in ("display_url", "serpapi_display_url"):
            url = post.get(key)
            if url and url not in media_urls:
                media_urls.append(url)

        # Download each available URL.
        for media_index, url in enumerate(media_urls, start=1):
            extension = get_extension(
                url, is_video=bool(post.get("is_video"))
            )
            destination = post_dir / f"media_{media_index}{extension}"
            download_file(url, destination)

    print(f"\nFinished.")
    print(f"Profile: @{username}")
    print(f"Posts collected: {len(all_posts)}")
    print(f"Output folder: {output_dir}")


if __name__ == "__main__":
    main()

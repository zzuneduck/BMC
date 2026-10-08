"""URL → (platform, 고유 ID). 같은 게시물의 다른 주소 형태를 하나로 묶어 중복 수집을 막는다."""
from __future__ import annotations

import re
from urllib.parse import parse_qs, urlparse


def canonical(url: str) -> tuple[str, str] | None:
    u = urlparse(url.strip())
    host = (u.netloc or "").lower().split(":")[0]
    path = u.path
    qs = parse_qs(u.query)

    if host.endswith("blog.naver.com"):
        if "blogId" in qs and "logNo" in qs:
            return "naver_blog", f"{qs['blogId'][0]}/{qs['logNo'][0]}"
        m = re.match(r"^/([A-Za-z0-9_\-]+)/(\d+)", path)
        if m:
            return "naver_blog", f"{m.group(1)}/{m.group(2)}"
        return None

    if host in ("youtu.be",):
        vid = path.strip("/").split("/")[0]
        return ("youtube", vid) if vid else None
    if host.endswith("youtube.com"):
        if "v" in qs:
            return "youtube", qs["v"][0]
        m = re.match(r"^/(shorts|embed|live|v)/([A-Za-z0-9_\-]{6,})", path)
        if m:
            return "youtube", m.group(2)
        return None

    if host.endswith("instagram.com"):
        m = re.match(r"^/(?:[A-Za-z0-9_.]+/)?(p|reel|reels|tv)/([A-Za-z0-9_\-]+)", path)
        if m:
            return "instagram", m.group(2)
        return None

    if host.endswith("threads.net") or host.endswith("threads.com"):
        m = re.match(r"^/@?[A-Za-z0-9_.]+/post/([A-Za-z0-9_\-]+)", path)
        if m:
            return "threads", m.group(1)
        return None
    return None


def naver_mobile_url(external_id: str) -> str:
    blog_id, log_no = external_id.split("/", 1)
    return f"https://m.blog.naver.com/{blog_id}/{log_no}"

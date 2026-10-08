"""네이버 블로그: 검색 API(키가 있으면) 또는 통합검색 페이지 → 모바일 블로그 본문 수집."""
from __future__ import annotations

import html
import logging
import re
from datetime import datetime, timedelta

import httpx
from bs4 import BeautifulSoup

from .. import config
from ..config import KST
from ..normalize import canonical, naver_mobile_url
from .base import UA_DESKTOP, UA_MOBILE, Collector, FullPost, Ref

log = logging.getLogger(__name__)


def _strip_tags(s: str) -> str:
    return html.unescape(re.sub(r"<[^>]+>", "", s or ""))


def parse_naver_date(text: str, now: datetime | None = None) -> datetime | None:
    now = now or config.now_kst()
    t = (text or "").strip()
    m = re.search(r"(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?\s*(\d{1,2}):(\d{2})?", t)
    if m:
        return datetime(int(m[1]), int(m[2]), int(m[3]), int(m[4]), int(m[5] or 0), tzinfo=KST)
    m = re.search(r"(\d{4})[.\-]\s*(\d{1,2})[.\-]\s*(\d{1,2})", t)
    if m:
        return datetime(int(m[1]), int(m[2]), int(m[3]), tzinfo=KST)
    m = re.search(r"(\d+)\s*(분|시간|일)\s*전", t)
    if m:
        n = int(m[1])
        delta = {"분": timedelta(minutes=n), "시간": timedelta(hours=n), "일": timedelta(days=n)}[m[2]]
        return now - delta
    if "어제" in t:
        return now - timedelta(days=1)
    return None


def parse_post_html(html_text: str) -> dict:
    soup = BeautifulSoup(html_text, "html.parser")
    title = ""
    og = soup.find("meta", property="og:title")
    if og and og.get("content"):
        title = og["content"].strip()
    body = (
        soup.select_one("div.se-main-container")
        or soup.select_one("div#viewTypeSelector")
        or soup.select_one("div.post_ct")
        or soup.select_one("div#postViewArea")
    )
    content = ""
    if body:
        for br in body.find_all("br"):
            br.replace_with("\n")
        blocks = body.select("p, .se-text-paragraph, li, h1, h2, h3, blockquote") or [body]
        lines = [" ".join(b.get_text(" ").split()) for b in blocks]
        content = "\n".join(ln for ln in lines if ln)
    author = ""
    for sel in ("meta[property='naver:blog:nickname']", "meta[name='author']"):
        tag = soup.select_one(sel)
        if tag and tag.get("content"):
            author = tag["content"].strip()
            break
    if not author:
        nick = soup.select_one(".blog_author strong, .nick, .user_name")
        author = nick.get_text(strip=True) if nick else ""
    date_el = soup.select_one(".se_publishDate, .blog_date, .date, p.date")
    published = parse_naver_date(date_el.get_text(" ")) if date_el else None
    markers = []
    scope = body or soup
    for a in scope.find_all("a", href=True):
        markers.append(a["href"])
    for img in scope.find_all("img"):
        markers.append(img.get("src", "") or img.get("data-lazy-src", ""))
        if img.get("alt"):
            markers.append(img["alt"])
    return {"title": title, "content": content, "author": author, "published": published, "markers": " ".join(markers)}


class NaverBlogCollector(Collector):
    platform = "naver_blog"

    def __init__(self, client: httpx.Client | None = None):
        self.client = client or httpx.Client(timeout=20, follow_redirects=True)

    def search(self, keyword: str, since: datetime, hospital: dict) -> list[Ref]:
        limit = config.get_int("MAX_ITEMS_PER_KEYWORD", 30)
        if config.get_setting("NAVER_CLIENT_ID") and config.get_setting("NAVER_CLIENT_SECRET"):
            return self._search_api(keyword, since, limit)
        return self._search_web(keyword, limit)

    def _search_api(self, keyword: str, since: datetime, limit: int) -> list[Ref]:
        r = self.client.get(
            "https://openapi.naver.com/v1/search/blog.json",
            params={"query": f'"{keyword}"', "display": min(100, max(10, limit)), "sort": "date"},
            headers={
                "X-Naver-Client-Id": config.get_setting("NAVER_CLIENT_ID"),
                "X-Naver-Client-Secret": config.get_setting("NAVER_CLIENT_SECRET"),
            },
        )
        r.raise_for_status()
        refs = []
        for it in r.json().get("items", []):
            c = canonical(it.get("link", ""))
            if not c or c[0] != "naver_blog":
                continue
            pd = it.get("postdate", "")
            published = datetime.strptime(pd, "%Y%m%d").replace(tzinfo=KST) if len(pd) == 8 else None
            if published and published.date() < since.date():
                continue
            blog_id = c[1].split("/")[0]
            refs.append(Ref(
                platform="naver_blog", external_id=c[1], url=f"https://blog.naver.com/{c[1]}",
                title=_strip_tags(it.get("title", "")), author_name=it.get("bloggername", ""),
                author_id=blog_id, published_at=published, snippet=_strip_tags(it.get("description", "")),
            ))
        return refs[:limit]

    def _search_web(self, keyword: str, limit: int) -> list[Ref]:
        r = self.client.get(
            "https://search.naver.com/search.naver",
            params={"ssc": "tab.blog.all", "query": keyword, "sm": "tab_opt", "nso": "so:dd,p:1w"},
            headers={"User-Agent": UA_DESKTOP, "Accept-Language": "ko-KR,ko;q=0.9"},
        )
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "html.parser")
        refs, seen = [], set()
        for a in soup.find_all("a", href=True):
            c = canonical(a["href"])
            if not c or c[0] != "naver_blog" or c[1] in seen:
                continue
            seen.add(c[1])
            refs.append(Ref(platform="naver_blog", external_id=c[1], url=f"https://blog.naver.com/{c[1]}",
                            title=a.get_text(" ", strip=True), author_id=c[1].split("/")[0]))
        return refs[:limit]

    def fetch(self, ref: Ref) -> FullPost:
        r = self.client.get(naver_mobile_url(ref.external_id), headers={"User-Agent": UA_MOBILE})
        r.raise_for_status()
        p = parse_post_html(r.text)
        ref.title = p["title"] or ref.title
        ref.author_name = ref.author_name or p["author"]
        ref.published_at = ref.published_at or p["published"]
        return FullPost(ref=ref, content=p["content"] or ref.snippet, markers=p["markers"])

"""인스타그램(Graph API) / 스레드(Threads API) 수집.

- 인스타그램: 키워드를 해시태그로 바꿔 최근 게시물 검색 + 등록된 공식 계정은 business_discovery로 직접 조회
- 스레드: keyword_search(최근순) + 공식 계정 게시물
- 릴스·영상은 media_url을 내려받아 STT로 스크립트 생성
"""
from __future__ import annotations

import logging
import re
import tempfile
from datetime import datetime
from pathlib import Path

import httpx

from .. import config
from ..config import KST
from ..transcript import get_transcriber
from .base import Collector, FullPost, Ref

log = logging.getLogger(__name__)

GRAPH = "https://graph.facebook.com/v21.0"
THREADS = "https://graph.threads.net/v1.0"


def _parse_ts(s: str | None) -> datetime | None:
    if not s:
        return None
    s = s.replace("Z", "+00:00")
    s = re.sub(r"([+-]\d{2})(\d{2})$", r"\1:\2", s)
    try:
        return datetime.fromisoformat(s).astimezone(KST)
    except ValueError:
        return None


def _video_transcript(client: httpx.Client, media_url: str) -> list[dict]:
    with tempfile.TemporaryDirectory(dir=config.data_dir() / "media") as tmp:
        path = Path(tmp) / "media.mp4"
        with client.stream("GET", media_url) as r:
            r.raise_for_status()
            with open(path, "wb") as f:
                for chunk in r.iter_bytes():
                    f.write(chunk)
        segs = get_transcriber().transcribe(path)
    for s in segs:
        s["source"] = "stt"
    return segs


class _MetaCollector(Collector):
    def __init__(self, client: httpx.Client | None = None):
        self.client = client or httpx.Client(timeout=30, follow_redirects=True)

    def fetch(self, ref: Ref) -> FullPost:
        d = ref.data
        transcript = []
        if d.get("media_type") in ("VIDEO", "REELS") and d.get("media_url"):
            try:
                transcript = _video_transcript(self.client, d["media_url"])
            except Exception as e:
                log.warning("영상 STT 실패 %s: %s", ref.url, e)
        return FullPost(ref=ref, content=ref.snippet, transcript=transcript, markers=ref.snippet,
                        extra={"media_type": d.get("media_type"), "transcript_source": "stt" if transcript else ""})


class InstagramCollector(_MetaCollector):
    platform = "instagram"
    FIELDS = "id,caption,media_type,media_url,permalink,timestamp"

    def enabled(self) -> bool:
        return bool(config.get_setting("INSTAGRAM_ACCESS_TOKEN") and config.get_setting("INSTAGRAM_USER_ID"))

    def _get(self, path: str, **params) -> dict:
        params["access_token"] = config.get_setting("INSTAGRAM_ACCESS_TOKEN")
        r = self.client.get(f"{GRAPH}/{path}", params=params)
        r.raise_for_status()
        return r.json()

    def _ref(self, m: dict, username: str = "") -> Ref:
        return Ref("instagram", m["id"], m.get("permalink", ""), "", username or m.get("username", ""),
                   username or m.get("username", ""), _parse_ts(m.get("timestamp")), m.get("caption", "") or "",
                   {"media_type": m.get("media_type"), "media_url": m.get("media_url")})

    def search(self, keyword: str, since: datetime, hospital: dict) -> list[Ref]:
        uid = config.get_setting("INSTAGRAM_USER_ID")
        tag = re.sub(r"[^0-9A-Za-z가-힣_]", "", keyword)
        refs: list[Ref] = []
        if tag:
            found = self._get("ig_hashtag_search", user_id=uid, q=tag).get("data", [])
            if found:
                media = self._get(f"{found[0]['id']}/recent_media", user_id=uid, fields=self.FIELDS, limit=50)
                refs += [self._ref(m) for m in media.get("data", [])]
        # 공식 계정은 키워드 검색 1회차(병원명)에서만 조회
        if keyword == hospital.get("name"):
            for acc in hospital.get("official_accounts", {}).get("instagram", []):
                try:
                    bd = self._get(uid, fields=f"business_discovery.username({acc}){{username,media.limit(25){{{self.FIELDS},username}}}}")
                    for m in bd.get("business_discovery", {}).get("media", {}).get("data", []):
                        refs.append(self._ref(m, acc))
                except httpx.HTTPError as e:
                    log.warning("인스타 공식계정 조회 실패 %s: %s", acc, e)
        return [r for r in refs if not r.published_at or r.published_at >= since]


class ThreadsCollector(_MetaCollector):
    platform = "threads"
    FIELDS = "id,text,media_type,media_url,permalink,timestamp,username"

    def enabled(self) -> bool:
        return bool(config.get_setting("THREADS_ACCESS_TOKEN"))

    def _get(self, path: str, **params) -> dict:
        params["access_token"] = config.get_setting("THREADS_ACCESS_TOKEN")
        r = self.client.get(f"{THREADS}/{path}", params=params)
        r.raise_for_status()
        return r.json()

    def _ref(self, m: dict) -> Ref:
        return Ref("threads", m["id"], m.get("permalink", ""), "", m.get("username", ""), m.get("username", ""),
                   _parse_ts(m.get("timestamp")), m.get("text", "") or "",
                   {"media_type": m.get("media_type"), "media_url": m.get("media_url")})

    def search(self, keyword: str, since: datetime, hospital: dict) -> list[Ref]:
        data = self._get("keyword_search", q=keyword, search_type="RECENT", fields=self.FIELDS,
                         since=int(since.timestamp()), limit=50).get("data", [])
        refs = [self._ref(m) for m in data]
        if keyword == hospital.get("name"):
            for acc in hospital.get("official_accounts", {}).get("threads", []):
                try:
                    posts = self._get("profile_posts", username=acc, fields=self.FIELDS, limit=25).get("data", [])
                    refs += [self._ref(m) for m in posts]
                except httpx.HTTPError as e:
                    log.warning("스레드 공식계정 조회 실패 %s: %s", acc, e)
        return [r for r in refs if not r.published_at or r.published_at >= since]

"""유튜브: Data API(키가 있으면) 또는 yt-dlp 날짜순 검색 → 메타데이터 + 자막, 자막이 없으면 STT."""
from __future__ import annotations

import logging
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote_plus

import httpx

from .. import config
from ..config import KST
from ..transcript import get_transcriber, parse_vtt
from .base import Collector, FullPost, Ref

log = logging.getLogger(__name__)

SUB_LANGS = ("ko", "ko-KR", "ko-orig")


def _ydl(opts: dict | None = None):
    import yt_dlp

    base = {"quiet": True, "no_warnings": True, "skip_download": True, "noplaylist": True}
    base.update(opts or {})
    return yt_dlp.YoutubeDL(base)


def search_url(keyword: str) -> str:
    """업로드 날짜순 검색 결과 URL (sp=CAI%3D: 정렬=업로드 날짜)."""
    return f"https://www.youtube.com/results?search_query={quote_plus(keyword)}&sp=CAI%253D"


def pick_subtitle(info: dict) -> tuple[str, str] | None:
    """(자막 URL, source) — 수동 자막 우선, 그다음 자동 자막. 없으면 None."""
    for key, source in (("subtitles", "caption"), ("automatic_captions", "auto_caption")):
        tracks = info.get(key) or {}
        for lang in SUB_LANGS:
            for fmt in tracks.get(lang) or []:
                if fmt.get("ext") == "vtt" and fmt.get("url"):
                    return fmt["url"], source
    return None


class YouTubeCollector(Collector):
    platform = "youtube"

    def __init__(self, client: httpx.Client | None = None):
        self.client = client or httpx.Client(timeout=30, follow_redirects=True)

    def search(self, keyword: str, since: datetime, hospital: dict) -> list[Ref]:
        limit = config.get_int("MAX_ITEMS_PER_KEYWORD", 30)
        key = config.get_setting("YOUTUBE_API_KEY")
        if key:
            r = self.client.get(
                "https://www.googleapis.com/youtube/v3/search",
                params={
                    "part": "snippet", "q": keyword, "type": "video", "order": "date",
                    "maxResults": min(50, limit), "regionCode": "KR", "relevanceLanguage": "ko",
                    "publishedAfter": since.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "key": key,
                },
            )
            r.raise_for_status()
            refs = []
            for it in r.json().get("items", []):
                vid = it["id"].get("videoId")
                sn = it.get("snippet", {})
                if not vid:
                    continue
                pub = datetime.fromisoformat(sn["publishedAt"].replace("Z", "+00:00")).astimezone(KST)
                refs.append(Ref("youtube", vid, f"https://www.youtube.com/watch?v={vid}", sn.get("title", ""),
                                sn.get("channelTitle", ""), sn.get("channelId", ""), pub, sn.get("description", "")))
            return refs
        with _ydl({"extract_flat": "in_playlist", "playlistend": limit}) as ydl:
            res = ydl.extract_info(search_url(keyword), download=False)
        refs = []
        for e in (res or {}).get("entries") or []:
            vid = e.get("id")
            if not vid:
                continue
            refs.append(Ref("youtube", vid, f"https://www.youtube.com/watch?v={vid}", e.get("title", ""),
                            e.get("channel") or e.get("uploader") or "", e.get("channel_id") or "", None,
                            e.get("description") or ""))
        return refs

    def fetch(self, ref: Ref) -> FullPost:
        with _ydl() as ydl:
            info = ydl.extract_info(ref.url, download=False)
        return self.build_post(ref, info)

    def build_post(self, ref: Ref, info: dict) -> FullPost:
        ref.title = info.get("title") or ref.title
        ref.author_name = info.get("channel") or info.get("uploader") or ref.author_name
        ref.author_id = info.get("channel_id") or ref.author_id
        if info.get("timestamp"):
            ref.published_at = datetime.fromtimestamp(info["timestamp"], tz=KST)
        elif info.get("upload_date"):
            ref.published_at = datetime.strptime(info["upload_date"], "%Y%m%d").replace(tzinfo=KST)

        transcript, source = [], ""
        sub = pick_subtitle(info)
        if sub:
            try:
                r = self.client.get(sub[0])
                r.raise_for_status()
                transcript, source = parse_vtt(r.text), sub[1]
            except Exception as e:  # 자막 실패 시 STT로 진행
                log.warning("자막 다운로드 실패 %s: %s", ref.url, e)
        if not transcript:
            transcript, source = self.stt(ref, info), "stt"
        for seg in transcript:
            seg["source"] = source
        extra = {
            "duration": info.get("duration"),
            "view_count": info.get("view_count"),
            "transcript_source": source,
            "thumbnail": info.get("thumbnail"),
        }
        markers = " ".join(filter(None, [info.get("description", ""), " ".join(info.get("tags") or [])]))
        return FullPost(ref=ref, content=info.get("description", "") or ref.snippet,
                        transcript=transcript, markers=markers, extra=extra)

    def stt(self, ref: Ref, info: dict) -> list[dict]:
        media_dir = config.data_dir() / "media"
        with tempfile.TemporaryDirectory(dir=media_dir) as tmp:
            path = self.download_audio(ref.url, Path(tmp))
            return get_transcriber().transcribe(path)

    def download_audio(self, url: str, out_dir: Path) -> Path:
        opts = {
            "skip_download": False,
            "format": "bestaudio[ext=m4a]/bestaudio/best",
            "outtmpl": str(out_dir / "%(id)s.%(ext)s"),
        }
        with _ydl(opts) as ydl:
            info = ydl.extract_info(url, download=True)
            return Path(ydl.prepare_filename(info))

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime

PLATFORM_LABELS = {
    "naver_blog": "네이버 블로그",
    "youtube": "유튜브",
    "instagram": "인스타그램",
    "threads": "스레드",
}

UA_DESKTOP = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/128.0 Safari/537.36"
)
UA_MOBILE = (
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 "
    "(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
)


@dataclass
class Ref:
    """검색 결과(가벼운 정보). 신규 여부를 판단한 뒤에만 fetch로 본문·스크립트를 가져온다."""
    platform: str
    external_id: str
    url: str
    title: str = ""
    author_name: str = ""
    author_id: str = ""
    published_at: datetime | None = None
    snippet: str = ""
    data: dict = field(default_factory=dict)


@dataclass
class FullPost:
    ref: Ref
    content: str = ""
    transcript: list[dict] = field(default_factory=list)  # [{start_sec,end_sec,text,source}]
    markers: str = ""      # 링크·이미지 주소 등 (체험단 배너 탐지용)
    extra: dict = field(default_factory=dict)


class Collector:
    platform: str = ""

    def enabled(self) -> bool:
        return True

    def search(self, keyword: str, since: datetime, hospital: dict) -> list[Ref]:
        raise NotImplementedError

    def fetch(self, ref: Ref) -> FullPost:
        raise NotImplementedError

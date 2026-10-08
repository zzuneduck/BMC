"""설정: 환경변수 기본값 + 웹 화면(설정 페이지)에서 저장한 값을 DB에서 읽는다."""
from __future__ import annotations

import os
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

KST = ZoneInfo("Asia/Seoul")
APP_NAME = "너만을 위한 청진기"

BASE_DIR = Path(__file__).resolve().parent.parent


def data_dir() -> Path:
    d = Path(os.environ.get("STETHO_DATA_DIR", BASE_DIR / "data"))
    for sub in ("captures", "reports", "media", "cases"):
        (d / sub).mkdir(parents=True, exist_ok=True)
    return d


def now_kst() -> datetime:
    return datetime.now(KST)


# key: (기본값, 화면 라벨, 비밀값 여부, 그룹)
SETTING_DEFS: dict[str, tuple[str, str, bool, str]] = {
    "NAVER_CLIENT_ID": ("", "네이버 검색 API Client ID", False, "수집 채널"),
    "NAVER_CLIENT_SECRET": ("", "네이버 검색 API Client Secret", True, "수집 채널"),
    "YOUTUBE_API_KEY": ("", "YouTube Data API 키 (비우면 yt-dlp 검색)", True, "수집 채널"),
    "INSTAGRAM_USER_ID": ("", "인스타그램 비즈니스 계정 ID (Graph API)", False, "수집 채널"),
    "INSTAGRAM_ACCESS_TOKEN": ("", "인스타그램 Graph API 액세스 토큰", True, "수집 채널"),
    "THREADS_ACCESS_TOKEN": ("", "Threads API 액세스 토큰", True, "수집 채널"),
    "LOOKBACK_DAYS": ("3", "첫 수집 시 며칠 전 게시물까지 볼지", False, "수집 채널"),
    "MAX_ITEMS_PER_KEYWORD": ("30", "키워드·채널당 최대 검색 건수", False, "수집 채널"),
    "DAILY_RUN_TIME": ("18:00", "매일 자동 수집·분석 시각 (KST, HH:MM)", False, "일정"),
    "WEEKLY_SEND_ENABLED": ("0", "주간 보건소 자동 발송 (1=켜기)", False, "일정"),
    "WEEKLY_SEND_DAY": ("mon", "주간 발송 요일 (mon~sun)", False, "일정"),
    "WEEKLY_SEND_TIME": ("09:00", "주간 발송 시각 (KST, HH:MM)", False, "일정"),
    "STT_MODEL": ("small", "STT 모델 (tiny/base/small/medium/large-v3)", False, "분석"),
    "STT_DEVICE": ("cpu", "STT 장치 (cpu/cuda)", False, "분석"),
    "LLM_ENABLED": ("0", "Claude 2차 판정 사용 (1=켜기)", False, "분석"),
    "ANTHROPIC_API_KEY": ("", "Anthropic API 키", True, "분석"),
    "LLM_MODEL": ("claude-opus-5-5", "Claude 모델", False, "분석"),
    "SENDER_NAME": ("", "신고자(발신) 이름/기관", False, "발송"),
    "SENDER_CONTACT": ("", "신고자 연락처", False, "발송"),
    "SMTP_HOST": ("", "SMTP 서버 (예: smtp.gmail.com)", False, "발송"),
    "SMTP_PORT": ("587", "SMTP 포트", False, "발송"),
    "SMTP_USER": ("", "SMTP 계정", False, "발송"),
    "SMTP_PASSWORD": ("", "SMTP 비밀번호(앱 비밀번호)", True, "발송"),
    "SMTP_FROM": ("", "보내는 메일 주소", False, "발송"),
    "SMTP_CC": ("", "참조(CC) 메일 주소, 쉼표 구분", False, "발송"),
}


def get_setting(key: str) -> str:
    from . import db

    val = db.get_setting_raw(key)
    if val not in (None, ""):
        return val
    env = os.environ.get(key)
    if env not in (None, ""):
        return env
    return SETTING_DEFS.get(key, ("",))[0]


def get_int(key: str, default: int = 0) -> int:
    try:
        return int(get_setting(key))
    except (TypeError, ValueError):
        return default


def get_bool(key: str) -> bool:
    return get_setting(key).strip().lower() in ("1", "true", "yes", "on", "y")


def parse_hhmm(value: str, default: tuple[int, int]) -> tuple[int, int]:
    try:
        h, m = value.strip().split(":")
        h, m = int(h), int(m)
        if 0 <= h < 24 and 0 <= m < 60:
            return h, m
    except (ValueError, AttributeError):
        pass
    return default

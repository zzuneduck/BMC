"""한글 폰트 탐색 (PDF 임베딩·증거 카드용). 설치 패키지(koreanize-matplotlib)의 나눔고딕을 우선 사용."""
from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

CANDIDATES = [
    "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/System/Library/Fonts/Supplemental/AppleGothic.ttf",
    "C:/Windows/Fonts/malgun.ttf",
]


@lru_cache(maxsize=None)
def font_path(bold: bool = False) -> str | None:
    env = os.environ.get("STETHO_FONT")
    if env and Path(env).exists():
        return env
    name = "NanumGothicBold.ttf" if bold else "NanumGothic.ttf"
    try:
        from importlib import metadata

        for f in metadata.files("koreanize-matplotlib") or []:
            if str(f).endswith("/" + name):
                p = Path(f.locate())
                if p.exists():
                    return str(p)
    except metadata.PackageNotFoundError:
        pass
    for c in CANDIDATES:
        if Path(c).exists() and c.endswith(".ttf"):
            return c
    return None

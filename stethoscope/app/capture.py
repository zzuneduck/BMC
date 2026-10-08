"""증거 캡처: Playwright(Chromium)로 게시물 화면을 PNG로 저장.
로그인 벽 등으로 실패하면 수집한 원문으로 '증거 카드'를 렌더링해 캡처한다 (캡처가 항상 남도록)."""
from __future__ import annotations

import html
import logging
import os
from pathlib import Path

from . import config
from .collectors.base import PLATFORM_LABELS, UA_MOBILE
from .fonts import font_path
from .normalize import naver_mobile_url

log = logging.getLogger(__name__)
MAX_HEIGHT = 7000


def _launch(p):
    exe = os.environ.get("PLAYWRIGHT_CHROMIUM_EXECUTABLE")
    return p.chromium.launch(executable_path=exe or None, args=["--no-sandbox"])


def _dt(v) -> str:
    return str(v or "-")[:19].replace("T", " ")


def evidence_card_html(post: dict, findings: list[dict]) -> str:
    fp = font_path()
    font_face = f"@font-face{{font-family:KR;src:url('file://{fp}')}}" if fp else ""
    body = html.escape(post.get("content", "") or "")
    for f in findings:
        s = html.escape(f["sentence"])
        if s and s in body:
            body = body.replace(s, f"<mark>{s}</mark>")
    rows = "".join(
        f"<li><b>{html.escape(f.get('timestamp_label') or '')}</b> {html.escape(f['sentence'])}</li>"
        for f in findings
    )
    return f"""<html><head><meta charset="utf-8"><style>{font_face}
    body{{font-family:KR,'Nanum Gothic','Noto Sans KR',sans-serif;margin:0;padding:24px;width:760px;background:#fff;color:#111}}
    .h{{border-bottom:2px solid #222;padding-bottom:8px;margin-bottom:12px}}
    .m{{color:#555;font-size:13px;line-height:1.6}} pre{{white-space:pre-wrap;font-family:inherit;font-size:14px;line-height:1.7}}
    mark{{background:#ffe08a}} ul{{font-size:13px}}</style></head><body>
    <div class="h"><div class="m">{html.escape(PLATFORM_LABELS.get(post.get('platform', ''), ''))} · 수집 원문 증거 카드</div>
    <h2 style="margin:4px 0">{html.escape(post.get('title') or '(제목 없음)')}</h2>
    <div class="m">작성자: {html.escape(post.get('author_name') or '')}<br>URL: {html.escape(post.get('url') or '')}<br>
    게시: {html.escape(_dt(post.get('published_at')))} · 수집: {html.escape(_dt(post.get('collected_at')))} (KST)</div></div>
    <pre>{body}</pre>{f'<h3>영상 스크립트 위반 의심 구간</h3><ul>{rows}</ul>' if rows else ''}</body></html>"""


def capture(post: dict, findings: list[dict], out_path: Path) -> tuple[Path | None, str]:
    """(경로, 방식) 반환. 방식: page / card / none"""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        log.warning("playwright 미설치 — 캡처 생략")
        return None, "none"

    platform = post.get("platform")
    url = post["url"]
    mobile = platform == "naver_blog"
    if mobile:
        url = naver_mobile_url(post["external_id"])
    out_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        with sync_playwright() as p:
            browser = _launch(p)
            try:
                ctx = browser.new_context(
                    viewport={"width": 430, "height": 932} if mobile else {"width": 1280, "height": 900},
                    user_agent=UA_MOBILE if mobile else None,
                    locale="ko-KR", timezone_id="Asia/Seoul", device_scale_factor=1,
                )
                page = ctx.new_page()
                try:
                    page.goto(url, wait_until="domcontentloaded", timeout=30000)
                    try:
                        page.wait_for_load_state("networkidle", timeout=8000)
                    except Exception:
                        pass
                    blocked = page.locator("input[name='password'], input[name='pass']").count() > 0
                    if not blocked:
                        if mobile:
                            h = min(MAX_HEIGHT, page.evaluate("document.documentElement.scrollHeight") or 932)
                            page.screenshot(path=str(out_path), full_page=True,
                                            clip={"x": 0, "y": 0, "width": 430, "height": h})
                        else:
                            page.screenshot(path=str(out_path))
                        return out_path, "page"
                except Exception as e:
                    log.info("페이지 캡처 실패, 증거 카드로 대체 %s: %s", url, e)
                page = ctx.new_page()
                page.set_viewport_size({"width": 808, "height": 600})
                page.set_content(evidence_card_html(post, findings), wait_until="load")
                page.screenshot(path=str(out_path), full_page=True)
                return out_path, "card"
            finally:
                browser.close()
    except Exception as e:
        log.warning("캡처 실패 %s: %s", url, e)
        return None, "none"


def capture_path_for(post_id: int) -> Path:
    return config.data_dir() / "captures" / f"post_{post_id}.png"

"""PDF 리포트: 건별 리포트 + 병원별 묶음(승인 건만). 한글 폰트(나눔고딕) 임베딩."""
from __future__ import annotations

import io
from datetime import datetime
from pathlib import Path
from xml.sax.saxutils import escape

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (Image, KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table,
                                TableStyle)

from . import config
from .classifier import AUTHOR_TYPES
from .collectors.base import PLATFORM_LABELS
from .fonts import font_path
from .judge import fmt_ts
from .law56 import CLAUSES, clause_sort_key

_FONT: tuple[str, str] | None = None


def _fonts() -> tuple[str, str]:
    global _FONT
    if _FONT:
        return _FONT
    reg, bold = font_path(), font_path(bold=True)
    if reg:
        pdfmetrics.registerFont(TTFont("KR", reg))
        pdfmetrics.registerFont(TTFont("KR-B", bold or reg))
        _FONT = ("KR", "KR-B")
    else:  # 폰트 파일이 없으면 CID 폰트(뷰어 의존)로 대체
        pdfmetrics.registerFont(UnicodeCIDFont("HYGothic-Medium"))
        _FONT = ("HYGothic-Medium", "HYGothic-Medium")
    return _FONT


def _styles():
    f, b = _fonts()
    return {
        "title": ParagraphStyle("t", fontName=b, fontSize=17, leading=23, alignment=TA_CENTER, spaceAfter=6),
        "h2": ParagraphStyle("h2", fontName=b, fontSize=12.5, leading=17, spaceBefore=6, spaceAfter=4),
        "body": ParagraphStyle("b", fontName=f, fontSize=9.5, leading=14),
        "small": ParagraphStyle("s", fontName=f, fontSize=8.5, leading=12, textColor=colors.HexColor("#444444")),
        "cell": ParagraphStyle("c", fontName=f, fontSize=8.8, leading=12.5),
        "cellb": ParagraphStyle("cb", fontName=b, fontSize=8.8, leading=12.5),
        "center": ParagraphStyle("ce", fontName=f, fontSize=10, leading=15, alignment=TA_CENTER),
    }


def _p(text, style) -> Paragraph:
    return Paragraph(escape(str(text or "")).replace("\n", "<br/>"), style)


def _fmt_dt(v) -> str:
    if not v:
        return "-"
    try:
        return datetime.fromisoformat(str(v)).astimezone(config.KST).strftime("%Y-%m-%d %H:%M:%S (KST)")
    except ValueError:
        return str(v)


GRID = TableStyle([
    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#9aa3ad")),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#eef1f5")),
    ("LEFTPADDING", (0, 0), (-1, -1), 4), ("RIGHTPADDING", (0, 0), (-1, -1), 4),
])


def _capture_flowables(path: str | None, max_w: float, max_h: float) -> list:
    if not path or not Path(path).exists():
        return []
    img = PILImage.open(path).convert("RGB")
    w, h = img.size
    scale = max_w / w
    slice_px = int(max_h / scale)
    out = []
    for top in range(0, h, slice_px):
        part = img.crop((0, top, w, min(h, top + slice_px)))
        buf = io.BytesIO()
        part.save(buf, format="JPEG", quality=82)
        buf.seek(0)
        out.append(Image(buf, width=max_w, height=part.size[1] * scale))
        if len(out) >= 4:  # 최대 4페이지 분량
            break
    return out


def case_flowables(case: dict, transcript: list[dict], st: dict, index: int | None = None) -> list:
    flow = []
    head = f"사례 {index}. " if index else ""
    flow.append(_p(f"{head}{case['hospital_name']} — {PLATFORM_LABELS.get(case['platform'], case['platform'])}", st["h2"]))
    info = [
        ["게시물 URL", _p(case["url"], st["cell"])],
        ["제목", _p(case.get("title") or "-", st["cell"])],
        ["작성자", _p(f"{case.get('author_name') or '-'} ({case.get('author_id') or '-'})", st["cell"])],
        ["작성자 구분", _p(f"{AUTHOR_TYPES.get(case['author_type'], case['author_type'])} — {case.get('author_reason') or ''}", st["cell"])],
        ["게시 시각", _p(_fmt_dt(case.get("published_at")), st["cell"])],
        ["수집 시각", _p(_fmt_dt(case.get("collected_at")), st["cell"])],
        ["캡처 시각", _p(_fmt_dt(case.get("captured_at")), st["cell"])],
        ["판정", _p(f"{case['grade']} · {case.get('summary') or ''}", st["cell"])],
        ["검토 상태", _p({"approved": "승인", "rejected": "반려", "pending": "검토 대기"}.get(case["review_status"], "")
                       + (f" ({_fmt_dt(case.get('reviewed_at'))})" if case.get("reviewed_at") else ""), st["cell"])],
    ]
    t = Table([[_p(k, st["cellb"]), v] for k, v in info], colWidths=[28 * mm, 152 * mm])
    t.setStyle(GRID)
    flow += [t, Spacer(1, 4 * mm)]

    findings = case["final_findings"]
    rows = [[_p("No", st["cellb"]), _p("위반 의심 문장", st["cellb"]), _p("근거 조항", st["cellb"]), _p("검토 의견", st["cellb"])]]
    for i, f in enumerate(findings, 1):
        sent = (f"[{f['timestamp_label']}] " if f.get("timestamp_label") else "") + f["sentence"]
        rows.append([_p(i, st["cell"]), _p(sent, st["cell"]), _p(f.get("clause_label") or f.get("clause"), st["cell"]),
                     _p(f.get("comment") or f.get("note") or "", st["cell"])])
    ft = Table(rows, colWidths=[9 * mm, 78 * mm, 55 * mm, 38 * mm], repeatRows=1)
    ft.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#9aa3ad")),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#dfe5ec")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    flow += [_p("위반 의심 문장 및 근거 조항", st["h2"]), ft]
    if case.get("review_note"):
        flow += [Spacer(1, 3 * mm), _p("검토자 의견(수정사항)", st["h2"]), _p(case["review_note"], st["body"])]

    if transcript:
        hit_ts = {f.get("timestamp") for f in findings if f.get("timestamp") is not None}
        src = {"caption": "업로드 자막", "auto_caption": "자동 생성 자막", "stt": "음성인식(STT)"}.get(transcript[0].get("source"), "")
        lines = [f"[{_ts(s['start_sec'])}] {s['text']}" for s in transcript if s["start_sec"] in hit_ts]
        if lines:
            flow += [Spacer(1, 3 * mm), _p(f"영상 스크립트 해당 구간 (출처: {src})", st["h2"]), _p("\n".join(lines), st["small"])]

    caps = _capture_flowables(case.get("capture_path"), 180 * mm, 225 * mm)
    if caps:
        flow += [PageBreak(), _p("게시물 캡처", st["h2"])] + caps
    return flow


def _ts(sec: float) -> str:
    return fmt_ts(sec)


def _footer(canvas, doc):
    f, _ = _fonts()
    canvas.saveState()
    canvas.setFont(f, 7.5)
    canvas.setFillColor(colors.HexColor("#666666"))
    canvas.drawString(15 * mm, 9 * mm, f"{config.APP_NAME} · 의료광고 위반 의심 사례 보고서")
    canvas.drawRightString(195 * mm, 9 * mm, f"{doc.page}")
    canvas.restoreState()


def _doc(buf) -> SimpleDocTemplate:
    return SimpleDocTemplate(buf, pagesize=A4, leftMargin=15 * mm, rightMargin=15 * mm,
                             topMargin=14 * mm, bottomMargin=16 * mm, title="의료광고 위반 의심 보고서")


def build_case_pdf(case: dict, transcript: list[dict]) -> bytes:
    st = _styles()
    buf = io.BytesIO()
    flow = [_p("의료광고 위반 의심 사례 리포트", st["title"]),
            _p(f"작성: {config.now_kst().strftime('%Y-%m-%d %H:%M')} (KST)", st["center"]), Spacer(1, 5 * mm)]
    flow += case_flowables(case, transcript, st)
    _doc(buf).build(flow, onFirstPage=_footer, onLaterPages=_footer)
    return buf.getvalue()


def build_hospital_pdf(hospital: dict, cases: list[dict], transcripts: dict[int, list[dict]],
                       period: tuple[str, str] | None = None) -> bytes:
    """승인된 사례만 받아 병원별 보고서를 만든다 (필터링은 호출부 report.approved_cases 담당)."""
    st = _styles()
    buf = io.BytesIO()
    sender = config.get_setting("SENDER_NAME") or "-"
    contact = config.get_setting("SENDER_CONTACT") or "-"
    flow = [
        Spacer(1, 25 * mm),
        _p("의료광고 위반 의심 사례 보고서", st["title"]),
        _p("(의료법 제56조 관련)", st["center"]), Spacer(1, 12 * mm),
    ]
    meta = [
        ["수신", _p(hospital.get("health_center_name") or "관할 보건소 의료광고 담당", st["cell"])],
        ["대상 의료기관", _p(hospital["name"] + (f" ({hospital['address']})" if hospital.get("address") else ""), st["cell"])],
        ["원장", _p(", ".join(hospital.get("directors") or []) or "-", st["cell"])],
        ["대상 기간", _p(f"{period[0]} ~ {period[1]}" if period else "-", st["cell"])],
        ["사례 수", _p(f"{len(cases)}건 (검토 승인 건)", st["cell"])],
        ["작성", _p(f"{sender} / {contact}", st["cell"])],
        ["작성 일시", _p(config.now_kst().strftime("%Y-%m-%d %H:%M (KST)"), st["cell"])],
    ]
    t = Table([[_p(k, st["cellb"]), v] for k, v in meta], colWidths=[35 * mm, 145 * mm])
    t.setStyle(GRID)
    flow += [t, Spacer(1, 8 * mm), _p("사례 목록", st["h2"])]
    rows = [[_p(h, st["cellb"]) for h in ("No", "채널", "작성자 구분", "게시 시각", "주요 조항")]]
    for i, c in enumerate(cases, 1):
        clauses = sorted({f.get("clause") for f in c["final_findings"]}, key=clause_sort_key)
        rows.append([_p(i, st["cell"]), _p(PLATFORM_LABELS.get(c["platform"], c["platform"]), st["cell"]),
                     _p(AUTHOR_TYPES.get(c["author_type"], ""), st["cell"]), _p(_fmt_dt(c.get("published_at"))[:16], st["cell"]),
                     _p(", ".join(CLAUSES.get(x, (x,))[0].replace("제56조 ", "") for x in clauses), st["cell"])])
    lt = Table(rows, colWidths=[10 * mm, 25 * mm, 28 * mm, 32 * mm, 85 * mm], repeatRows=1)
    lt.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#9aa3ad")),
                            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#dfe5ec")), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
    flow.append(lt)
    for i, c in enumerate(cases, 1):
        flow += [PageBreak()] + case_flowables(c, transcripts.get(c["post_id"], []), st, index=i)
    if not cases:
        flow.append(KeepTogether([_p("해당 기간 승인된 사례가 없습니다.", st["body"])]))
    _doc(buf).build(flow, onFirstPage=_footer, onLaterPages=_footer)
    return buf.getvalue()

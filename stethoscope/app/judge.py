"""3등급 판정: 명백 / 애매 / 해당없음.

1차: law56 규칙 기반 (항상 동작, API 키 불필요)
2차(선택): Claude가 규칙 후보와 원문을 보고 등급·근거를 재판정. 원문에 없는 문장은 버린다.
"""
from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field

from . import config
from .law56 import CLAUSES, Hit, clause_label, clause_sort_key, document_checks, scan_units, split_sentences

log = logging.getLogger(__name__)

GRADES = ("명백", "애매", "해당없음")


@dataclass
class Judgment:
    grade: str
    findings: list[dict] = field(default_factory=list)
    summary: str = ""
    engine: str = "rule"


def fmt_ts(sec: float | None) -> str:
    if sec is None:
        return ""
    sec = int(sec)
    h, rem = divmod(sec, 3600)
    m, s = divmod(rem, 60)
    return f"{h:d}:{m:02d}:{s:02d}" if h else f"{m:02d}:{s:02d}"


def _finding(h: Hit) -> dict:
    return {
        "sentence": h.sentence,
        "clause": h.clause,
        "clause_label": clause_label(h.clause),
        "severity": h.severity,
        "note": h.note,
        "rule_id": h.rule_id,
        "timestamp": h.timestamp,
        "timestamp_label": fmt_ts(h.timestamp),
        "comment": "",
    }


def build_units(title: str, content: str, transcript: list[dict]) -> list[tuple[str, float | None]]:
    units: list[tuple[str, float | None]] = []
    if title:
        units.append((title.strip(), None))
    units += [(s, None) for s in split_sentences(content)]
    units += [(seg["text"].strip(), float(seg["start_sec"])) for seg in transcript if seg.get("text", "").strip()]
    return units


def _mentions(hospital: dict, text: str) -> bool:
    norm = re.sub(r"\s", "", text)
    names = [hospital["name"], *hospital.get("directors", []), *hospital.get("keywords", [])]
    return any(n and re.sub(r"\s", "", n) in norm for n in names)


def rule_judge(post: dict, transcript: list[dict], hospital: dict) -> Judgment:
    title, content = post.get("title", ""), post.get("content", "")
    full = "\n".join([title, content, *(s["text"] for s in transcript)])
    if not _mentions(hospital, full):
        return Judgment("해당없음", [], "병원명·원장명·키워드가 본문/스크립트에 없음")

    advertiser = post.get("author_type") in ("official", "sponsored")
    hits = scan_units(build_units(title, content, transcript)) + document_checks(full, advertiser)
    findings = [_finding(h) for h in hits]
    strong = [f for f in findings if f["severity"] == "strong"]

    if not findings:
        return Judgment("해당없음", [], "체크리스트 해당 문구 없음")
    if strong and advertiser:
        grade = "명백"
        why = f"광고 주체({post.get('author_type')}) 게시물에서 금지 표현 {len(strong)}건"
    elif strong:
        grade = "애매"
        why = f"금지 표현 {len(strong)}건이나 일반 후기로 분류 — 광고성(대가 관계) 확인 필요"
    else:
        grade = "애매"
        why = f"맥락 판단이 필요한 표현 {len(findings)}건"
    clauses = sorted({f["clause"] for f in findings}, key=clause_sort_key)
    summary = why + " · 관련 조항: " + ", ".join(CLAUSES[c][0] for c in clauses)
    return Judgment(grade, findings, summary)


# ---------------- Claude 2차 판정 (선택) ----------------
def _llm_available() -> bool:
    return config.get_bool("LLM_ENABLED") and bool(config.get_setting("ANTHROPIC_API_KEY"))


LLM_SYSTEM = """당신은 한국 의료법 제56조(의료광고의 금지) 위반 여부를 검토하는 보건소 의료광고 모니터링 담당자입니다.
게시물 원문, 작성자 유형, 1차 규칙 엔진의 후보 문장을 받아 최종 등급을 판정합니다.

등급 기준:
- 명백: 의료기관(또는 대가를 받은 체험단)이 작성한 광고성 게시물이며, 제56조 제2항 각 호 중 하나에 명확히 해당하는 문장이 있음
- 애매: 위반 소지가 있으나 광고성(대가 관계) 또는 표현의 위법성 판단에 추가 확인이 필요함
- 해당없음: 의료광고가 아니거나 위반 표현이 없음

규칙:
- findings.sentence 는 반드시 원문에 있는 문장을 그대로 옮겨 적습니다. 원문에 없는 문장을 만들지 마세요.
- clause 는 다음 코드 중 하나만 사용합니다: {codes}
- 순수한 환자 개인의 자발적 후기(대가 없음)는 원칙적으로 의료광고가 아니므로 '해당없음' 또는 '애매'로 판정합니다.
- reason 은 한국어 한두 문장으로 씁니다."""


def llm_refine(post: dict, transcript: list[dict], base: Judgment) -> Judgment | None:
    try:
        import anthropic
        from pydantic import BaseModel
    except ImportError:
        return None

    class LLMFinding(BaseModel):
        sentence: str
        clause: str
        reason: str

    class LLMVerdict(BaseModel):
        grade: str
        summary: str
        findings: list[LLMFinding]

    transcript_text = "\n".join(f"[{fmt_ts(s['start_sec'])}] {s['text']}" for s in transcript)
    candidates = "\n".join(f"- ({f['clause']}) {f['sentence']}" for f in base.findings) or "(없음)"
    user = (
        f"플랫폼: {post.get('platform')}\n작성자: {post.get('author_name')} / 유형: {post.get('author_type')} "
        f"({post.get('author_reason')})\n제목: {post.get('title')}\n\n[본문]\n{post.get('content', '')}\n\n"
        f"[영상 스크립트]\n{transcript_text or '(없음)'}\n\n[1차 후보]\n{candidates}\n\n"
        "grade 는 '명백', '애매', '해당없음' 중 하나로 답하세요."
    )
    client = anthropic.Anthropic(api_key=config.get_setting("ANTHROPIC_API_KEY"))
    try:
        resp = client.beta.messages.parse(
            model=config.get_setting("LLM_MODEL") or "claude-opus-5-5",
            max_tokens=16000,
            system=LLM_SYSTEM.format(codes=", ".join(CLAUSES)),
            messages=[{"role": "user", "content": user}],
            output_format=LLMVerdict,
            output_config={"effort": "medium"},
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
        )
    except anthropic.APIError as e:
        log.warning("Claude 판정 실패, 규칙 판정 유지: %s", e)
        return None
    if resp.stop_reason == "refusal" or resp.parsed_output is None:
        return None
    v = resp.parsed_output
    if v.grade not in GRADES:
        return None

    # 원문 검증: 공백 무시 부분일치하는 문장만 채택, 스크립트 문장이면 타임스탬프 복원
    def squash(s: str) -> str:
        return re.sub(r"\s+", "", s)

    source = squash("\n".join([post.get("title", ""), post.get("content", "")]))
    by_rule = {(squash(f["sentence"]), f["clause"]): f for f in base.findings}
    findings = []
    for f in v.findings:
        if f.clause not in CLAUSES:
            continue
        sq = squash(f.sentence)
        seg = next((s for s in transcript if sq and (sq in squash(s["text"]) or squash(s["text"]) in sq)), None)
        if not sq or (sq not in source and seg is None):
            continue
        prev = by_rule.get((sq, f.clause), {})
        tsec = float(seg["start_sec"]) if seg else prev.get("timestamp")
        findings.append({
            "sentence": f.sentence, "clause": f.clause, "clause_label": clause_label(f.clause),
            "severity": "strong" if v.grade == "명백" else "weak", "note": f.reason,
            "rule_id": "llm", "timestamp": tsec, "timestamp_label": fmt_ts(tsec), "comment": "",
        })
    # 문서 단위 누락 항목은 규칙 결과를 유지
    findings += [f for f in base.findings if f["sentence"].startswith("(게시물 전체)")]
    if v.grade == "명백" and not findings:
        return None
    return Judgment(v.grade, findings, v.summary, "rule+claude")


def judge(post: dict, transcript: list[dict], hospital: dict) -> Judgment:
    base = rule_judge(post, transcript, hospital)
    if base.findings and _llm_available():
        refined = llm_refine(post, transcript, base)
        if refined:
            return refined
    return base

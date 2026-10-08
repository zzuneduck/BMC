"""승인 건 → 병원별 PDF 묶음 / ZIP / 주간 보건소 발송."""
from __future__ import annotations

import io
import logging
import re
import smtplib
import zipfile
from datetime import datetime, timedelta
from email.message import EmailMessage
from pathlib import Path

from . import config, db
from .pdf_report import build_hospital_pdf

log = logging.getLogger(__name__)


def approved_cases(hospital_id: int, date_from: str | None = None, date_to: str | None = None,
                   unsent_only: bool = False) -> list[dict]:
    """review_status='approved' 인 건만 반환 (검토 승인일 기준 기간 필터)."""
    cases = db.list_cases(status="approved", hospital_id=hospital_id, limit=10000)
    out = []
    for c in cases:
        day = (c.get("reviewed_at") or c["collected_at"])[:10]
        if date_from and day < date_from:
            continue
        if date_to and day > date_to:
            continue
        if unsent_only and c.get("dispatch_id"):
            continue
        out.append(c)
    out.sort(key=lambda c: c.get("published_at") or c["collected_at"])
    return out


def hospital_pdf(hospital_id: int, date_from: str | None = None, date_to: str | None = None,
                 unsent_only: bool = False) -> tuple[bytes, list[dict]]:
    h = db.get_hospital(hospital_id)
    cases = approved_cases(hospital_id, date_from, date_to, unsent_only)
    transcripts = {c["post_id"]: db.transcript_for(c["post_id"]) for c in cases}
    if cases:
        period = (date_from or min(c["reviewed_at"] or c["collected_at"] for c in cases)[:10],
                  date_to or max(c["reviewed_at"] or c["collected_at"] for c in cases)[:10])
    else:
        period = (date_from or "-", date_to or "-")
    return build_hospital_pdf(h, cases, transcripts, period), cases


def safe_name(s: str) -> str:
    return re.sub(r"[\\/:*?\"<>|\s]+", "_", s).strip("_") or "hospital"


def all_hospitals_zip(date_from: str | None = None, date_to: str | None = None) -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        for h in db.list_hospitals():
            if not approved_cases(h["id"], date_from, date_to):
                continue
            pdf, _ = hospital_pdf(h["id"], date_from, date_to)
            z.writestr(f"{safe_name(h['name'])}_의료광고위반의심_보고서.pdf", pdf)
    return buf.getvalue()


def smtp_ready() -> bool:
    return bool(config.get_setting("SMTP_HOST") and (config.get_setting("SMTP_FROM") or config.get_setting("SMTP_USER")))


def send_mail(to: list[str], subject: str, body: str, attachments: list[tuple[str, bytes]]) -> None:
    msg = EmailMessage()
    sender = config.get_setting("SMTP_FROM") or config.get_setting("SMTP_USER")
    msg["From"] = sender
    msg["To"] = ", ".join(to)
    cc = [x.strip() for x in config.get_setting("SMTP_CC").split(",") if x.strip()]
    if cc:
        msg["Cc"] = ", ".join(cc)
    msg["Subject"] = subject
    msg.set_content(body)
    for name, data in attachments:
        msg.add_attachment(data, maintype="application", subtype="pdf", filename=name)
    port = config.get_int("SMTP_PORT", 587)
    host = config.get_setting("SMTP_HOST")
    smtp_cls = smtplib.SMTP_SSL if port == 465 else smtplib.SMTP
    with smtp_cls(host, port, timeout=60) as s:
        if port != 465:
            s.starttls()
        if config.get_setting("SMTP_USER"):
            s.login(config.get_setting("SMTP_USER"), config.get_setting("SMTP_PASSWORD"))
        s.send_message(msg)


def mail_text(h: dict, n: int, period: tuple[str, str]) -> tuple[str, str]:
    subject = f"[의료광고 위반 의심 신고] {h['name']} ({period[0]}~{period[1]}, {n}건)"
    body = (
        f"{h.get('health_center_name') or '보건소'} 의료광고 담당자님께,\n\n"
        f"관할 의료기관 '{h['name']}'의 온라인 게시물 중 의료법 제56조 위반이 의심되는 사례 {n}건을 "
        f"첨부 보고서로 제출합니다.\n보고서에는 게시물 URL, 수집 시각, 캡처, 위반 의심 문장과 근거 조항이 포함되어 있습니다.\n\n"
        f"검토 부탁드립니다.\n\n{config.get_setting('SENDER_NAME')}\n{config.get_setting('SENDER_CONTACT')}\n"
    )
    return subject, body


def dispatch_hospital(h: dict, send: bool = True) -> dict:
    """미발송 승인 건을 묶어 PDF 저장 → (설정 시) 메일 발송 → 발송 이력 기록."""
    pdf, cases = hospital_pdf(h["id"], unsent_only=True)
    if not cases:
        return {"hospital": h["name"], "status": "empty", "count": 0}
    days = sorted((c["reviewed_at"] or c["collected_at"])[:10] for c in cases)
    period = (days[0], days[-1])
    fname = f"{config.now_kst():%Y%m%d}_{safe_name(h['name'])}_의료광고위반의심_보고서.pdf"
    path = config.data_dir() / "reports" / fname
    path.write_bytes(pdf)
    status, error, recipients = "ready", "", h.get("health_center_email", "")
    if send and recipients and smtp_ready():
        try:
            subject, body = mail_text(h, len(cases), period)
            send_mail([x.strip() for x in recipients.split(",") if x.strip()], subject, body, [(fname, pdf)])
            status = "sent"
        except Exception as e:
            status, error = "failed", str(e)
            log.exception("메일 발송 실패")
    elif send:
        error = "보건소 이메일 또는 SMTP 설정이 없어 PDF만 생성했습니다. 직접 발송 후 '발송 완료'를 눌러주세요."
    with db.tx() as c:
        did = c.execute(
            "INSERT INTO dispatches(hospital_id, created_at, period_from, period_to, recipients, pdf_path, case_count, status, error) "
            "VALUES(?,?,?,?,?,?,?,?,?)",
            (h["id"], db.ts(), period[0], period[1], recipients, str(path), len(cases), status, error),
        ).lastrowid
        if status in ("sent", "ready"):
            # ready도 묶음에 배정해 다음 주 중복 발송을 막는다 (수동 발송 대상)
            c.executemany("UPDATE judgments SET dispatch_id=? WHERE id=?", [(did, x["case_id"]) for x in cases])
    return {"hospital": h["name"], "status": status, "count": len(cases), "dispatch_id": did, "error": error}


def run_weekly_dispatch(trigger: str = "schedule") -> list[dict]:
    with db.tx() as c:
        run_id = c.execute("INSERT INTO runs(kind, trigger, started_at) VALUES('weekly', ?, ?)", (trigger, db.ts())).lastrowid
    results = [dispatch_hospital(h) for h in db.list_hospitals()]
    results = [r for r in results if r["status"] != "empty"]
    with db.tx() as c:
        c.execute("UPDATE runs SET finished_at=?, status='success', stats=?, log=? WHERE id=?",
                  (db.ts(), db.jd({"dispatched": len(results)}),
                   "\n".join(f"{r['hospital']}: {r['status']} {r['count']}건 {r.get('error', '')}" for r in results), run_id))
    return results


def week_range(today: datetime | None = None) -> tuple[str, str]:
    today = today or config.now_kst()
    start = today - timedelta(days=7)
    return start.strftime("%Y-%m-%d"), today.strftime("%Y-%m-%d")


def dispatch_file(dispatch_id: int) -> Path | None:
    row = db.q1("SELECT pdf_path FROM dispatches WHERE id=?", (dispatch_id,))
    return Path(row["pdf_path"]) if row and row["pdf_path"] else None

"""웹 화면: 대시보드 / 병원 등록 / 건별 검토(수정·승인·반려) / PDF 다운로드 / 설정 / 주간 발송."""
from __future__ import annotations

import base64
import os
import re
import secrets
from contextlib import asynccontextmanager
from pathlib import Path
from urllib.parse import quote

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from . import config, db, pipeline, report, scheduler
from .classifier import AUTHOR_TYPES
from .collectors import PLATFORM_LABELS, default_collectors
from .judge import GRADES, fmt_ts
from .law56 import CLAUSES, clause_label

APP_DIR = Path(__file__).resolve().parent
templates = Jinja2Templates(directory=str(APP_DIR / "templates"))
templates.env.globals.update(
    APP_NAME=config.APP_NAME, PLATFORM_LABELS=PLATFORM_LABELS, AUTHOR_TYPES=AUTHOR_TYPES,
    CLAUSES=CLAUSES, GRADES=GRADES, fmt_ts=fmt_ts,
    STATUS_LABELS={"pending": "검토 대기", "approved": "승인", "rejected": "반려"},
)


def _dt(v) -> str:
    if not v:
        return "-"
    return str(v)[:16].replace("T", " ")


templates.env.filters["dt"] = _dt


@asynccontextmanager
async def lifespan(app: FastAPI):
    if os.environ.get("STETHO_NO_SCHEDULER") != "1":
        scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(title=config.APP_NAME, lifespan=lifespan)
app.mount("/static", StaticFiles(directory=str(APP_DIR / "static")), name="static")


@app.middleware("http")
async def basic_auth(request: Request, call_next):
    pw = os.environ.get("ADMIN_PASSWORD")
    if pw and not request.url.path.startswith("/static"):
        auth = request.headers.get("authorization", "")
        ok = False
        if auth.startswith("Basic "):
            try:
                _, _, given = base64.b64decode(auth[6:]).decode().partition(":")
                ok = secrets.compare_digest(given, pw)
            except Exception:
                ok = False
        if not ok:
            return Response("인증 필요", 401, {"WWW-Authenticate": 'Basic realm="stethoscope"'})
    return await call_next(request)


def render(request: Request, name: str, **ctx):
    ctx.setdefault("flash", request.query_params.get("msg", ""))
    return templates.TemplateResponse(request, name, ctx)


def _lines(v: str) -> list[str]:
    return [x.strip() for x in re.split(r"[\n,]", v or "") if x.strip()]


# ---------------- 대시보드 ----------------
@app.get("/", response_class=HTMLResponse)
def dashboard(request: Request):
    counts = {r["grade"]: r["n"] for r in db.q("SELECT grade, COUNT(*) n FROM judgments GROUP BY grade")}
    pending = db.q1("SELECT COUNT(*) n FROM judgments WHERE review_status='pending' AND grade!='해당없음'")["n"]
    approved_unsent = db.q1("SELECT COUNT(*) n FROM judgments WHERE review_status='approved' AND dispatch_id IS NULL")["n"]
    runs = [dict(r) | {"stats": db.jl(r["stats"], {})} for r in db.q("SELECT * FROM runs ORDER BY id DESC LIMIT 10")]
    channels = [(PLATFORM_LABELS[c.platform], c.enabled()) for c in default_collectors()]
    return render(request, "dashboard.html", counts=counts, pending=pending, approved_unsent=approved_unsent,
                  runs=runs, hospitals=db.list_hospitals(),
                  next_daily=scheduler.next_run(scheduler.DAILY_JOB) or scheduler.expected_next_daily(),
                  next_weekly=scheduler.next_run(scheduler.WEEKLY_JOB), running=pipeline.RUN_LOCK.locked(),
                  channels=channels)


@app.post("/run")
def run_now():
    started = pipeline.run_in_background("manual", "web")
    msg = "수집을 시작했습니다. 잠시 후 새로고침하세요." if started else "이미 수집이 실행 중입니다."
    return RedirectResponse(f"/?msg={quote(msg)}", 303)


@app.get("/runs/{run_id}", response_class=HTMLResponse)
def run_detail(request: Request, run_id: int):
    r = db.q1("SELECT * FROM runs WHERE id=?", (run_id,))
    if not r:
        raise HTTPException(404)
    return render(request, "run.html", run=dict(r) | {"stats": db.jl(r["stats"], {})})


# ---------------- 병원 ----------------
@app.get("/hospitals", response_class=HTMLResponse)
def hospitals(request: Request):
    stats = {r["hospital_id"]: dict(r) for r in db.q(
        "SELECT p.hospital_id, COUNT(*) total, SUM(j.grade='명백') clear, SUM(j.grade='애매') unclear, "
        "SUM(j.review_status='approved') approved FROM posts p JOIN judgments j ON j.post_id=p.id GROUP BY p.hospital_id")}
    return render(request, "hospitals.html", hospitals=db.list_hospitals(), stats=stats,
                  next_daily=scheduler.next_run() or scheduler.expected_next_daily())


@app.get("/hospitals/new", response_class=HTMLResponse)
def hospital_new(request: Request):
    return render(request, "hospital_form.html", h=None)


@app.get("/hospitals/{hid}/edit", response_class=HTMLResponse)
def hospital_edit(request: Request, hid: int):
    h = db.get_hospital(hid)
    if not h:
        raise HTTPException(404)
    return render(request, "hospital_form.html", h=h)


async def _hospital_from_form(request: Request) -> dict:
    f = await request.form()
    name = (f.get("name") or "").strip()
    if not name:
        raise HTTPException(400, "병원명을 입력하세요")
    return {
        "name": name,
        "directors": _lines(f.get("directors", "")),
        "keywords": _lines(f.get("keywords", "")),
        "official_accounts": {p: _lines(f.get(f"acc_{p}", "")) for p in PLATFORM_LABELS},
        "health_center_name": (f.get("health_center_name") or "").strip(),
        "health_center_email": (f.get("health_center_email") or "").strip(),
        "address": (f.get("address") or "").strip(),
        "active": f.get("active", "1") == "1",
    }


@app.post("/hospitals/new")
async def hospital_create(request: Request):
    db.save_hospital(await _hospital_from_form(request))
    nxt = scheduler.next_run() or scheduler.expected_next_daily()
    return RedirectResponse(f"/hospitals?msg={quote(f'등록 완료. 다음 자동 수집: {nxt:%m/%d %H:%M} (KST)')}", 303)


@app.post("/hospitals/{hid}/edit")
async def hospital_update(request: Request, hid: int):
    db.save_hospital(await _hospital_from_form(request), hid)
    return RedirectResponse(f"/hospitals?msg={quote('저장했습니다.')}", 303)


@app.get("/hospitals/{hid}/report.pdf")
def hospital_report(hid: int, date_from: str | None = None, date_to: str | None = None):
    h = db.get_hospital(hid)
    if not h:
        raise HTTPException(404)
    pdf, cases = report.hospital_pdf(hid, date_from or None, date_to or None)
    name = f"{report.safe_name(h['name'])}_의료광고위반의심_보고서.pdf"
    return Response(pdf, media_type="application/pdf",
                    headers={"Content-Disposition": f"attachment; filename*=UTF-8''{quote(name)}",
                             "X-Case-Count": str(len(cases))})


@app.get("/reports/approved.zip")
def reports_zip(date_from: str | None = None, date_to: str | None = None):
    data = report.all_hospitals_zip(date_from or None, date_to or None)
    name = f"{config.now_kst():%Y%m%d}_병원별_승인건_보고서.zip"
    return Response(data, media_type="application/zip",
                    headers={"Content-Disposition": f"attachment; filename*=UTF-8''{quote(name)}"})


# ---------------- 검토 ----------------
@app.get("/cases", response_class=HTMLResponse)
def cases(request: Request, grade: str | None = None, status: str | None = None,
          hospital_id: str | None = None, platform: str | None = None):
    if grade is None and status is None and not request.query_params:
        grade = "명백"
        status = "pending"
    hid = int(hospital_id) if hospital_id else None
    items = db.list_cases(grade or None, status or None, hid, platform or None)
    return render(request, "cases.html", cases=items, hospitals=db.list_hospitals(),
                  f={"grade": grade or "", "status": status or "", "hospital_id": hid or "", "platform": platform or ""})


@app.get("/cases/{case_id}", response_class=HTMLResponse)
def case_detail(request: Request, case_id: int):
    c = db.get_case(case_id)
    if not c:
        raise HTTPException(404)
    nav = [r["id"] for r in db.q("SELECT id FROM judgments WHERE review_status='pending' AND grade!='해당없음' ORDER BY id")]
    nxt = next((i for i in nav if i > case_id), None)
    return render(request, "case.html", c=c, transcript=db.transcript_for(c["post_id"]), next_id=nxt)


@app.post("/cases/{case_id}")
async def case_review(request: Request, case_id: int):
    c = db.get_case(case_id)
    if not c:
        raise HTTPException(404)
    f = await request.form()
    action = f.get("action", "save")
    findings = []
    for i in range(int(f.get("n_findings", 0) or 0) + 1):
        if f.get(f"keep_{i}") != "1":
            continue
        sent = (f.get(f"sentence_{i}") or "").strip()
        if not sent:
            continue
        clause = f.get(f"clause_{i}") or "56-2-15"
        ts_raw = (f.get(f"ts_{i}") or "").strip()
        tsec = _parse_ts(ts_raw)
        findings.append({"sentence": sent, "clause": clause, "clause_label": clause_label(clause),
                         "severity": f.get(f"severity_{i}") or "strong", "note": f.get(f"note_{i}") or "",
                         "rule_id": f.get(f"rule_{i}") or "manual", "timestamp": tsec,
                         "timestamp_label": fmt_ts(tsec), "comment": (f.get(f"comment_{i}") or "").strip()})
    grade = f.get("grade") if f.get("grade") in GRADES else c["grade"]
    author_type = f.get("author_type") if f.get("author_type") in AUTHOR_TYPES else c["author_type"]
    status = {"approve": "approved", "reject": "rejected", "reset": "pending"}.get(action, c["review_status"])
    with db.tx() as conn:
        conn.execute("UPDATE judgments SET revised_findings=?, review_note=?, grade=?, review_status=?, reviewed_at=? WHERE id=?",
                     (db.jd(findings), (f.get("review_note") or "").strip(), grade, status,
                      db.ts() if action in ("approve", "reject") else c["reviewed_at"], case_id))
        if author_type != c["author_type"]:
            conn.execute("UPDATE posts SET author_type=?, author_reason=? WHERE id=?",
                         (author_type, "검토자 수정", c["post_id"]))
    if grade in ("명백",) or status == "approved":
        pipeline.write_case_pdf(case_id)
    msg = {"approve": "승인했습니다.", "reject": "반려했습니다.", "reset": "검토 대기로 되돌렸습니다."}.get(action, "저장했습니다.")
    nxt = f.get("next_id")
    if action in ("approve", "reject") and nxt:
        return RedirectResponse(f"/cases/{nxt}?msg={quote(msg)}", 303)
    return RedirectResponse(f"/cases/{case_id}?msg={quote(msg)}", 303)


def _parse_ts(s: str) -> float | None:
    if not s:
        return None
    try:
        parts = [float(x) for x in s.split(":")]
    except ValueError:
        return None
    sec = 0.0
    for p in parts:
        sec = sec * 60 + p
    return sec


@app.get("/cases/{case_id}/report.pdf")
def case_pdf(case_id: int):
    c = db.get_case(case_id)
    if not c:
        raise HTTPException(404)
    path = pipeline.write_case_pdf(case_id)
    return FileResponse(path, media_type="application/pdf", filename=f"case_{case_id}.pdf")


@app.get("/captures/{post_id}.png")
def capture_file(post_id: int):
    row = db.q1("SELECT capture_path FROM posts WHERE id=?", (post_id,))
    if not row or not row["capture_path"] or not Path(row["capture_path"]).exists():
        raise HTTPException(404)
    return FileResponse(row["capture_path"], media_type="image/png")


# ---------------- 발송 ----------------
@app.get("/dispatches", response_class=HTMLResponse)
def dispatches(request: Request):
    rows = db.q("SELECT d.*, h.name hospital_name FROM dispatches d JOIN hospitals h ON h.id=d.hospital_id ORDER BY d.id DESC LIMIT 200")
    pending = []
    for h in db.list_hospitals():
        n = len(report.approved_cases(h["id"], unsent_only=True))
        if n:
            pending.append({"h": h, "n": n})
    return render(request, "dispatches.html", rows=[dict(r) for r in rows], pending=pending,
                  smtp=report.smtp_ready(), weekly=config.get_bool("WEEKLY_SEND_ENABLED"),
                  next_weekly=scheduler.next_run(scheduler.WEEKLY_JOB))


@app.post("/dispatches/run")
def dispatch_now():
    res = report.run_weekly_dispatch(trigger="web")
    msg = " / ".join(f"{r['hospital']}: {r['status']} {r['count']}건" for r in res) or "발송할 승인 건이 없습니다."
    return RedirectResponse(f"/dispatches?msg={quote(msg)}", 303)


@app.post("/dispatches/{did}/mark-sent")
def dispatch_mark(did: int):
    with db.tx() as c:
        c.execute("UPDATE dispatches SET status='sent', error='수동 발송 완료' WHERE id=?", (did,))
    return RedirectResponse(f"/dispatches?msg={quote('발송 완료로 표시했습니다.')}", 303)


@app.get("/dispatches/{did}/file")
def dispatch_download(did: int):
    p = report.dispatch_file(did)
    if not p or not p.exists():
        raise HTTPException(404)
    return FileResponse(p, media_type="application/pdf", filename=p.name)


# ---------------- 설정 ----------------
@app.get("/settings", response_class=HTMLResponse)
def settings_page(request: Request):
    groups: dict[str, list] = {}
    for key, (default, label, secret, group) in config.SETTING_DEFS.items():
        val = config.get_setting(key)
        groups.setdefault(group, []).append({"key": key, "label": label, "secret": secret,
                                             "value": "" if secret else val, "is_set": bool(val), "default": default})
    return render(request, "settings.html", groups=groups)


@app.post("/settings")
async def settings_save(request: Request):
    f = await request.form()
    for key, (_d, _l, secret, _g) in config.SETTING_DEFS.items():
        if key not in f:
            continue
        val = (f.get(key) or "").strip()
        if secret and not val:
            if f.get(f"clear_{key}") == "1":
                db.set_setting(key, "")
            continue  # 비밀값은 빈칸이면 기존 값 유지
        db.set_setting(key, val)
    scheduler.reload()
    return RedirectResponse(f"/settings?msg={quote('저장했습니다. 일정 변경은 즉시 반영됩니다.')}", 303)

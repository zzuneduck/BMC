"""매일 수집 → 작성자 구분 → 판정 → (명백/애매) 캡처 → (명백) 건별 PDF.

중복 방지: 검색 결과 ID를 seen_refs에서 먼저 걸러 본문·STT를 다시 가져오지 않고,
posts(platform, external_id) / judgments(post_id) UNIQUE 제약으로 이중 저장·이중 판정을 막는다."""
from __future__ import annotations

import logging
import sqlite3
import threading
import traceback
from datetime import datetime, timedelta

from . import config, db
from .capture import capture, capture_path_for
from .classifier import classify_author
from .collectors import Collector, FullPost, Ref, default_collectors
from .judge import judge
from .normalize import canonical
from .pdf_report import build_case_pdf

log = logging.getLogger(__name__)
RUN_LOCK = threading.Lock()


class RunLog:
    def __init__(self):
        self.lines: list[str] = []

    def __call__(self, msg: str):
        log.info(msg)
        self.lines.append(f"[{config.now_kst().strftime('%H:%M:%S')}] {msg}")


def _since(h: dict) -> datetime:
    if h.get("last_collected_at"):
        return datetime.fromisoformat(h["last_collected_at"]) - timedelta(hours=1)
    return config.now_kst() - timedelta(days=config.get_int("LOOKBACK_DAYS", 3))


def _too_old(published: datetime | None, since: datetime) -> bool:
    # 날짜만 주는 채널(네이버 postdate 등)이 있어 날짜 단위로 비교, 중복은 seen_refs가 막는다
    return bool(published) and published.astimezone(config.KST).date() < since.astimezone(config.KST).date()


def _is_seen(platform: str, ext_id: str) -> bool:
    return db.q1("SELECT 1 FROM seen_refs WHERE platform=? AND external_id=?", (platform, ext_id)) is not None


def _mark_seen(platform: str, ext_id: str, status: str) -> None:
    with db.tx() as c:
        c.execute("INSERT OR IGNORE INTO seen_refs(platform, external_id, first_seen_at, status) VALUES(?,?,?,?)",
                  (platform, ext_id, db.ts(), status))


def _normalize_ref(ref: Ref) -> Ref:
    c = canonical(ref.url) if ref.url else None
    if c and c[0] == ref.platform and ref.platform in ("naver_blog", "youtube"):
        ref.external_id = c[1]
    return ref


def store_post(h: dict, fp: FullPost, keyword: str) -> int | None:
    """새 게시물이면 저장하고 post_id 반환, 이미 있으면 None."""
    ref = fp.ref
    full_text = "\n".join([ref.title, fp.content, *(s["text"] for s in fp.transcript)])
    a_type, a_reason = classify_author(ref.platform, ref.author_id, ref.author_name, full_text, h, fp.markers)
    try:
        with db.tx() as c:
            cur = c.execute(
                "INSERT INTO posts(hospital_id, platform, external_id, url, title, content, author_name, author_id, "
                "published_at, collected_at, matched_keyword, author_type, author_reason, extra) "
                "VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (h["id"], ref.platform, ref.external_id, ref.url, ref.title, fp.content, ref.author_name,
                 ref.author_id, ref.published_at.isoformat() if ref.published_at else None, db.ts(), keyword,
                 a_type, a_reason, db.jd(fp.extra)),
            )
            pid = cur.lastrowid
            for i, s in enumerate(fp.transcript):
                c.execute("INSERT INTO transcripts(post_id, seq, start_sec, end_sec, text, source) VALUES(?,?,?,?,?,?)",
                          (pid, i, s["start_sec"], s["end_sec"], s["text"], s.get("source", "stt")))
    except sqlite3.IntegrityError:
        return None
    return pid


def judge_post(post_id: int, hospital: dict, do_capture: bool = True) -> dict | None:
    """판정은 게시물당 1회 (judgments.post_id UNIQUE)."""
    if db.q1("SELECT 1 FROM judgments WHERE post_id=?", (post_id,)):
        return None
    post = dict(db.q1("SELECT * FROM posts WHERE id=?", (post_id,)))
    transcript = db.transcript_for(post_id)
    j = judge(post, transcript, hospital)
    try:
        with db.tx() as c:
            cur = c.execute("INSERT INTO judgments(post_id, grade, findings, summary, engine, judged_at) VALUES(?,?,?,?,?,?)",
                            (post_id, j.grade, db.jd(j.findings), j.summary, j.engine, db.ts()))
            case_id = cur.lastrowid
    except sqlite3.IntegrityError:
        return None
    if j.grade in ("명백", "애매") and do_capture:
        path, mode = capture(post, j.findings, capture_path_for(post_id))
        if path:
            with db.tx() as c:
                c.execute("UPDATE posts SET capture_path=?, captured_at=?, extra=json_set(extra, '$.capture_mode', ?) WHERE id=?",
                          (str(path), db.ts(), mode, post_id))
    if j.grade == "명백":
        write_case_pdf(case_id)
    return {"case_id": case_id, "grade": j.grade}


def write_case_pdf(case_id: int) -> str:
    case = db.get_case(case_id)
    pdf = build_case_pdf(case, db.transcript_for(case["post_id"]))
    path = config.data_dir() / "cases" / f"case_{case_id}.pdf"
    path.write_bytes(pdf)
    with db.tx() as c:
        c.execute("UPDATE judgments SET case_pdf_path=? WHERE id=?", (str(path), case_id))
    return str(path)


def collect_hospital(h: dict, collectors: list[Collector], logf: RunLog, stats: dict, do_capture: bool = True) -> None:
    since = _since(h)
    started = config.now_kst()
    run_seen: set[tuple[str, str]] = set()
    for col in collectors:
        if not col.enabled():
            continue
        for kw in db.search_terms(h):
            try:
                refs = col.search(kw, since, h)
            except Exception as e:
                logf(f"  ! {h['name']} / {col.platform} / '{kw}' 검색 실패: {e}")
                stats["errors"] += 1
                continue
            for ref in refs:
                ref = _normalize_ref(ref)
                key = (ref.platform, ref.external_id)
                stats["found"] += 1
                if key in run_seen or _is_seen(*key):
                    stats["duplicates"] += 1
                    continue
                run_seen.add(key)
                if _too_old(ref.published_at, since):
                    _mark_seen(*key, "old")
                    continue
                try:
                    fp = col.fetch(ref)
                except Exception as e:
                    logf(f"  ! 본문 수집 실패 {ref.url}: {e}")
                    stats["errors"] += 1
                    continue  # seen 처리하지 않음 → 다음 회차에 재시도
                if _too_old(fp.ref.published_at, since):
                    _mark_seen(*key, "old")
                    continue
                pid = store_post(h, fp, kw)
                _mark_seen(*key, "stored")
                if pid is None:
                    stats["duplicates"] += 1
                    continue
                stats["new_posts"] += 1
                res = judge_post(pid, h, do_capture)
                if res:
                    stats[res["grade"]] = stats.get(res["grade"], 0) + 1
    with db.tx() as c:
        c.execute("UPDATE hospitals SET last_collected_at=? WHERE id=?", (started.isoformat(timespec="seconds"), h["id"]))


def run_collection(kind: str = "manual", trigger: str = "", collectors: list[Collector] | None = None,
                   do_capture: bool = True) -> int | None:
    """모든 활성 병원 수집·판정. 이미 실행 중이면 None."""
    if not RUN_LOCK.acquire(blocking=False):
        log.info("이미 수집이 실행 중입니다.")
        return None
    try:
        with db.tx() as c:
            run_id = c.execute("INSERT INTO runs(kind, trigger, started_at) VALUES(?,?,?)",
                               (kind, trigger, db.ts())).lastrowid
        logf = RunLog()
        stats = {"hospitals": 0, "found": 0, "new_posts": 0, "duplicates": 0, "errors": 0, "명백": 0, "애매": 0, "해당없음": 0}
        status = "success"
        try:
            cols = collectors if collectors is not None else default_collectors()
            active = [c.platform for c in cols if c.enabled()]
            logf(f"수집 시작 — 채널: {', '.join(active) or '없음'}")
            for h in db.list_hospitals(active_only=True):
                logf(f"▶ {h['name']}")
                collect_hospital(h, cols, logf, stats, do_capture)
                stats["hospitals"] += 1
            logf(f"완료 — 신규 {stats['new_posts']}건 (명백 {stats['명백']}, 애매 {stats['애매']}, 해당없음 {stats['해당없음']}), "
                 f"중복 건너뜀 {stats['duplicates']}건, 오류 {stats['errors']}건")
        except Exception:
            status = "failed"
            logf(traceback.format_exc())
        with db.tx() as c:
            c.execute("UPDATE runs SET finished_at=?, status=?, stats=?, log=? WHERE id=?",
                      (db.ts(), status, db.jd(stats), "\n".join(logf.lines), run_id))
        return run_id
    finally:
        RUN_LOCK.release()


def run_in_background(kind: str = "manual", trigger: str = "") -> bool:
    if RUN_LOCK.locked():
        return False
    threading.Thread(target=run_collection, kwargs={"kind": kind, "trigger": trigger}, daemon=True).start()
    return True

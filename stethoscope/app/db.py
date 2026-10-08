"""SQLite 저장소. 게시물 중복 방지는 (platform, external_id) UNIQUE 제약으로 보장한다."""
from __future__ import annotations

import json
import sqlite3
import threading
from contextlib import contextmanager
from typing import Any, Iterable

from .config import data_dir, now_kst

_local = threading.local()
_init_lock = threading.Lock()
_initialized: set[str] = set()

SCHEMA = """
CREATE TABLE IF NOT EXISTS hospitals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    directors TEXT NOT NULL DEFAULT '[]',          -- 원장 이름 목록
    keywords TEXT NOT NULL DEFAULT '[]',           -- 추가 검색 키워드
    official_accounts TEXT NOT NULL DEFAULT '{}',  -- {platform: [계정 id/이름]}
    health_center_name TEXT DEFAULT '',
    health_center_email TEXT DEFAULT '',
    address TEXT DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    last_collected_at TEXT
);

-- 검색 결과로 확인한 모든 게시물 ID (기간 밖이라 저장하지 않은 것 포함) → 재조회 방지
CREATE TABLE IF NOT EXISTS seen_refs (
    platform TEXT NOT NULL,
    external_id TEXT NOT NULL,
    first_seen_at TEXT NOT NULL,
    status TEXT NOT NULL,
    PRIMARY KEY (platform, external_id)
);

CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id),
    platform TEXT NOT NULL,
    external_id TEXT NOT NULL,
    url TEXT NOT NULL,
    title TEXT DEFAULT '',
    content TEXT DEFAULT '',
    author_name TEXT DEFAULT '',
    author_id TEXT DEFAULT '',
    published_at TEXT,
    collected_at TEXT NOT NULL,
    matched_keyword TEXT DEFAULT '',
    author_type TEXT DEFAULT 'general',
    author_reason TEXT DEFAULT '',
    capture_path TEXT,
    captured_at TEXT,
    extra TEXT DEFAULT '{}',
    UNIQUE (platform, external_id)
);

CREATE TABLE IF NOT EXISTS transcripts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    seq INTEGER NOT NULL,
    start_sec REAL NOT NULL,
    end_sec REAL NOT NULL,
    text TEXT NOT NULL,
    source TEXT NOT NULL                 -- caption / auto_caption / stt
);

CREATE TABLE IF NOT EXISTS judgments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL UNIQUE REFERENCES posts(id) ON DELETE CASCADE,
    grade TEXT NOT NULL,                 -- 명백 / 애매 / 해당없음
    findings TEXT NOT NULL DEFAULT '[]',
    summary TEXT DEFAULT '',
    engine TEXT DEFAULT 'rule',
    judged_at TEXT NOT NULL,
    review_status TEXT NOT NULL DEFAULT 'pending',   -- pending / approved / rejected
    revised_findings TEXT,               -- 검토자가 수정한 위반 문장/조항
    review_note TEXT DEFAULT '',
    reviewed_at TEXT,
    case_pdf_path TEXT,
    dispatch_id INTEGER REFERENCES dispatches(id)
);

CREATE TABLE IF NOT EXISTS dispatches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id),
    created_at TEXT NOT NULL,
    period_from TEXT,
    period_to TEXT,
    recipients TEXT DEFAULT '',
    pdf_path TEXT,
    case_count INTEGER DEFAULT 0,
    status TEXT NOT NULL,                -- sent / ready / failed
    error TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kind TEXT NOT NULL,                  -- daily / manual / weekly
    trigger TEXT DEFAULT '',
    started_at TEXT NOT NULL,
    finished_at TEXT,
    status TEXT NOT NULL DEFAULT 'running',
    stats TEXT DEFAULT '{}',
    log TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

CREATE INDEX IF NOT EXISTS idx_posts_hospital ON posts(hospital_id);
CREATE INDEX IF NOT EXISTS idx_judg_status ON judgments(review_status, grade);
"""


def db_path() -> str:
    return str(data_dir() / "stethoscope.db")


def _connect() -> sqlite3.Connection:
    path = db_path()
    conn = sqlite3.connect(path, timeout=30, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    with _init_lock:
        if path not in _initialized:
            conn.executescript(SCHEMA)
            _initialized.add(path)
    return conn


def conn() -> sqlite3.Connection:
    c = getattr(_local, "conn", None)
    if c is None or getattr(_local, "path", None) != db_path():
        c = _connect()
        _local.conn = c
        _local.path = db_path()
    return c


def reset_connection() -> None:
    """테스트에서 데이터 디렉터리를 바꿀 때 사용."""
    c = getattr(_local, "conn", None)
    if c is not None:
        c.close()
    _local.conn = None
    _initialized.clear()


@contextmanager
def tx():
    c = conn()
    try:
        yield c
        c.commit()
    except Exception:
        c.rollback()
        raise


def q(sql: str, params: Iterable[Any] = ()) -> list[sqlite3.Row]:
    return conn().execute(sql, tuple(params)).fetchall()


def q1(sql: str, params: Iterable[Any] = ()) -> sqlite3.Row | None:
    return conn().execute(sql, tuple(params)).fetchone()


def jl(value: Any, default: Any) -> Any:
    if value in (None, ""):
        return default
    try:
        return json.loads(value)
    except (TypeError, ValueError):
        return default


def jd(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False)


def ts() -> str:
    return now_kst().isoformat(timespec="seconds")


# ---------- settings ----------
def get_setting_raw(key: str) -> str | None:
    row = q1("SELECT value FROM settings WHERE key=?", (key,))
    return row["value"] if row else None


def set_setting(key: str, value: str) -> None:
    with tx() as c:
        c.execute(
            "INSERT INTO settings(key, value) VALUES(?, ?) "
            "ON CONFLICT(key) DO UPDATE SET value=excluded.value",
            (key, value),
        )


# ---------- hospitals ----------
def hospital_dict(row: sqlite3.Row) -> dict:
    d = dict(row)
    d["directors"] = jl(d["directors"], [])
    d["keywords"] = jl(d["keywords"], [])
    d["official_accounts"] = jl(d["official_accounts"], {})
    return d


def list_hospitals(active_only: bool = False) -> list[dict]:
    sql = "SELECT * FROM hospitals"
    if active_only:
        sql += " WHERE active=1"
    return [hospital_dict(r) for r in q(sql + " ORDER BY id")]


def get_hospital(hid: int) -> dict | None:
    row = q1("SELECT * FROM hospitals WHERE id=?", (hid,))
    return hospital_dict(row) if row else None


def save_hospital(data: dict, hid: int | None = None) -> int:
    fields = (
        data["name"].strip(),
        jd(data.get("directors", [])),
        jd(data.get("keywords", [])),
        jd(data.get("official_accounts", {})),
        data.get("health_center_name", ""),
        data.get("health_center_email", ""),
        data.get("address", ""),
        1 if data.get("active", True) else 0,
    )
    with tx() as c:
        if hid:
            c.execute(
                "UPDATE hospitals SET name=?, directors=?, keywords=?, official_accounts=?, "
                "health_center_name=?, health_center_email=?, address=?, active=? WHERE id=?",
                fields + (hid,),
            )
            return hid
        cur = c.execute(
            "INSERT INTO hospitals(name, directors, keywords, official_accounts, "
            "health_center_name, health_center_email, address, active, created_at) "
            "VALUES(?,?,?,?,?,?,?,?,?)",
            fields + (ts(),),
        )
        return cur.lastrowid


def search_terms(h: dict) -> list[str]:
    """병원명, 원장명(+병원명), 추가 키워드 → 중복 제거된 검색어 목록."""
    terms: list[str] = [h["name"]]
    for d in h["directors"]:
        terms.append(f"{d} 원장")
        terms.append(f"{h['name']} {d}")
    terms.extend(h["keywords"])
    seen, out = set(), []
    for t in terms:
        t = " ".join(t.split())
        if t and t not in seen:
            seen.add(t)
            out.append(t)
    return out


# ---------- cases ----------
def case_dict(row: sqlite3.Row) -> dict:
    d = dict(row)
    d["findings"] = jl(d.get("findings"), [])
    d["revised_findings"] = jl(d.get("revised_findings"), None)
    d["extra"] = jl(d.get("extra"), {})
    d["final_findings"] = d["revised_findings"] if d["revised_findings"] is not None else d["findings"]
    return d


CASE_SELECT = """
SELECT j.id AS case_id, j.grade, j.findings, j.summary, j.engine, j.judged_at,
       j.review_status, j.revised_findings, j.review_note, j.reviewed_at, j.case_pdf_path,
       j.dispatch_id,
       p.id AS post_id, p.platform, p.external_id, p.url, p.title, p.content, p.author_name,
       p.author_id, p.published_at, p.collected_at, p.matched_keyword, p.author_type,
       p.author_reason, p.capture_path, p.captured_at, p.extra,
       h.id AS hospital_id, h.name AS hospital_name
FROM judgments j JOIN posts p ON p.id = j.post_id JOIN hospitals h ON h.id = p.hospital_id
"""


def get_case(case_id: int) -> dict | None:
    row = q1(CASE_SELECT + " WHERE j.id=?", (case_id,))
    return case_dict(row) if row else None


def list_cases(
    grade: str | None = None,
    status: str | None = None,
    hospital_id: int | None = None,
    platform: str | None = None,
    limit: int = 500,
) -> list[dict]:
    where, params = [], []
    if grade:
        where.append("j.grade=?")
        params.append(grade)
    if status:
        where.append("j.review_status=?")
        params.append(status)
    if hospital_id:
        where.append("h.id=?")
        params.append(hospital_id)
    if platform:
        where.append("p.platform=?")
        params.append(platform)
    sql = CASE_SELECT + (" WHERE " + " AND ".join(where) if where else "")
    sql += " ORDER BY p.collected_at DESC, j.id DESC LIMIT ?"
    params.append(limit)
    return [case_dict(r) for r in q(sql, params)]


def transcript_for(post_id: int) -> list[dict]:
    return [dict(r) for r in q("SELECT * FROM transcripts WHERE post_id=? ORDER BY seq", (post_id,))]

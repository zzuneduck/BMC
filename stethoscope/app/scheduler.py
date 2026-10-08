"""매일 18:00(KST) 수집·분석, 주 1회 보건소 발송.

병원을 등록하면 별도 조작 없이 다음 정해진 시각에 활성 병원 전체가 수집된다.
서버가 꺼져 있어 오늘 정해진 시각을 놓쳤다면, 켜질 때 바로 한 번 따라잡기 실행한다."""
from __future__ import annotations

import logging
import threading
from datetime import datetime

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from . import config, db, pipeline, report
from .config import KST

log = logging.getLogger(__name__)

DAILY_JOB = "daily_collect"
WEEKLY_JOB = "weekly_dispatch"
_scheduler: BackgroundScheduler | None = None


def daily_trigger() -> CronTrigger:
    h, m = config.parse_hhmm(config.get_setting("DAILY_RUN_TIME"), (18, 0))
    return CronTrigger(hour=h, minute=m, timezone=KST)


def weekly_trigger() -> CronTrigger:
    h, m = config.parse_hhmm(config.get_setting("WEEKLY_SEND_TIME"), (9, 0))
    day = (config.get_setting("WEEKLY_SEND_DAY") or "mon").lower()[:3]
    return CronTrigger(day_of_week=day, hour=h, minute=m, timezone=KST)


def _daily_job():
    pipeline.run_collection(kind="daily", trigger="schedule")


def _weekly_job():
    report.run_weekly_dispatch(trigger="schedule")


def configure(s: BackgroundScheduler) -> None:
    s.add_job(_daily_job, daily_trigger(), id=DAILY_JOB, replace_existing=True,
              misfire_grace_time=3600, coalesce=True, max_instances=1)
    if config.get_bool("WEEKLY_SEND_ENABLED"):
        s.add_job(_weekly_job, weekly_trigger(), id=WEEKLY_JOB, replace_existing=True,
                  misfire_grace_time=6 * 3600, coalesce=True, max_instances=1)
    elif s.get_job(WEEKLY_JOB):
        s.remove_job(WEEKLY_JOB)


def start(catch_up: bool = True) -> BackgroundScheduler:
    global _scheduler
    if _scheduler and _scheduler.running:
        return _scheduler
    _scheduler = BackgroundScheduler(timezone=KST)
    configure(_scheduler)
    _scheduler.start()
    log.info("스케줄러 시작 — 다음 수집: %s", next_run(DAILY_JOB))
    if catch_up and missed_today():
        log.info("오늘 예정 수집을 놓쳐 지금 실행합니다.")
        threading.Thread(target=pipeline.run_collection, kwargs={"kind": "daily", "trigger": "catch-up"}, daemon=True).start()
    return _scheduler


def reload() -> None:
    if _scheduler and _scheduler.running:
        configure(_scheduler)


def shutdown() -> None:
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
    _scheduler = None


def next_run(job_id: str = DAILY_JOB) -> datetime | None:
    if _scheduler:
        job = _scheduler.get_job(job_id)
        if job and job.next_run_time:
            return job.next_run_time.astimezone(KST)
    return None


def expected_next_daily(now: datetime | None = None) -> datetime:
    now = now or config.now_kst()
    return daily_trigger().get_next_fire_time(None, now).astimezone(KST)


def missed_today(now: datetime | None = None) -> bool:
    now = now or config.now_kst()
    h, m = config.parse_hhmm(config.get_setting("DAILY_RUN_TIME"), (18, 0))
    due = now.replace(hour=h, minute=m, second=0, microsecond=0)
    if now < due or not db.list_hospitals(active_only=True):
        return False
    row = db.q1("SELECT 1 FROM runs WHERE kind='daily' AND started_at >= ?", (due.isoformat(timespec="seconds"),))
    return row is None

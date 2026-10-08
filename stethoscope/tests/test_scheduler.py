"""완료 조건 1: 테스트 병원 3곳을 등록하면 다음 18시에 수집이 자동 실행된다."""
from datetime import datetime

from apscheduler.schedulers.background import BackgroundScheduler

from app import db, pipeline, scheduler
from app.config import KST


def test_next_daily_run_is_18_kst(three_hospitals):
    before = datetime(2026, 10, 8, 10, 30, tzinfo=KST)
    assert scheduler.expected_next_daily(before) == datetime(2026, 10, 8, 18, 0, tzinfo=KST)
    after = datetime(2026, 10, 8, 18, 0, 1, tzinfo=KST)
    assert scheduler.expected_next_daily(after) == datetime(2026, 10, 9, 18, 0, tzinfo=KST)


def test_scheduler_job_registered_and_fires_for_all_hospitals(three_hospitals, fakes, monkeypatch, fake_stt):
    naver, yt = fakes
    calls = []

    def fake_daily():
        calls.append(pipeline.run_collection(kind="daily", trigger="schedule", collectors=[naver, yt], do_capture=False))

    monkeypatch.setattr(scheduler, "_daily_job", fake_daily)
    s = BackgroundScheduler(timezone=KST)
    scheduler.configure(s)
    job = s.get_job(scheduler.DAILY_JOB)
    trig = job.trigger
    nxt = trig.get_next_fire_time(None, datetime(2026, 10, 8, 9, 0, tzinfo=KST))
    assert (nxt.hour, nxt.minute, nxt.utcoffset().total_seconds()) == (18, 0, 9 * 3600)

    # 18:00에 스케줄러가 호출하는 함수를 그대로 실행 → 3곳 모두 수집
    job.func()
    run = db.q1("SELECT * FROM runs WHERE id=?", (calls[0],))
    stats = db.jl(run["stats"], {})
    assert run["kind"] == "daily" and run["status"] == "success"
    assert stats["hospitals"] == 3
    hospitals_with_posts = {r["hospital_id"] for r in db.q("SELECT DISTINCT hospital_id FROM posts")}
    assert hospitals_with_posts == set(three_hospitals)
    assert all(h["last_collected_at"] for h in db.list_hospitals())


def test_missed_run_catch_up(three_hospitals):
    assert scheduler.missed_today(datetime(2026, 10, 8, 19, 0, tzinfo=KST)) is True
    assert scheduler.missed_today(datetime(2026, 10, 8, 17, 0, tzinfo=KST)) is False
    with db.tx() as c:
        c.execute("INSERT INTO runs(kind, trigger, started_at, status) VALUES('daily','schedule','2026-10-08T18:00:02+09:00','success')")
    assert scheduler.missed_today(datetime(2026, 10, 8, 19, 0, tzinfo=KST)) is False


def test_run_time_setting_changes_schedule():
    db.set_setting("DAILY_RUN_TIME", "17:30")
    nxt = scheduler.expected_next_daily(datetime(2026, 10, 8, 9, 0, tzinfo=KST))
    assert (nxt.hour, nxt.minute) == (17, 30)

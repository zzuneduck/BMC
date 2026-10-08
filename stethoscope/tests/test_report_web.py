"""완료 조건 5 + 검토 화면: 수정사항 입력, 승인·반려, 승인 건만 병원별 PDF."""
import io
import zipfile

from fastapi.testclient import TestClient
from pypdf import PdfReader

from app import db, pipeline, report
from app.web import app


def _text(pdf: bytes) -> str:
    return "\n".join(p.extract_text() or "" for p in PdfReader(io.BytesIO(pdf)).pages)


def test_register_hospital_via_web_shows_next_run():
    c = TestClient(app)
    r = c.post("/hospitals/new", data={"name": "테스트의원", "directors": "가나다\n라마바", "keywords": "",
                                        "health_center_email": "a@b.kr", "active": "1"}, follow_redirects=False)
    assert r.status_code == 303 and "18%3A00" in r.headers["location"]
    h = db.list_hospitals()[0]
    assert h["directors"] == ["가나다", "라마바"]
    assert "가나다 원장" in db.search_terms(h)
    assert c.get("/hospitals").status_code == 200
    assert c.get("/").status_code == 200


def test_review_edit_approve_reject_and_hospital_pdf(three_hospitals, fakes, fake_stt):
    naver, yt = fakes
    pipeline.run_collection(collectors=[naver, yt], do_capture=False)
    c = TestClient(app)
    clear = db.list_cases(grade="명백", hospital_id=three_hospitals[0])
    assert len(clear) >= 2
    a, b = clear[0], clear[1]

    page = c.get(f"/cases/{a['case_id']}")
    assert page.status_code == 200 and "검토 · 수정사항" in page.text

    # a: 첫 문장만 남기고 의견 수정 + 직접 문장 추가 → 승인
    n = len(a["findings"])
    form = {"n_findings": str(n), "grade": "명백", "author_type": a["author_type"], "action": "approve",
            "review_note": "검토자 확인: 공식 계정 광고"}
    for i, f in enumerate(a["findings"]):
        form.update({f"keep_{i}": "1" if i == 0 else "0", f"sentence_{i}": f["sentence"], f"clause_{i}": f["clause"],
                     f"ts_{i}": f["timestamp_label"], f"comment_{i}": "수정된 의견" if i == 0 else ""})
    form.update({f"keep_{n}": "1", f"sentence_{n}": "직접 추가한 위반 문장", f"clause_{n}": "56-2-8", f"ts_{n}": "1:05"})
    r = c.post(f"/cases/{a['case_id']}", data=form, follow_redirects=False)
    assert r.status_code == 303
    a2 = db.get_case(a["case_id"])
    assert a2["review_status"] == "approved"
    assert len(a2["final_findings"]) == 2
    assert a2["final_findings"][0]["comment"] == "수정된 의견"
    assert a2["final_findings"][1]["timestamp"] == 65.0

    # b: 반려
    r = c.post(f"/cases/{b['case_id']}", data={"n_findings": "0", "action": "reject"}, follow_redirects=False)
    assert db.get_case(b["case_id"])["review_status"] == "rejected"

    # 병원별 PDF에는 승인 건만
    r = c.get(f"/hospitals/{three_hospitals[0]}/report.pdf")
    assert r.status_code == 200 and r.headers["x-case-count"] == "1"
    text = _text(r.content)
    assert a["url"] in text.replace("\n", "")
    assert b["url"] not in text.replace("\n", "")
    assert "직접 추가한 위반 문장" in text and "검토자 확인" in text and "수정된 의견" in text

    # 승인 건 없는 병원은 ZIP에서 제외, 승인 건 있는 병원만 PDF로 묶임
    z = zipfile.ZipFile(io.BytesIO(c.get("/reports/approved.zip").content))
    assert len(z.namelist()) == 1 and z.namelist()[0].startswith("청진피부과")


def test_case_pdf_contains_required_fields(three_hospitals, fakes, fake_stt):
    naver, yt = fakes
    pipeline.run_collection(collectors=[naver, yt], do_capture=False)
    case = db.list_cases(grade="명백", platform="youtube")[0]
    text = _text(open(case["case_pdf_path"], "rb").read()).replace("\n", "")
    for needle in (case["url"], "수집 시각", "위반 의심 문장", "제56조", "[00:04]"):
        assert needle in text, needle


def test_weekly_dispatch_only_approved_and_once(three_hospitals, fakes, fake_stt, monkeypatch):
    naver, yt = fakes
    pipeline.run_collection(collectors=[naver, yt], do_capture=False)
    case = db.list_cases(grade="명백")[0]
    with db.tx() as c:
        c.execute("UPDATE judgments SET review_status='approved', reviewed_at=? WHERE id=?", (db.ts(), case["case_id"]))
    sent = []
    monkeypatch.setattr(report, "smtp_ready", lambda: True)
    monkeypatch.setattr(report, "send_mail", lambda to, subj, body, att: sent.append((to, subj, att)))
    res = report.run_weekly_dispatch(trigger="test")
    assert [r["status"] for r in res] == ["sent"]
    assert sent[0][0] == ["health@example.go.kr"] and sent[0][2][0][1][:4] == b"%PDF"
    assert report.run_weekly_dispatch(trigger="test") == []  # 같은 건 재발송 안 함


def test_settings_page_saves_and_keeps_secrets():
    c = TestClient(app)
    c.post("/settings", data={"DAILY_RUN_TIME": "18:00", "NAVER_CLIENT_SECRET": "s3cret"})
    c.post("/settings", data={"DAILY_RUN_TIME": "18:00", "NAVER_CLIENT_SECRET": ""})
    assert db.get_setting_raw("NAVER_CLIENT_SECRET") == "s3cret"
    assert "s3cret" not in c.get("/settings").text

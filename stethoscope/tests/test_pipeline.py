"""완료 조건 2·3·4: STT 스크립트+타임스탬프, 중복 방지, 작성자 3분류."""
from app import db, pipeline


def _run(fakes, **kw):
    naver, yt = fakes
    return pipeline.run_collection(kind="manual", collectors=[naver, yt], do_capture=False, **kw)


def test_youtube_without_captions_gets_stt_with_timestamps(three_hospitals, fakes, fake_stt):
    _run(fakes)
    post = db.q1("SELECT * FROM posts WHERE platform='youtube'")
    assert post is not None
    assert len(fake_stt.calls) == 1  # 자막이 없으니 STT 호출
    segs = db.transcript_for(post["id"])
    assert [s["source"] for s in segs] == ["stt"] * 3
    assert [s["start_sec"] for s in segs] == [0.0, 4.2, 65.0]
    case = db.list_cases(platform="youtube")[0]
    stamped = [f for f in case["findings"] if f["timestamp"] is not None]
    assert {f["timestamp_label"] for f in stamped} >= {"00:04", "01:05"}
    assert case["grade"] == "명백"  # '#광고' 표기 → 체험단/광고 주체 + 부작용 없음 단정


def test_same_post_not_collected_or_judged_twice(three_hospitals, fakes, fake_stt):
    naver, yt = fakes
    _run(fakes)
    posts1 = db.q1("SELECT COUNT(*) n FROM posts")["n"]
    judg1 = db.q1("SELECT COUNT(*) n FROM judgments")["n"]
    fetch1 = (naver.fetch_calls, yt.fetch_calls, len(fake_stt.calls))
    # 시간이 지나 다시 수집해도 같은 게시물은 다시 가져오거나 판정하지 않는다
    with db.tx() as c:
        c.execute("UPDATE hospitals SET last_collected_at=NULL")
    run2 = _run(fakes)
    assert db.q1("SELECT COUNT(*) n FROM posts")["n"] == posts1
    assert db.q1("SELECT COUNT(*) n FROM judgments")["n"] == judg1
    assert (naver.fetch_calls, yt.fetch_calls, len(fake_stt.calls)) == fetch1
    stats = db.jl(db.q1("SELECT stats FROM runs WHERE id=?", (run2,))["stats"], {})
    assert stats["new_posts"] == 0 and stats["duplicates"] >= posts1


def test_url_variants_are_same_post(three_hospitals):
    from app.collectors import FullPost, Ref

    h = db.list_hospitals()[0]
    for url in ("https://blog.naver.com/abc/123", "https://m.blog.naver.com/PostView.naver?blogId=abc&logNo=123"):
        ref = pipeline._normalize_ref(Ref("naver_blog", "x", url))
        pid = pipeline.store_post(h, FullPost(ref=ref, content="청진피부과"), "청진피부과")
        if url.startswith("https://blog"):
            assert pid is not None
        else:
            assert pid is None
    assert db.q1("SELECT COUNT(*) n FROM posts")["n"] == 1


def test_judge_once_per_post(three_hospitals, fakes, fake_stt):
    _run(fakes)
    pid = db.q1("SELECT id FROM posts LIMIT 1")["id"]
    assert pipeline.judge_post(pid, db.list_hospitals()[0], do_capture=False) is None


def test_author_types(three_hospitals, fakes, fake_stt):
    _run(fakes)
    types = {r["external_id"]: (r["author_type"], r["author_reason"]) for r in db.q("SELECT * FROM posts")}
    assert types["cheongjin_official/223000000001"][0] == "official"
    assert types["happyreviewer/223000000002"][0] == "sponsored"
    assert types["myself_mom/223000000003"][0] == "general"
    assert types["bareun_dental/223000000011"][0] == "official"  # 작성자명에 병원명 포함
    assert types["vid000001"][0] == "official"  # 채널명 '청진피부과TV'


def test_grades(three_hospitals, fakes, fake_stt):
    _run(fakes)
    g = {c["external_id"]: c["grade"] for c in db.list_cases()}
    assert g["cheongjin_official/223000000001"] == "명백"   # 공식계정 + 최고/부작용 없음/50% 할인
    assert g["happyreviewer/223000000002"] == "명백"        # 체험단 + 치료경험담
    assert g["myself_mom/223000000003"] == "해당없음"       # 일반 후기, 위반 문구 없음
    assert g["spring_fan/223000000021"] == "애매"          # 일반 후기지만 경험담·비교 문구
    assert g["bareun_dental/223000000011"] == "해당없음"    # 심의번호·부작용 고지 있음


def test_clear_case_has_pdf(three_hospitals, fakes, fake_stt):
    _run(fakes)
    for c in db.list_cases(grade="명백"):
        assert c["case_pdf_path"] and open(c["case_pdf_path"], "rb").read(4) == b"%PDF"

from app.classifier import classify_author
from app.collectors.youtube import pick_subtitle
from app.law56 import scan_units, split_sentences
from app.normalize import canonical
from app.transcript import parse_vtt

H = {"name": "청진피부과", "directors": ["홍길동"], "official_accounts": {"instagram": ["cheongjin.derma"]}}


def test_rules_hit_expected_clauses():
    units = [(s, None) for s in split_sentences(
        "국내 최고의 의료진이 함께합니다. 부작용 없는 시술! 타 병원과 달리 정품만 씁니다. 30% 할인 이벤트. 후기 작성 시 적립금 증정")]
    clauses = {h.clause for h in scan_units(units)}
    assert {"56-2-8", "56-2-3", "56-2-4", "56-2-13", "56-2-15"} <= clauses


def test_neutral_text_no_hits():
    assert scan_units([("진료 시간은 평일 9시부터 6시까지입니다", None)]) == []


def test_classify_author():
    assert classify_author("instagram", "cheongjin.derma", "", "", H)[0] == "official"
    assert classify_author("naver_blog", "x", "y", "#협찬 받은 리프팅", H)[0] == "sponsored"
    assert classify_author("naver_blog", "x", "y", "그냥 후기", H, markers="https://revu.net/c/1")[0] == "sponsored"
    assert classify_author("naver_blog", "x", "y", "내돈내산 후기", H)[0] == "general"


def test_canonical_ids():
    assert canonical("https://m.blog.naver.com/PostView.naver?blogId=ab&logNo=12") == ("naver_blog", "ab/12")
    assert canonical("https://www.youtube.com/shorts/abcdefghijk") == ("youtube", "abcdefghijk")
    assert canonical("https://youtu.be/abcdefghijk?t=3") == ("youtube", "abcdefghijk")
    assert canonical("https://www.instagram.com/reel/C0dE_1/") == ("instagram", "C0dE_1")
    assert canonical("https://www.threads.net/@user/post/DAbc12") == ("threads", "DAbc12")


def test_parse_vtt_dedups_rolling_lines():
    vtt = """WEBVTT

00:00:01.000 --> 00:00:03.000
안녕하세요

00:00:03.000 --> 00:00:05.500
안녕하세요
부작용 없는 시술입니다
"""
    segs = parse_vtt(vtt)
    assert segs == [{"start_sec": 1.0, "end_sec": 3.0, "text": "안녕하세요"},
                    {"start_sec": 3.0, "end_sec": 5.5, "text": "부작용 없는 시술입니다"}]


def test_pick_subtitle_prefers_manual():
    info = {"subtitles": {"ko": [{"ext": "vtt", "url": "m"}]}, "automatic_captions": {"ko": [{"ext": "vtt", "url": "a"}]}}
    assert pick_subtitle(info) == ("m", "caption")
    assert pick_subtitle({"automatic_captions": {"ko": [{"ext": "vtt", "url": "a"}]}}) == ("a", "auto_caption")
    assert pick_subtitle({"subtitles": {}, "automatic_captions": {}}) is None

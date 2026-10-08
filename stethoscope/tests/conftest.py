import os
import sys
from datetime import timedelta
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
os.environ["STETHO_NO_SCHEDULER"] = "1"

from app import config, db, transcript  # noqa: E402
from app.collectors import Ref  # noqa: E402
from app.collectors.naver_blog import NaverBlogCollector, parse_post_html  # noqa: E402
from app.collectors.youtube import YouTubeCollector  # noqa: E402


@pytest.fixture(autouse=True)
def tmp_data(tmp_path, monkeypatch):
    monkeypatch.setenv("STETHO_DATA_DIR", str(tmp_path / "data"))
    for k in config.SETTING_DEFS:
        monkeypatch.delenv(k, raising=False)
    db.reset_connection()
    yield tmp_path / "data"
    db.reset_connection()


class FakeTranscriber:
    def __init__(self):
        self.calls = []

    def transcribe(self, path):
        self.calls.append(str(path))
        return [
            {"start_sec": 0.0, "end_sec": 4.2, "text": "안녕하세요 청진피부과 홍길동 원장입니다"},
            {"start_sec": 4.2, "end_sec": 9.8, "text": "저희 리프팅은 부작용이 전혀 없습니다"},
            {"start_sec": 65.0, "end_sec": 70.0, "text": "다른 병원보다 효과가 두 배 오래갑니다"},
        ]


@pytest.fixture
def fake_stt():
    t = FakeTranscriber()
    transcript.set_transcriber(t)
    yield t
    transcript.set_transcriber(None)


NAVER_HTML = """<html><head><meta property="og:title" content="{title}"></head><body>
<div class="blog_author"><strong>{author}</strong></div><p class="blog_date">2026. 10. 7. 14:20</p>
<div class="se-main-container"><p class="se-text-paragraph">{body}</p>
<a href="https://www.revu.net/campaign/1"><img src="https://img.example/banner.png"></a></div></body></html>"""


class FakeNaver(NaverBlogCollector):
    """검색·본문 응답을 고정한 네이버 수집기 (실제 HTML 파서는 그대로 사용)."""

    def __init__(self, posts):
        self.posts = posts  # {hospital_name: [(blog_id, log_no, author, title, body, with_revu)]}
        self.fetch_calls = 0

    def search(self, keyword, since, hospital):
        out = []
        for blog_id, log_no, author, title, body, _ in self.posts.get(hospital["name"], []):
            out.append(Ref("naver_blog", f"{blog_id}/{log_no}", f"https://blog.naver.com/{blog_id}/{log_no}",
                           title, author, blog_id, config.now_kst() - timedelta(hours=3), body[:40]))
        return out

    def fetch(self, ref):
        self.fetch_calls += 1
        for posts in self.posts.values():
            for blog_id, log_no, author, title, body, revu in posts:
                if ref.external_id == f"{blog_id}/{log_no}":
                    html = NAVER_HTML.format(title=title, author=author, body=body)
                    if not revu:
                        html = html.replace("www.revu.net", "example.com")
                    p = parse_post_html(html)
                    from app.collectors import FullPost

                    ref.title = p["title"]
                    return FullPost(ref=ref, content=p["content"], markers=p["markers"])
        raise KeyError(ref.external_id)


class FakeYouTube(YouTubeCollector):
    """자막 없는 영상 → STT 경로를 실제 build_post로 타게 한다."""

    def __init__(self, videos):
        import httpx

        super().__init__(client=httpx.Client())
        self.videos = videos  # {hospital_name: [(video_id, channel, title, description)]}
        self.fetch_calls = 0

    def search(self, keyword, since, hospital):
        return [Ref("youtube", vid, f"https://youtu.be/{vid}", title, ch, "UC" + vid)
                for vid, ch, title, _ in self.videos.get(hospital["name"], [])]

    def fetch(self, ref):
        self.fetch_calls += 1
        for vids in self.videos.values():
            for vid, ch, title, desc in vids:
                if vid == ref.external_id:
                    info = {"id": vid, "title": title, "channel": ch, "channel_id": "UC" + vid,
                            "timestamp": int((config.now_kst() - timedelta(hours=2)).timestamp()),
                            "description": desc, "subtitles": {}, "automatic_captions": {}}
                    return self.build_post(ref, info)
        raise KeyError(ref.external_id)

    def download_audio(self, url, out_dir):
        p = Path(out_dir) / "audio.m4a"
        p.write_bytes(b"fake")
        return p


HOSPITALS = [
    {"name": "청진피부과", "directors": ["홍길동"], "keywords": [],
     "official_accounts": {"naver_blog": ["cheongjin_official"], "youtube": []},
     "health_center_name": "강남구보건소", "health_center_email": "health@example.go.kr"},
    {"name": "바른치과의원", "directors": ["김바른"], "keywords": ["바른치과 임플란트"],
     "official_accounts": {}, "health_center_name": "서초구보건소", "health_center_email": "seocho@example.go.kr"},
    {"name": "새봄한의원", "directors": ["이새봄"], "keywords": [], "official_accounts": {},
     "health_center_name": "송파구보건소", "health_center_email": ""},
]

NAVER_POSTS = {
    "청진피부과": [
        ("cheongjin_official", "223000000001", "청진피부과 공식블로그", "청진피부과 리프팅 이벤트 안내",
         "청진피부과 홍길동 원장이 직접 시술합니다. 국내 최고의 리프팅 기술로 부작용 없는 시술! 이번 달 50% 할인 이벤트를 진행합니다.", False),
        ("happyreviewer", "223000000002", "행복한리뷰어", "청진피부과 리프팅 후기",
         "청진피부과에서 리프팅 받고 나서 효과가 정말 좋아졌어요. 본 포스팅은 업체로부터 소정의 원고료를 받아 작성되었습니다.", True),
        ("myself_mom", "223000000003", "동네맘", "청진피부과 다녀왔어요",
         "청진피부과 대기실이 깔끔하고 친절했어요. 주차는 건물 지하에 가능해요. 내돈내산 후기입니다.", False),
    ],
    "바른치과의원": [
        ("bareun_dental", "223000000011", "바른치과의원", "바른치과의원 임플란트 안내",
         "바른치과의원 김바른 원장입니다. 임플란트 상담은 예약제로 운영됩니다. 시술 후 붓기나 출혈 등 부작용이 있을 수 있으며 개인차가 있습니다. 의료광고심의필 제 2026-1-00001 호", False),
    ],
    "새봄한의원": [
        ("spring_fan", "223000000021", "봄날", "새봄한의원 추나 받고 왔어요",
         "새봄한의원 이새봄 원장님께 추나 치료 받고 허리가 많이 좋아졌어요. 다른 병원보다 훨씬 친절해요.", False),
    ],
}

YOUTUBE_VIDEOS = {
    "청진피부과": [("vid000001", "청진피부과TV", "홍길동 원장의 리프팅 이야기", "청진피부과 공식 채널 #광고")],
}


@pytest.fixture
def three_hospitals():
    return [db.save_hospital(h) for h in HOSPITALS]


@pytest.fixture
def fakes():
    return FakeNaver(NAVER_POSTS), FakeYouTube(YOUTUBE_VIDEOS)

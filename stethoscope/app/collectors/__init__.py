from .base import PLATFORM_LABELS, Collector, FullPost, Ref
from .meta import InstagramCollector, ThreadsCollector
from .naver_blog import NaverBlogCollector
from .youtube import YouTubeCollector


def default_collectors() -> list[Collector]:
    return [NaverBlogCollector(), YouTubeCollector(), InstagramCollector(), ThreadsCollector()]


__all__ = [
    "PLATFORM_LABELS", "Collector", "FullPost", "Ref", "default_collectors",
    "NaverBlogCollector", "YouTubeCollector", "InstagramCollector", "ThreadsCollector",
]

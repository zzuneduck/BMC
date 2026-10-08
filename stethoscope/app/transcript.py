"""영상 스크립트: 자막(수동/자동)이 있으면 자막, 없으면 STT(faster-whisper)로 타임스탬프 포함 스크립트 생성."""
from __future__ import annotations

import logging
import re
import threading
from pathlib import Path

from . import config

log = logging.getLogger(__name__)

_TIME = re.compile(r"(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{3})")


def _sec(m: re.Match) -> float:
    h = int(m.group(1) or 0)
    return h * 3600 + int(m.group(2)) * 60 + int(m.group(3)) + int(m.group(4)) / 1000


def parse_vtt(text: str) -> list[dict]:
    """WebVTT/SRT → [{start_sec, end_sec, text}]. 유튜브 자동자막의 누적 반복 줄은 제거."""
    segs: list[dict] = []
    blocks = re.split(r"\n\s*\n", text.replace("\r", ""))
    last_line = ""
    for b in blocks:
        lines = [ln for ln in b.split("\n") if ln.strip()]
        idx = next((i for i, ln in enumerate(lines) if "-->" in ln), None)
        if idx is None:
            continue
        ms = list(_TIME.finditer(lines[idx]))
        if len(ms) < 2:
            continue
        start, end = _sec(ms[0]), _sec(ms[1])
        body = []
        for ln in lines[idx + 1:]:
            ln = re.sub(r"<[^>]+>", "", ln).strip()
            if ln and ln != last_line:
                body.append(ln)
                last_line = ln
        t = " ".join(body).strip()
        if t:
            segs.append({"start_sec": round(start, 2), "end_sec": round(end, 2), "text": t})
    return segs


class Transcriber:
    """faster-whisper 래퍼. 모델은 처음 사용할 때 한 번만 로드."""

    _lock = threading.Lock()
    _model = None
    _model_key: tuple | None = None

    def transcribe(self, media_path: str | Path) -> list[dict]:
        from faster_whisper import WhisperModel

        key = (config.get_setting("STT_MODEL") or "small", config.get_setting("STT_DEVICE") or "cpu")
        with self._lock:
            if Transcriber._model is None or Transcriber._model_key != key:
                compute = "int8" if key[1] == "cpu" else "float16"
                Transcriber._model = WhisperModel(key[0], device=key[1], compute_type=compute)
                Transcriber._model_key = key
            model = Transcriber._model
        segments, _info = model.transcribe(str(media_path), language="ko", vad_filter=True, beam_size=5)
        out = []
        for s in segments:
            t = s.text.strip()
            if t:
                out.append({"start_sec": round(s.start, 2), "end_sec": round(s.end, 2), "text": t})
        return out


_default: Transcriber | None = None


def get_transcriber() -> Transcriber:
    global _default
    if _default is None:
        _default = Transcriber()
    return _default


def set_transcriber(t) -> None:
    """테스트·대체 엔진 주입용."""
    global _default
    _default = t

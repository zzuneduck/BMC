"""작성자 구분: 병원 공식 계정 / 대가성 체험단 / 일반 후기."""
from __future__ import annotations

import re

AUTHOR_TYPES = {
    "official": "병원 공식 계정",
    "sponsored": "대가성 체험단",
    "general": "일반 후기",
}

# 경제적 대가 표시 문구 (공정위 추천·보증 심사지침 표기 예시 포함)
SPONSOR_PATTERNS = [
    r"원고료",
    r"소정의\s*(원고료|수수료|사례|대가|금액|제품|서비스|시술)",
    r"체험단",
    r"협찬",
    r"(무상|무료)\s*로?\s*(제공|지원|시술|체험|받)",
    r"(제공|지원)\s*받(아|았|고)\s*(작성|솔직|진행|리뷰|후기|포스팅)",
    r"(업체|병원|의원|피부과|치과|성형외과)\s*(로|으로)부터\s*(제공|지원|대가|원고료|협찬)",
    r"대가\s*(를|로)?\s*(받|제공)",
    r"유료\s*광고",
    r"광고\s*포함",
    r"#\s*(광고|협찬|ad|sponsored|체험단|유료광고)\b",
    r"\[(광고|협찬|AD)\]",
    r"서포터즈",
    r"파트너스\s*활동",
    r"(경제적|금전적)\s*(이해관계|대가|지원)",
    r"(paid\s*partnership|includes\s*paid\s*promotion)",
]
SPONSOR_RE = re.compile("|".join(f"(?:{p})" for p in SPONSOR_PATTERNS), re.IGNORECASE)

# 체험단 중개 플랫폼 (본문 링크·배너 이미지 주소로 탐지)
SPONSOR_DOMAINS = re.compile(
    r"(revu\.net|reviewnote\.co\.kr|dinnerqueen\.net|gangnam-?review|mrblog\.net|seoulouba|ringble|"
    r"cometoplay|tble\.kr|reviewplace|chvu\.co\.kr|weble\.net|4blog\.net|storyn\.kr|ohmyblog|blogdex)",
    re.IGNORECASE,
)


def _norm(s: str) -> str:
    return re.sub(r"[\s_\-.·@]", "", (s or "").lower())


def classify_author(
    platform: str,
    author_id: str,
    author_name: str,
    text: str,
    hospital: dict,
    markers: str = "",
) -> tuple[str, str]:
    """(author_type, 근거) 반환."""
    accounts = hospital.get("official_accounts", {}) or {}
    plat_accounts = [a for a in accounts.get(platform, []) if a]
    nid, nname = _norm(author_id), _norm(author_name)
    for acc in plat_accounts:
        na = _norm(acc)
        if na and (na == nid or na == nname):
            return "official", f"등록된 공식 계정({acc})과 일치"
    hname = _norm(hospital.get("name", ""))
    if hname and len(hname) >= 3 and hname in nname:
        return "official", f"작성자명 '{author_name}'에 병원명 포함"

    m = SPONSOR_RE.search(text or "")
    if m:
        return "sponsored", f"대가 표시 문구 '{m.group(0)}'"
    m = SPONSOR_DOMAINS.search(markers or "")
    if m:
        return "sponsored", f"체험단 플랫폼 링크/배너 '{m.group(0)}'"
    if re.search(r"내돈\s*내산", text or ""):
        return "general", "'내돈내산' 표기, 대가 표시 없음"
    return "general", "대가 표시 문구·공식 계정 일치 없음"

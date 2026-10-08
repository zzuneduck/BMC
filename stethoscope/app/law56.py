"""의료법 제56조(의료광고의 금지 등) 체크리스트.

각 규칙은 (조항 코드, 정규식, 강도)로 구성된다.
- strong: 문구 자체가 금지 유형에 직접 해당 (예: '부작용 없는', '최고의 의료진', '타 병원과 달리')
- weak:   맥락에 따라 판단이 필요 (예: '이벤트', '수상', '신기술 도입')
문서 단위 점검(심의번호 미표기, 부작용 고지 누락)은 광고 주체(공식계정/체험단)일 때만 적용한다.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

CLAUSES: dict[str, tuple[str, str]] = {
    "56-1": ("제56조 제1항", "의료기관 개설자·의료기관의 장 또는 의료인이 아닌 자의 의료광고"),
    "56-2-1": ("제56조 제2항 제1호", "평가를 받지 아니한 신의료기술에 관한 광고"),
    "56-2-2": ("제56조 제2항 제2호", "환자에 관한 치료경험담 등 소비자로 하여금 치료 효과를 오인하게 할 우려가 있는 내용의 광고"),
    "56-2-3": ("제56조 제2항 제3호", "거짓된 내용을 표시하는 광고"),
    "56-2-4": ("제56조 제2항 제4호", "다른 의료인등의 기능 또는 진료 방법과 비교하는 내용의 광고"),
    "56-2-5": ("제56조 제2항 제5호", "다른 의료인등을 비방하는 내용의 광고"),
    "56-2-6": ("제56조 제2항 제6호", "수술 장면 등 직접적인 시술행위를 노출하는 내용의 광고"),
    "56-2-7": ("제56조 제2항 제7호", "의료인등의 기능, 진료 방법과 관련하여 심각한 부작용 등 중요한 정보를 누락하는 광고"),
    "56-2-8": ("제56조 제2항 제8호", "객관적인 사실을 과장하는 내용의 광고"),
    "56-2-9": ("제56조 제2항 제9호", "법적 근거가 없는 자격이나 명칭을 표방하는 내용의 광고"),
    "56-2-10": ("제56조 제2항 제10호", "신문·방송·잡지 등을 이용하여 기사 또는 전문가의 의견 형태로 표현되는 광고"),
    "56-2-11": ("제56조 제2항 제11호", "제57조에 따른 심의를 받지 아니하거나 심의 받은 내용과 다른 내용의 광고"),
    "56-2-12": ("제56조 제2항 제12호", "외국인환자를 유치하기 위한 국내광고"),
    "56-2-13": ("제56조 제2항 제13호", "소비자를 속이거나 잘못 알게 할 수 있는 방법으로 비급여 진료비용을 할인하거나 면제하는 내용의 광고"),
    "56-2-14": ("제56조 제2항 제14호", "각종 상장·감사장 등을 이용하는 광고 또는 인증·보증·추천을 받았다는 내용의 광고"),
    "56-2-15": ("제56조 제2항 제15호", "그 밖에 국민의 보건과 건전한 의료경쟁의 질서를 해치거나 소비자에게 피해를 줄 우려가 있는 광고"),
}


def clause_sort_key(code: str) -> tuple[int, ...]:
    return tuple(int(x) for x in code.split("-") if x.isdigit())


def clause_label(code: str) -> str:
    art, desc = CLAUSES.get(code, (code, ""))
    return f"의료법 {art} ({desc})" if desc else code


@dataclass(frozen=True)
class Rule:
    id: str
    clause: str
    pattern: re.Pattern
    severity: str  # strong / weak
    note: str


def _r(id_: str, clause: str, pat: str, severity: str, note: str) -> Rule:
    return Rule(id_, clause, re.compile(pat, re.IGNORECASE), severity, note)


RULES: list[Rule] = [
    # 제2호 치료경험담
    _r("review_before_after", "56-2-2", r"(전\s*[·/,]?\s*후\s*사진|비포\s*(&|앤|and)?\s*애프터|before\s*(&|and)?\s*after|시술\s*전\s*후\s*비교)", "strong", "전후 사진·비교로 치료효과 오인 유발"),
    _r("review_effect", "56-2-2", r"((시술|수술|치료|주사|레이저|교정|리프팅|필러|보톡스|임플란트|추나|침|도수|제모|관리|진료)\s*(을|를)?\s*(받고|받은\s*후|후에?|하고\s*나서?)[^.!?\n]{0,30}(효과|좋아졌|달라졌|나았|사라졌|없어졌|만족))", "strong", "치료 경험·효과 서술"),
    _r("review_cured", "56-2-2", r"(완치|싹\s*(나았|사라졌|없어졌)|한\s*번\s*만에\s*(효과|해결|완치)|\d+\s*회\s*만에\s*(효과|완치|해결|좋아))", "strong", "치료 결과 단정"),
    _r("review_word", "56-2-2", r"(시술|수술|치료|진료|상담|내원)\s*(후기|리뷰|경험담|썰)", "weak", "치료 후기 형식"),
    # 제3호 거짓
    _r("false_no_side", "56-2-3", r"(부작용\s*(이|은|도)?\s*(전혀\s*)?(없|0\s*%|제로|걱정\s*(없|끝))|무\s*부작용|통증\s*(이|은|도)?\s*(전혀\s*)?없|무통\s*(시술|수술|치료)?|흉터\s*(가|는|도)?\s*(전혀\s*)?(없|안\s*남))", "strong", "부작용·통증·흉터 없음 단정"),
    _r("false_guarantee", "56-2-3", r"(100\s*%\s*(효과|만족|성공|완치|보장)|효과\s*(를\s*)?보장|평생\s*보장|재발\s*(이|은)?\s*(절대\s*)?(없|0))", "strong", "효과 보장"),
    # 제4호 비교
    _r("compare_other", "56-2-4", r"(타\s*(병원|의원|치과|한의원|피부과|성형외과)|다른\s*(병원|의원|치과|곳|데)\s*(보다|과\s*달리|와\s*달리|에서는\s*안|에서\s*실패)|(어느|어떤)\s*(병원|곳)\s*보다)", "strong", "다른 의료기관과 비교"),
    # 제5호 비방
    _r("defame", "56-2-5", r"(다른|타)\s*(병원|의원|곳)[^.!?\n]{0,30}(엉터리|돌팔이|망쳤|실패했|부작용\s*났|사기)", "strong", "다른 의료기관 비방"),
    # 제6호 수술 장면
    _r("surgery_scene", "56-2-6", r"(수술\s*(장면|영상|과정\s*(공개|영상))|시술\s*(장면|영상|과정\s*공개)|수술실\s*(공개|영상)|라이브\s*수술)", "strong", "수술·시술 장면 노출"),
    # 제8호 과장
    _r("exaggerate_best", "56-2-8", r"(최고의?|최상의?|최초|유일(한|무이)?|독보적|국내\s*(1|일)\s*위|업계\s*(1|일)\s*위|no\.?\s*1|넘버\s*원|1\s*등\s*병원|가장\s*(잘|많이)\s*하는|명의)", "strong", "최상급·비교불가 표현으로 객관적 사실 과장"),
    _r("exaggerate_perfect", "56-2-8", r"(완벽(한|하게)|기적(의|같은)?|확실한\s*효과|즉각적인\s*효과|영구(적|히)?\s*(효과|유지)|반영구\s*효과|평생\s*유지|마법)", "strong", "효과 과장"),
    _r("exaggerate_numbers", "56-2-8", r"((누적|연간)?\s*\d[\d,]*\s*(건|명|례)\s*(이상\s*)?(의\s*)?(시술|수술|임상|케이스)|(시술|수술)\s*(건수|횟수)\s*\d)", "weak", "시술 건수 등 수치 강조"),
    # 제9호 법적 근거 없는 명칭
    _r("title_specialty", "56-2-9", r"(?<!지정\s)(?<!지정)(전문\s*병원|전문\s*클리닉|전문\s*센터|특화\s*병원)", "weak", "보건복지부 지정 전문병원이 아닌 '전문병원' 표방 가능성"),
    _r("title_fake", "56-2-9", r"(대한민국\s*대표\s*(병원|의사|원장)|명예\s*원장|세계적\s*권위자)", "weak", "근거 없는 명칭·자격 표방 가능성"),
    # 제10호 기사·전문가 의견 형태
    _r("article_form", "56-2-10", r"(언론\s*보도|방송\s*출연|기사\s*(로\s*)?소개|칼럼|전문가\s*(가\s*)?추천|TV\s*에?\s*나온)", "weak", "기사·방송·전문가 의견 형태"),
    # 제12호 외국인 환자 유치 국내광고
    _r("foreign_patient", "56-2-12", r"(외국인\s*환자\s*(유치|모집|할인)|중국인\s*환자|해외\s*환자\s*(유치|모집))", "weak", "외국인 환자 유치 국내광고 가능성"),
    # 제13호 비급여 할인·면제
    _r("discount_strong", "56-2-13", r"(\d+\s*%\s*(할인|off|DC|세일)|반\s*값|무료\s*(시술|수술|주사|체험|제공|이벤트)|1\s*\+\s*1|원\s*플러스\s*원|공짜|\d[\d,]*\s*원\s*(→|->|에서)\s*\d[\d,]*\s*원|정가\s*\d|특가|파격\s*(할인|가)|선착순\s*\d*\s*(명|분)?\s*(할인|무료|특가)?)", "strong", "비급여 진료비 할인·면제"),
    _r("discount_weak", "56-2-13", r"(이벤트\s*(가|가격|중|진행)|할인\s*(가|가격|혜택|이벤트)|가격\s*(인하|혜택)|최저가)", "weak", "가격 이벤트 언급"),
    # 제14호 상장·인증·추천
    _r("award", "56-2-14", r"(수상|대상\s*수상|어워드|감사장|상장|선정\s*(병원|의원)|추천\s*(병원|의원|의사)|인증\s*(병원|의원|받은))", "weak", "상장·인증·추천 이용 (의료기관 인증 등 예외 확인 필요)"),
    # 제1호 신의료기술
    _r("new_tech", "56-2-1", r"(신의료\s*기술|국내\s*최초\s*도입|최신\s*(장비|기술)\s*도입|신기술|특허\s*(받은|기술|시술))", "weak", "미평가 신의료기술 광고 가능성"),
    # 제15호 기타 (환자 유인 이벤트)
    _r("lure", "56-2-15", r"(체험단\s*모집|후기\s*(작성|이벤트)\s*(시|하면)?\s*(할인|무료|적립|증정)|리뷰\s*(작성|이벤트)\s*(시|하면)?\s*(할인|무료|적립|증정)|소개\s*(시|하면)\s*(할인|적립|무료))", "strong", "후기·소개 대가 제공으로 환자 유인"),
]

TREATMENT_WORDS = re.compile(r"(시술|수술|주사|레이저|필러|보톡스|리프팅|임플란트|교정|지방흡입|쌍꺼풀|코성형|치료)")
SIDE_EFFECT_NOTICE = re.compile(r"(부작용|개인차|개인에\s*따라|주의\s*사항|출혈|감염|염증|멍|붓기)")
REVIEW_NUMBER = re.compile(r"(의료\s*광고\s*심의|심의\s*(필|번호|받은)|제\s*\d{4,}\s*-\s*\d+\s*-\s*\d+\s*호|\d{6}-?중-?\d+)")


@dataclass
class Hit:
    rule_id: str
    clause: str
    severity: str
    note: str
    sentence: str
    match: str
    timestamp: float | None = None


_SPLIT = re.compile(r"(?<=[.!?。])\s+|\n+|(?<=[요다죠네])[.~!]*\s+(?=[가-힣A-Za-z0-9])")


def split_sentences(text: str) -> list[str]:
    parts = []
    for raw in _SPLIT.split(text or ""):
        s = " ".join(raw.split()).strip(" -·•")
        if len(s) >= 2:
            parts.append(s)
    return parts


def _trim(sentence: str, start: int, end: int, width: int = 90) -> str:
    if len(sentence) <= 2 * width:
        return sentence
    a, b = max(0, start - width), min(len(sentence), end + width)
    return ("…" if a else "") + sentence[a:b] + ("…" if b < len(sentence) else "")


def scan_units(units: list[tuple[str, float | None]]) -> list[Hit]:
    """units: (문장, 타임스탬프 or None). 같은 문장·같은 조항은 한 번만 기록."""
    hits: list[Hit] = []
    seen: set[tuple[str, str]] = set()
    for text, tsec in units:
        for rule in RULES:
            m = rule.pattern.search(text)
            if not m:
                continue
            sent = _trim(text, m.start(), m.end())
            key = (sent, rule.clause)
            if key in seen:
                # 같은 문장·조항이면 더 강한 쪽 유지
                if rule.severity == "strong":
                    for h in hits:
                        if (h.sentence, h.clause) == key and h.severity == "weak":
                            h.severity, h.rule_id, h.note, h.match = "strong", rule.id, rule.note, m.group(0)
                continue
            seen.add(key)
            hits.append(Hit(rule.id, rule.clause, rule.severity, rule.note, sent, m.group(0), tsec))
    return hits


def document_checks(full_text: str, is_advertiser: bool) -> list[Hit]:
    """광고 주체(공식계정·체험단)의 게시물에 대해 문서 단위 누락 항목 점검."""
    if not is_advertiser:
        return []
    out: list[Hit] = []
    if TREATMENT_WORDS.search(full_text) and not SIDE_EFFECT_NOTICE.search(full_text):
        out.append(Hit("omit_side_effect", "56-2-7", "weak", "시술 홍보에 부작용·개인차 고지 없음",
                       "(게시물 전체) 부작용·개인차 등 중요 정보 고지 문구 없음", ""))
    if not REVIEW_NUMBER.search(full_text):
        out.append(Hit("no_review_number", "56-2-11", "weak", "의료광고 심의번호 미표기",
                       "(게시물 전체) 의료광고 심의필 번호 표기 없음", ""))
    return out

# 배송인그룹 멤버십 자체폼

홈페이지 멤버십 문의(transportgroup.co.kr/Membership)로 보내던 CTA를 대체하는 랜딩 + 자체 신청 폼.
멤버십을 짧게 소개하고 하단에서 면접 컨설팅 신청을 받는다.

- 예정 주소: https://shine100y.github.io/membership-landing/
- 구성: 히어로 → 상담 가능한 배송 분야 → 소속 배송인·근속률 → 3 ZERO → 지입사기 근절 → 멤버십 4대 혜택 → 신청 폼

## 파일 구성

| 경로 | 내용 |
| --- | --- |
| `index.html` | 페이지 본문 (문구 수정은 여기서) |
| `css/style.css` | 가구 랜딩과 같은 공통 디자인 (그대로 복사) |
| `css/membership.css` | 이 페이지 전용 스타일 (분야 카드, 선택 카드, 이메일·지원이유 입력칸) |
| `js/main.js` | 폼 동작, **구글 시트 연결 주소(`SHEET_URL`)** — 비어 있으면 테스트 모드 |
| `js/regions.js` | 시·도 / 시·군·구 목록 |
| `apps-script/Code.gs` | 별도 Apps Script 프로젝트에 붙여넣을 코드 (`멤버십_자체폼` 탭 자동 생성) |

## 폼 항목 (홈페이지 폼 기준)

알게 된 경로(필수) · 이름 · 연락처 · 이메일(선택) · 나이 · 거주지역(시·도/시·군·구) · 관심 분야(5개 중 택1) · 지원 이유(10자 이상) · 개인정보 동의(필수) · 마케팅 동의(선택)

- `?utm_source=youtube` 처럼 들어오면 '알게 된 경로'가 자동 선택된다 (유튜브·블로그·SNS·검색).
- 클래리티 이벤트: `apply_start`, `apply_submit` (가구 랜딩과 같은 프로젝트 z5qgebq31g, 페이지 구분 태그 `page=멤버십`)

## 유입경로 추적

```
https://shine100y.github.io/membership-landing/?utm_source=youtube&utm_campaign=M001_영상이름
```

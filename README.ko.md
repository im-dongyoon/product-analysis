[English](README.md) | **한국어**

# product-analysis

서비스 하나를 전방위로 리서치·분석(리버스 엔지니어링)해서, **그 결과만 보고 같은 서비스를 다시 만들 수 있는 수준**으로 정리하는 AI 에이전트 스킬입니다. 결과물은 `index.html` 보고서를 중심으로 원고·캡처·원본 데이터가 정리된 폴더 하나입니다.

[Agent Skills](https://agentskills.io/) 형식(`SKILL.md` + 부속 파일)이라 Aside, Claude Code처럼 이 형식을 읽는 에이전트에서 쓸 수 있습니다. 본문은 한국어로 쓰여 있습니다.

## 무엇을 보는가

| # | 영역 | # | 영역 |
|-|-|-|-|
| A | 회사·사업 (운영사, 투자, 요금, 약관) | H | API·데이터 구조 (요청 목록, 응답 모양, 엔티티) |
| B | 화면 전체 목록 | I | 유입·성장 (검색, 콘텐츠, 광고, 추천 장치) |
| C | 화면별 명세 (상태, 문구 원문, 입력 규칙) | J | 운영 (고객센터, 사람이 개입하는 지점) |
| D | 사용자 흐름 | K | 사용자 반응 (원문 인용, 직접 센 개수) |
| E | 기능 규칙 (한도, 상태값, 권한) | L | 변화 이력 (웹 아카이브, 업데이트 노트) |
| F | 디자인 시스템 (색, 글자, 간격, 컴포넌트) | M | AI 기능 (진행 문구, 스트리밍, 모델 단서) |
| G | 기술 스택·인프라 | | |

모든 항목에 근거를 붙입니다: `[사실]` 화면·응답·파일로 확인, `[추정]`, `[미확인]`, `[2차]`(기사·투자 DB 같은 2차 자료). 끝에는 "재현 점검표"로 화면·흐름·API를 얼마나 채웠는지 숫자로 보고합니다.

## 결과물

```
<서비스>/
  index.html     보고서 (scripts/build-report.mjs로 생성)
  docs/          보고서 원고 md (00-overview ~ 05-live-notes)
  captures/      public · app · official · external
  data/          api · samples · extract · snapshots · source
```

보고서는 원고를 목차·근거 태그·캡처 썸네일·캡처 모아보기·확대 보기가 있는 한 페이지로 묶습니다. 원고에 캡처 파일 이름이나 화면 ID(`P08`, `A45`)를 적으면 자동으로 연결됩니다.

## 필요한 것

- 브라우저를 조작하고, 페이지 안에서 JS를 실행하고, 캡처를 저장할 수 있는 에이전트
- 보고서 빌드용 Node.js 18 이상

| 환경 | 상태 |
|-|-|
| [Aside](https://asidehq.com) | 처음 만든 환경. 모든 절차를 실제로 돌려 봄 |
| Claude Code + [Playwright MCP](https://github.com/microsoft/playwright-mcp) 또는 [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp) | 도구 대응표가 `SKILL.md` 3절에 있음. 이 조합으로 전체 실행은 아직 해 보지 않음 |
| 브라우저 도구가 없는 에이전트 | 웹 조사 영역(A·I·K·L)과 공식 문서 기반 명세만 가능. 나머지는 [미확인]으로 남음 |

## 설치

Aside:
```bash
git clone https://github.com/im-dongyoon/product-analysis.git ~/.aside/u/<계정>/skills/user/product-analysis
```

Claude Code (개인 스킬):
```bash
git clone https://github.com/im-dongyoon/product-analysis.git ~/.claude/skills/product-analysis
claude mcp add playwright npx @playwright/mcp@latest   # 브라우저 도구가 없다면
```

보고서만 빌드할 때:
```bash
node scripts/build-report.mjs <분석 폴더>
```

## 구성

| 파일 | 내용 |
|-|-|
| `SKILL.md` | 절차, 환경별 도구, 하지 않는 것, 기록 규칙, 산출물 규칙 |
| `references/analysis-areas.md` | 영역별 수집 항목·출처·완료 기준 |
| `references/capture.md` | 캡처·모바일 화면·숨은 요청 찾기 요령 |
| `references/report-template.md` | 원고 6개의 틀 |
| `scripts/detect-stack.js` | 프레임워크·분석·결제·인증 도구와 단서 찾기 |
| `scripts/design-tokens.js` | 실제 쓰인 디자인 값과 사용 횟수, CSS 변수, 화면 너비 기준 |
| `scripts/page-inventory.js` | 화면 구조, 링크, 버튼, 입력 칸 규칙, 문구 원문 |
| `scripts/api-capture.js` | 화면이 보내는 요청과 응답 모양 기록(값은 저장하지 않고 개인정보 키는 가림) |
| `scripts/build-report.mjs` | 분석 폴더를 `index.html` 보고서로 빌드 |
| `assets/` | 보고서 스타일·동작, 포함된 라이브러리(marked, mermaid) |

## 지키는 선

- 남의 폼·DB에 아무것도 제출하지 않습니다(문의, 리드, 리뷰, 결제).
- 인증 우회, 다른 사람 ID로 요청, 관리자 화면 로그인 시도, 취약점 검사를 하지 않습니다. 화면이 보내지 않는 API를 직접 부르지 않습니다.
- 대량 수집을 하지 않고, 공개된 소스맵의 코드를 옮기지 않습니다.
- 새 가입과 결제는 사용자 승인 뒤에만 합니다.
- 분석 문서의 화면 문구·이미지는 기록용 인용입니다. 서비스를 다시 만들 때는 문구·이미지·브랜드를 바꿔 써야 합니다.

## 라이선스

MIT. 포함된 서드파티 라이브러리는 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)를 보세요.

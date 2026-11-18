# 캡처 방법 (Aside 브라우저에서 확인된 것)

다른 환경(Playwright MCP, Chrome DevTools MCP)은 SKILL.md 3절 표의 도구를 먼저 쓴다. 아래 요령 중 원리(스크롤 뒤 화면 크기만큼 찍기, 모바일은 390×844, 저장 뒤 1장 이상 직접 열어 보기)는 어디서나 같다.

## 저장
- 저장 전 `await fs.mkdir(dir, { recursive: true })`. 세션 폴더가 아직 없을 수 있다.
- `display()`로 띄운 이미지는 내 다음 대화에서 사라진다. 직접 보려면 저장 경로를 `read_file`로 연다.
- `locator.screenshot()`이 "Invalid parameters"로 실패하면 `page.screenshot()` + `clip`을 쓴다.
- `fullPage:true`와 `clip`을 같이 쓰면 첫 화면이 반복돼 찍힐 수 있다. 섹션까지 실제로 스크롤한 뒤 화면 크기만큼 찍는다.
- 캡처 묶음을 근거로 쓰기 전에 최소 1장을 열어 본다.

## 모바일 화면 (390×844)
1. 기본 방법: CDP 화면 크기 덮어쓰기
   ```js
   await page._sendToTarget('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
   await page.refreshViewportSize();
   const buf = await page.screenshot({ clip: { x: 0, y: 0, width: 390, height: 844 } });
   ```
   `clip` 없이 찍으면 화면이 옆으로 반복돼 찍힌다. 끝나면 `Emulation.clearDeviceMetricsOverride`로 되돌린다.
2. 안 되면: 같은 사이트 페이지 안에 iframe 띄우기
   - 대상 사이트 페이지에서 `document.documentElement.innerHTML`을 `top:0;left:0`, 폭 390·높이 844 iframe 하나로 바꾸고, 같은 사이트 URL을 그 iframe에 연다. 같은 출처라 로그인도 유지되고 미디어쿼리로 진짜 모바일 화면이 나온다.
   - iframe을 `top:0;left:0`에 두고 `clip {x:0,y:0,width:390,height:844}`. 다른 위치에 두면 여백이 찍힌다.
   - iframe 안 조작은 snapshot의 `f…` ref로, 스크롤은 `page.frames()`에서 프레임을 찾아 `scrollIntoView`.
   - `frame-ancestors`로 막힌 사이트는 그 사이트 자기 페이지 안에서만 된다.

## 숨은 데이터 찾기
- 페이지가 불러온 파일 목록: `page.evaluate(() => performance.getEntriesByType('resource').map(e => e.name))`. `page.on('request')`는 믿지 않는다.
- 앱 내부 API 확인: 페이지를 연 뒤 `window.fetch`와 `XMLHttpRequest.prototype.send`를 감싸 `window.__cap`에 쌓고, 탭 전환·필터 변경처럼 새 요청이 나가는 행동을 한다.
- REPL에는 `URL` 전역이 없다. 주소는 문자열로 만든다.

## 기타
- 오래 걸리는 반복은 120초 제한에 걸린다. `page.evaluate` 안에서 기다리지 않고 시작해 `window`에 결과를 쌓고 나눠서 읽는다.
- 중간에 REPL 변수가 사라지면(daemon 재시작) 위 설정을 한 번에 다시 실행할 수 있게 한 블록으로 둔다.
- 날짜는 `get_time()`으로 확인한다. REPL `new Date()`는 며칠 어긋난 적이 있다.

## 조작이 안 먹힐 때 (2026-11 매니패스트에서 확인)
- 체크박스·메뉴 항목 클릭이 "Checkbox click did not change checked state"로 실패하면, 실제로는 눌렸을 수 있다. 화면의 선택 개수 문구로 상태를 확인하고, 안 눌렸으면 `boundingBox()` 좌표에 `page.mouse.click`.
- 투어 말풍선이 접근성 트리에 안 잡히면 `page.evaluate`로 짧은 안내 문구(예: "눌러 보세요")를 가진 요소의 클래스를 찾아 그 클래스로 읽는다.
- `api-capture.js`를 같은 페이지에 여러 번 설치하면 요청이 중복 기록된다. `window.__capInstalled`를 지우지 말고 `window.__cap.length = 0`으로 비운다.
- 한 번의 REPL 호출 안 반복은 90초 안에 끝내게 시간 제한을 둔다(120초 넘으면 끊긴다).

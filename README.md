**English** | [한국어](README.ko.md)

# product-analysis

An AI agent skill that researches and reverse-engineers a web service end to end, and documents it in enough detail that **someone could rebuild the same service from the output alone**. The result is one folder: an `index.html` report plus the markdown sources, organized screenshots, and raw data behind it.

It follows the [Agent Skills](https://agentskills.io/) format (`SKILL.md` + supporting files), so agents that read that format, such as Aside and Claude Code, can use it. The skill body is written in Korean.

## What it covers

| # | Area | # | Area |
|-|-|-|-|
| A | Company and business (operator, funding, pricing, terms) | H | API and data model (requests, response shapes, entities) |
| B | Full screen inventory | I | Acquisition and growth (search, content, ads, referral loops) |
| C | Per-screen specs (states, verbatim copy, input rules) | J | Operations (support, where humans step in) |
| D | User flows | K | User sentiment (verbatim quotes, hand-counted themes) |
| E | Feature rules (limits, status values, permissions) | L | Change history (web archive, release notes) |
| F | Design system (color, type, spacing, components) | M | AI features (progress copy, streaming, model hints) |
| G | Tech stack and infrastructure | | |

Every item carries an evidence tag: `[사실]` (verified on a screen, response, or file), `[추정]` (inferred), `[미확인]` (not verified), `[2차]` (secondary sources such as news or funding databases). The report ends with a "reproduction checklist" that counts how many screens, flows, and APIs are fully documented.

## Output

```
<service>/
  index.html     report (built by scripts/build-report.mjs)
  docs/          report sources in markdown (00-overview to 05-live-notes)
  captures/      public · app · official · external
  data/          api · samples · extract · snapshots · source
```

The report combines the sources into one page with a table of contents, evidence tags, screenshot strips, a screenshot gallery, and a lightbox. Screenshot file names and screen IDs (`P08`, `A45`) written in the sources are linked automatically.

## Requirements

- An agent that can drive a browser, run JavaScript inside a page, and save screenshots
- Node.js 18+ to build the report

| Environment | Status |
|-|-|
| [Aside](https://asidehq.com) | Original environment. Every step has been run end to end |
| Claude Code + [Playwright MCP](https://github.com/microsoft/playwright-mcp) or [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp) | Tool mapping is in section 3 of `SKILL.md`. A full run with this setup has not been tested yet |
| Agents without browser tools | Only the web-research areas (A, I, K, L) and specs from official docs. Everything else stays `[미확인]` |

## Install

Aside:
```bash
git clone https://github.com/im-dongyoon/product-analysis.git ~/.aside/u/<account>/skills/user/product-analysis
```

Claude Code (personal skill):
```bash
git clone https://github.com/im-dongyoon/product-analysis.git ~/.claude/skills/product-analysis
claude mcp add playwright npx @playwright/mcp@latest   # if you have no browser tool yet
```

Build a report only:
```bash
node scripts/build-report.mjs <analysis-folder>
```

## Contents

| File | Purpose |
|-|-|
| `SKILL.md` | Procedure, tools per environment, guardrails, recording rules, output rules |
| `references/analysis-areas.md` | What to collect per area, where to find it, and when it counts as done |
| `references/capture.md` | Screenshot, mobile viewport, and hidden-request techniques |
| `references/report-template.md` | Templates for the six source documents |
| `scripts/detect-stack.js` | Detects frameworks and analytics, payment, and auth tools, with evidence |
| `scripts/design-tokens.js` | Design values actually used, with counts; CSS variables; breakpoints |
| `scripts/page-inventory.js` | Page structure, links, buttons, input rules, all visible copy |
| `scripts/api-capture.js` | Records requests the page sends and response shapes (no values stored, personal-data keys masked) |
| `scripts/build-report.mjs` | Builds an analysis folder into `index.html` |
| `assets/` | Report styles and behavior, bundled libraries (marked, mermaid) |

## Guardrails

- Never submits anything into someone else's forms or database (inquiries, leads, reviews, payments).
- No auth bypass, no requests with other users' IDs, no attempts to log in to admin screens, no vulnerability scanning. Never calls APIs the page itself does not send.
- No bulk scraping. Never copies code from exposed source maps.
- New sign-ups and payments happen only after the user approves.
- Screen copy and images in the analysis are quoted for the record. Anyone rebuilding the service must replace copy, images, and branding.

## License

MIT. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for bundled third-party libraries.

# Risk Register — 名字账册 (The Ledger of Names)

## RISK-001: Design Document Describes Wrong Game
**Severity**: Critical
**Status**: Open — Manager Decision Required

**Description**: The design document `game9-twilight-aphasia.md` describes "失语的黄昏 / Twilight of Aphasia" — a game about Babel-like language confusion with social graph mechanics, 8 chapters, and multiple endings. The actual implementation is "名字账册 / The Ledger of Names" — a construction-site name-recording game with 25 sessions across 5 acts. These are fundamentally different games.

**Impact**: Any developer using the design doc as requirements will build wrong features. The design doc cannot serve as a specification.

**Evidence**:
- Design doc: "失语的黄昏", 8 chapters, social graphs, language confusion theme
- Implementation: "名字账册", 25 sessions, construction site ledger, name memory theme
- All data, models, and engines implement the ledger game, not the Babel game

**Recommendation**: Treat the existing implementation as the authoritative specification. Archive or relabel the design doc. If the Babel game is the intended product, this entire codebase is misdirected work.

---

## RISK-002: No Existing Tests or CI
**Severity**: Medium
**Status**: Open

**Description**: The only test file (`test.mjs`) is a Playwright test that checks for basic page load and layout. It has no assertions about game logic. There is no CI configuration.

**Impact**: Bugs in engine logic (e.g., BUG-005, BUG-007) have no automated detection. Regressions during repair work will go unnoticed.

**Recommendation**: Accept this risk for the repair phase. The existing engine code is stable (no changes planned). New code (main.js, renderer.js, input.js, screenManager.js) should be tested manually. Add automated tests after repair is complete.

---

## RISK-003: Canvas Text Rendering — Chinese Font Support
**Severity**: Medium
**Status**: Open

**Description**: The game renders Chinese text on canvas. Canvas `fillText` depends on system font availability. The CSS references fonts but canvas rendering must explicitly set `ctx.font` with a font that supports Chinese characters.

**Impact**: If no Chinese-capable font is available, text renders as boxes or blank. Mobile browsers may have limited font options.

**Recommendation**: Use web-safe Chinese fonts (e.g., `'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif`). Consider loading a web font via CSS `@font-face` and waiting for it before rendering. Add a font-loading check in main.js init.

---

## RISK-004: Virtual Keyboard for Name Input
**Severity**: Medium
**Status**: Open

**Description**: The game requires players to type Chinese names. On mobile, this means triggering the system keyboard from a canvas element. Canvas does not natively trigger virtual keyboards.

**Impact**: Players on mobile devices cannot input names without a workaround.

**Recommendation**: Two approaches:
1. **HTML overlay**: Position a hidden `<input>` element over the canvas, focus it to trigger keyboard, relay input to canvas renderer. Simple but reliable.
2. **Custom on-screen keyboard**: Build a Chinese input method in canvas. Complex but full control.
Recommend approach #1 for initial repair. The memory challenge already uses multiple-choice (no typing needed), so name input is the only typing requirement.

---

## RISK-005: Performance on Low-End Mobile
**Severity**: Low
**Status**: Open

**Description**: The game targets mobile (375x812 viewport). Ten engine `update(dt)` calls per frame plus canvas rendering could be expensive on low-end devices, especially with text-heavy rendering and degradation effects.

**Impact**: Frame drops below 30fps on older devices.

**Recommendation**: Profile on target devices after repair. Key optimizations if needed:
- Cache rendered text to offscreen canvas (text rendering is expensive)
- Reduce degradation visual complexity
- Throttle auto-save to every 60s instead of 30s

---

## RISK-006: Memory Challenge Timer Enforcement
**Severity**: Medium
**Status**: Open — relates to BUG-008

**Description**: `memoryChallenge.js` configures `viewDuration` for how long player sees person info, but the engine itself doesn't enforce it. The timer must be enforced by the screen manager (Packet 1) and renderer (Packet 2).

**Impact**: If screen manager doesn't enforce the timer, players can view info indefinitely, trivializing the challenge.

**Recommendation**: Explicitly assign this to Packet 1 (screenManager) — enforce viewDuration in the memory_challenge phase `update(dt)` method. Add acceptance test.

---

## RISK-007: Cross-Game Persistence Design
**Severity**: Low
**Status**: Informational

**Description**: `graceSystem.saveToShared()` and `graceSystem.saveCrossGameData()` write to fixed localStorage keys (`shinar_grace_trace_names`, `shinar_names_realNames`). This is designed for cross-game influence (other games in the "Shinar" series reading this data).

**Impact**: No immediate impact on repair work. But the shared localStorage keys should be documented for any future games in the series.

**Recommendation**: No action needed for repair. Document the key names in a future README.

---

## Summary

| ID | Severity | Requires Decision? | Owner |
|----|----------|-------------------|-------|
| RISK-001 | Critical | **Yes — Manager** | Design doc vs implementation mismatch |
| RISK-002 | Medium | No | Accept risk, add tests post-repair |
| RISK-003 | Medium | No | Use web-safe Chinese fonts |
| RISK-004 | Medium | No | HTML input overlay for virtual keyboard |
| RISK-005 | Low | No | Profile post-repair |
| RISK-006 | Medium | No | Assign to Packet 1 screenManager |
| RISK-007 | Low | No | Informational only |

**Items requiring manager decision: 1** (RISK-001 — design doc mismatch)

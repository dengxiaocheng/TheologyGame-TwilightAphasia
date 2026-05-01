# Bug Inventory — 名字账册 (The Ledger of Names)

## P0 — Game Does Not Run (Blockers)

### BUG-001: main.js is empty — no game loop exists
- **File**: `js/main.js` (2 lines: only a comment)
- **Impact**: Nothing runs. All 5500+ lines of engine/model/data code are inert.
- **Reproducibility**: 100% — load index.html, nothing happens beyond blank canvas
- **Evidence**: File contains only `// Game entry point`. No `requestAnimationFrame`, no init function, no rendering.
- **Owner**: Phase 1 worker (main.js + screenManager.js)

### BUG-002: No renderer exists
- **File**: Missing entirely — no rendering code in codebase
- **Impact**: Even if main.js had a loop, nothing would appear on the 375x812 canvas
- **Reproducibility**: 100% — canvas remains blank
- **Evidence**: Grep for `drawImage`, `fillText`, `fillRect`, `beginPath` returns zero hits in js/
- **Owner**: Phase 2 worker (renderer.js)
- **Note**: All 10 engines expose `getViewData()` designed to feed a renderer that does not exist

### BUG-003: No input handler exists
- **File**: Missing entirely — no touch/mouse/keyboard input code
- **Impact**: Player cannot interact with game. Silence system `recordInteraction()` never called.
- **Reproducibility**: 100% — no event listeners on canvas
- **Evidence**: Grep for `addEventListener`, `touchstart`, `click` in js/ returns zero hits (except namespace.js comment)
- **Owner**: Phase 3 worker (input.js)
- **Note**: `N.input` slot in namespace is reserved but never populated

### BUG-004: No screen/state management
- **File**: Missing — no code to manage game phases (title, briefing, working, etc.)
- **Impact**: `GameState._phase` is set but never drives rendering or logic transitions
- **Reproducibility**: 100% — `N.state` is null until manually initialized
- **Evidence**: `GameState` model has phases: title, briefing, working, memory_challenge, event, dialogue, transition, ending — none are wired
- **Owner**: Phase 1 worker (screenManager.js)

## P1 — Logic Bugs (Non-Blocking but Game-Breaking)

### BUG-005: corruptionEngine._getRecordField returns wrong fields
- **File**: `js/engine/corruptionEngine.js:386-394`
- **Impact**: When corruption demands target 'hours' or 'days', the returned values are wrong (returns `workerType` for 'hours', `sessionId` for 'days'). This means secret notes record incorrect "original" values.
- **Reproducibility**: 100% when corruption demand fires (session >= 11)
- **Evidence**: `_getRecordField` maps 'hours' → `record.workerType` (string, not number) and 'days' → `record.sessionId` (session number, not day count)
- **Owner**: Phase 4 integration worker

### BUG-006: archiveEngine.writeEntry doesn't validate required fields
- **File**: `js/engine/archiveEngine.js` — `writeEntry` method
- **Impact**: Records can be written with empty names or missing data. No validation before adding to archive.
- **Reproducibility**: 100% — no validation code in writeEntry path
- **Evidence**: Record model has `validate()` method but archiveEngine never calls it before adding
- **Owner**: Phase 4 integration worker

### BUG-007: narrativeEngine._queueSessionEvents sorts incorrectly
- **File**: `js/engine/narrativeEngine.js:120-122`
- **Impact**: Events are sorted so autoTrigger=true events come AFTER non-auto events (descending sort puts 0 before 1). This reverses the intended order.
- **Reproducibility**: 100% when session has mixed auto/manual events
- **Evidence**: Sort comparator `(b.autoTrigger ? 1 : 0) - (a.autoTrigger ? 1 : 0)` — when b is auto and a is not, result is 1 (b goes later, wrong)
- **Owner**: Phase 4 integration worker

### BUG-008: memoryChallenge has no timer enforcement
- **File**: `js/engine/memoryChallenge.js`
- **Impact**: The `viewDuration` config specifies how long player sees info, but no code enforces it. Player could view indefinitely.
- **Reproducibility**: 100% — no timer logic in the challenge flow
- **Evidence**: `viewDuration` is set per challenge but never decremented or checked
- **Owner**: Phase 2 worker (renderer must enforce view duration)

## P2 — Minor / Cosmetic

### BUG-009: CSS shake animation never triggered
- **File**: `css/style.css` — `@keyframes shake`
- **Impact**: Shake animation defined but never applied (no JS adds/removes the class)
- **Reproducibility**: 100% — no code path triggers `.shake`
- **Owner**: Phase 2 renderer worker (apply CSS class when pressure system triggers shake)

### BUG-010: graceSystem._buildNameMap references undefined method
- **File**: `js/engine/graceSystem.js:325` — `p.getFamiliarity()`
- **Impact**: `getFamiliarity()` is called on person objects but Person model exposes `familiarity` as a computed property, not a method
- **Reproducibility**: 100% when ending triggers and grace system saves cross-game data
- **Evidence**: Person model has `familiarity` (getter-style property via `getFamiliarity` if defined, but checking person.js it's a method — need to verify)
- **Owner**: Phase 4 integration worker (verify Person.getFamiliarity exists)

### BUG-011: saveSystem._collectSaveData may reference null engines
- **File**: `js/engine/saveSystem.js:157-201`
- **Impact**: If any engine fails to initialize, save collects partial data. Guard checks exist (`if (N.engine.archiveEngine)`) so this is handled correctly — but deserialization of partial saves is not tested.
- **Reproducibility**: N/A — defensive coding, not a bug per se
- **Owner**: No fix needed (defensive guards already in place)

## Design vs Implementation Mismatch (Not a Bug — Risk)

### MISMATCH-001: Design doc describes different game
- **File**: `game9-twilight-aphasia.md` vs actual implementation
- **Details**: Design doc describes "失语的黄昏" (Babel/language confusion, social graphs, 8 chapters, 10000+ lines). Implementation is "名字账册" (construction-site ledger, 25 sessions, 5 acts, ~5500 lines of logic).
- **Impact**: Any developer using design doc as reference will build wrong features
- **Owner**: Manager decision — see RISK_REGISTER.md

## Summary

| Severity | Count | Blocking? |
|----------|-------|-----------|
| P0 | 4 | Yes — game cannot run |
| P1 | 4 | Yes — game logic broken at runtime |
| P2 | 3 | No — cosmetic or edge cases |
| Mismatch | 1 | Risk — wrong reference doc |

**Total actionable bugs: 11** (4 P0 + 4 P1 + 3 P2)

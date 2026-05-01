# Execution Breakdown — Worker Packets

## Packet Order

Packets are ordered by dependency. Each packet creates new files only (no edits to existing code until Packet 4).

---

## Packet 1: Game Loop & State Machine

**Scope**: Create `js/main.js` and `js/screenManager.js`
**Net lines**: ~400
**Depends on**: Nothing (all engine/model/data code already exists)

### Tasks
1. **main.js** (~150 lines)
   - Initialize namespace: `N.canvas`, `N.ctx`, `N.state = new GameState()`
   - Initialize silence system: `N.engine.silenceSystem.initialize()`
   - `requestAnimationFrame` loop with delta-time capping (max 100ms to avoid spiral)
   - Call `update(dt)` on all engines in order: pressureSystem → silenceSystem → narrativeEngine → corruptionEngine → archiveEngine → saveSystem
   - Call `screenManager.render(ctx)` each frame

2. **screenManager.js** (~250 lines)
   - State machine mapping `N.state.phase` to render/update logic
   - Phase transitions: `title` → `briefing` → `working` → `memory_challenge` → `event` → `dialogue` → `transition` → `ending`
   - Each phase has `enter()`, `update(dt)`, `exit()` hooks
   - Title screen: tap to start new game or load save
   - Briefing: show session config text, auto-advance after timer
   - Working: drive narrativeEngine.getNextWorker(), archiveEngine.writeEntry()
   - Memory challenge: drive memoryChallenge.start(), display, evaluate
   - Event: process narrativeEngine.processNextEvent()
   - Dialogue: display dialogue with choices, handle dismiss
   - Transition: show act transition text, advance session
   - Ending: display ending based on N.state.endingType

### Acceptance Tests
- [ ] `index.html` loads with zero console errors
- [ ] Game loop runs at ~60fps (verify via console log or breakpoint)
- [ ] `N.state` is initialized with correct defaults (session=1, act=1, phase='title')
- [ ] Phase transitions occur in correct order for Session 1
- [ ] All engine `update(dt)` methods called each frame

### Files Modified
| File | Action | Lines |
|------|--------|-------|
| `js/main.js` | Rewrite | ~150 |
| `js/screenManager.js` | Create | ~250 |

---

## Packet 2: Canvas Renderer

**Scope**: Create `js/renderer.js`
**Net lines**: ~800
**Depends on**: Packet 1 (needs screenManager phases to know what to render)

### Tasks
1. **renderer.js** (~800 lines)
   - Master render function dispatching to phase-specific renderers
   - **Title screen renderer**: Game title "名字账册", subtitle, tap-to-start, load-save indicator
   - **Briefing renderer**: Session number, act number, briefing text with typewriter effect
   - **Ledger/Archive renderer**: Consumes `archiveEngine.getViewData()` — draw ledger pages, ink effects, entries, page numbers, degradation visual
   - **Worker input renderer**: Name input area, worker info display, submit button (44px+ targets)
   - **Memory challenge renderer**: Person info display (timed), name choices, timer bar, result feedback
   - **Dialogue renderer**: Speaker name, text box, choice buttons — consumes `narrativeEngine.getCurrentDialogue()`
   - **Narration renderer**: Overlay text with fade — consumes `narrativeEngine.getViewData()`
   - **Silence overlay renderer**: Fade-to-dark, observation text, breathing animation — consumes `silenceSystem.getViewData()`
   - **Corruption demand renderer**: Demand text, three buttons (comply/resist/secret note)
   - **HUD renderer**: Session counter, score, ink level, remaining workers, fatigue indicator
   - **Ending renderer**: Ending type display, grace summary, play-again option

2. **Visual style**: Ink/brush aesthetic
   - Dark background (construction site at dusk)
   - Calligraphy-style text rendering
   - Paper texture for ledger pages
   - Red ink for corruption, gold for grace moments

### Acceptance Tests
- [ ] Title screen renders "名字账册" text on canvas
- [ ] Ledger view shows archive entries with correct formatting
- [ ] Memory challenge shows person info and 3+ choice buttons
- [ ] Dialogue box renders speaker and text
- [ ] Silence overlay fades in and shows observation text
- [ ] All touch targets >= 44px height/width
- [ ] No horizontal overflow (canvas stays 375px wide)
- [ ] CSS shake/pulse animations trigger correctly

### Files Modified
| File | Action | Lines |
|------|--------|-------|
| `js/renderer.js` | Create | ~800 |

---

## Packet 3: Input Handler

**Scope**: Create `js/input.js`
**Net lines**: ~300
**Depends on**: Packet 1 (needs screenManager to know which inputs are valid per phase)

### Tasks
1. **input.js** (~300 lines)
   - Install touch event listeners on canvas: `touchstart`, `touchmove`, `touchend`
   - Mouse fallback: `mousedown`, `mousemove`, `mouseup`
   - Gesture detection: tap (<200ms, <10px movement), long-press (>500ms), swipe (>30px directional)
   - Hit-testing against rendered UI elements (buttons, choices, input areas)
   - Phase-aware input routing:
     - `title`: tap anywhere → new game or load
     - `working`: tap input field → focus, tap submit → writeEntry, swipe left/right → flip page
     - `memory_challenge`: tap choice → submit answer
     - `dialogue`: tap choice or tap to dismiss
     - `corruption`: tap comply/resist/secret button
     - `event`: tap to dismiss narration
   - Forward all interactions to `silenceSystem.recordInteraction()`
   - Virtual keyboard handling for name input (HTML overlay or custom)
   - Install `N.input = inputHandler` on namespace

### Acceptance Tests
- [ ] Touch tap on title screen starts new game
- [ ] Touch on name input field activates input
- [ ] Touch on submit button writes entry to archive
- [ ] Swipe left/right flips archive pages
- [ ] Touch on memory challenge choice submits answer
- [ ] Touch on dialogue choice/dismiss works
- [ ] Silence timer resets on any touch
- [ ] All interactive elements have >= 44px touch targets

### Files Modified
| File | Action | Lines |
|------|--------|-------|
| `js/input.js` | Create | ~300 |

---

## Packet 4: Integration & Bug Fixes

**Scope**: Edit existing files to fix P1 bugs and wire systems together
**Net lines**: ~200 (edits only, no new files)
**Depends on**: Packets 1-3 (needs loop, renderer, and input all working)

### Tasks
1. **Fix BUG-005** — `corruptionEngine._getRecordField` wrong field mapping
   - File: `js/engine/corruptionEngine.js:386-394`
   - Map 'hours' to actual hours field on record, 'days' to actual days field

2. **Fix BUG-007** — `narrativeEngine._queueSessionEvents` sort order reversed
   - File: `js/engine/narrativeEngine.js:120-122`
   - Fix comparator: `(a.autoTrigger ? 1 : 0) - (b.autoTrigger ? 1 : 0)`

3. **Wire save system** into game loop
   - File: `js/main.js` (edit from Packet 1)
   - Ensure `saveSystem.update(dt)` is called in loop for auto-save

4. **Wire corruption demand flow**
   - Ensure corruption demands generate UI (via renderer) and player choices (via input) are routed to comply/resist/secret methods

5. **Add entry validation**
   - File: `js/engine/archiveEngine.js`
   - Call `record.validate()` before adding to archive

6. **Verify Person.getFamiliarity** exists (BUG-010)
   - If method doesn't exist, fix graceSystem._buildNameMap to use correct property

### Acceptance Tests
- [ ] Session 1 completes end-to-end without errors
- [ ] Corruption demand fires in session 11+ with correct original values
- [ ] Auto-save triggers every 30 seconds
- [ ] Save/load round-trip preserves all engine state
- [ ] Event sort order is correct (auto-trigger events first)
- [ ] `test.mjs` passes

### Files Modified
| File | Action | Lines |
|------|--------|-------|
| `js/engine/corruptionEngine.js` | Edit lines 386-394 | ~10 |
| `js/engine/narrativeEngine.js` | Edit lines 120-122 | ~3 |
| `js/main.js` | Edit (add saveSystem update) | ~5 |
| `js/engine/archiveEngine.js` | Edit (add validation) | ~10 |

---

## Script Load Order (index.html)

After all packets, script load order should be:
1. `namespace.js` — sets up `window.Names`
2. Data files: `nameParts.js`, `workers.js`, `sessions.js`, `dialogues.js`, `events.js`
3. Models: `person.js`, `record.js`, `gameState.js`, `archive.js`
4. Engines: `nameGenerator.js`, `personTracker.js`, `archiveEngine.js`, `memoryChallenge.js`, `pressureSystem.js`, `corruptionEngine.js`, `graceSystem.js`, `silenceSystem.js`, `narrativeEngine.js`, `saveSystem.js`
5. **New**: `screenManager.js`, `renderer.js`, `input.js`
6. **New**: `main.js` (last — initializes everything)

New `<script>` tags must be added to `index.html` for the 3 new files + main.js moved to end.

## Total Scope

| Packet | New Files | Edits | Lines |
|--------|-----------|-------|-------|
| 1 | 2 | 0 | ~400 |
| 2 | 1 | 0 | ~800 |
| 3 | 1 | 0 | ~300 |
| 4 | 0 | 4 | ~200 |
| **Total** | **4** | **4** | **~1700** |

Within constraints: 4 files modified (new files created), ~1700 net lines.

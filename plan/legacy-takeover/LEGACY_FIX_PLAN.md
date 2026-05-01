# Legacy Fix Plan — 名字账册 (The Ledger of Names)

## Summary

The codebase contains ~5500 lines of well-architected engine/model/data code across 18 JS files, but **the game does not run**. `js/main.js` is empty (2 lines: a comment). There is no game loop, no renderer, no input handler, and no screen/state management. The engines expose consistent `update(dt)`, `getViewData()`, and `serialize()`/`deserialize()` interfaces — all designed for a game loop that does not exist.

Additionally, the design document (`game9-twilight-aphasia.md`) describes a fundamentally different game ("失语的黄昏" — Babel/language-confusion social deduction with 8 chapters) than what is implemented ("名字账册" — construction-site name-recording game with 25 sessions/5 acts). The design doc cannot be used as a requirements source.

## Fix Strategy

The repair follows a single dependency chain: **loop → screens → renderer → input → integration**.

### Phase 1: Core Loop & State Machine (P0 — Blocker)
- Implement `js/main.js`: requestAnimationFrame game loop, delta-time, init/update/render cycle
- Implement screen/state manager: title → briefing → working → memory_challenge → event → dialogue → transition → ending
- Wire `N.state` initialization via `GameState` model
- **Stop condition**: Game loop runs at 60fps, `N.state.phase` transitions correctly, all engine `update(dt)` called each frame

### Phase 2: Canvas Renderer (P0 — Blocker)
- Implement `js/renderer.js`: canvas-based renderer consuming `getViewData()` from each engine
- Render: ledger/archive view, worker input form, memory challenge UI, dialogue boxes, narration overlays, silence overlay
- Ink/brush visual style matching CSS keyframes (shake, pulse, ink-drip)
- **Stop condition**: All game states render correctly on 375x812 canvas, touch targets >= 44px

### Phase 3: Input Handler (P0 — Blocker)
- Implement `js/input.js`: touch-first input with tap, long-press, swipe detection
- Map inputs to engine actions: write name, select choice, flip page, dismiss dialogue
- Feed interaction events to `silenceSystem.recordInteraction()`
- **Stop condition**: All touch interactions mapped, silence timer resets on input, memory challenge choices work

### Phase 4: Integration & Polish (P1)
- Wire narrative engine event processing into game loop
- Wire corruption engine demand flow with UI choices (comply/resist/secret)
- Wire save system auto-save into game loop (every 30s)
- Add CSS transitions for screen changes
- **Stop condition**: Full session playthrough works: briefing → workers → memory challenge → events → corruption → session end → next session

## Stop Conditions (Global)

1. `index.html` loads in browser with zero console errors
2. Title screen renders and responds to tap
3. Session 1 completes end-to-end (briefing → process workers → memory challenge → session end)
4. Save/load round-trips without data loss
5. `test.mjs` passes (no JS errors, game area exists, touch targets >= 44px)

## Estimated Scope

| Phase | New Files | Lines (est.) | Depends On |
|-------|-----------|-------------|------------|
| Phase 1 | 2 (main.js, screenManager.js) | ~400 | None |
| Phase 2 | 1 (renderer.js) | ~800 | Phase 1 |
| Phase 3 | 1 (input.js) | ~300 | Phase 1 |
| Phase 4 | 0 (edits to existing) | ~200 | Phases 1-3 |
| **Total** | **4 files** | **~1700 lines** | |

## What NOT to Change

- All 4 data files (workers.js, nameParts.js, sessions.js, dialogues.js, events.js) — correct and complete
- All 4 model files (person.js, record.js, gameState.js, archive.js) — correct and complete
- All 10 engine files — logic is sound, only need game loop to drive them
- `js/namespace.js` — correct
- `css/style.css` — correct
- `index.html` script load order — correct

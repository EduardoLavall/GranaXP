# Mobile Roadmap

The current demo is responsive but still desktop-first internally. The long-term product target is a mobile app experience.

## Goal
Move from "responsive desktop dashboard" to "mobile-first finance game" without breaking the presentation/demo logic.

## Phase 1 — preserve compatibility
Current branch keeps the existing UI intact while introducing backend persistence. No major navigation rewrite should be mixed with infrastructure work.

## Phase 2 — mobile information architecture
Target viewport first: 360–430 px wide.

Primary navigation:
- Home
- Gastos
- Missões
- Melhorias
- Perfil

Use a fixed bottom navigation on mobile. Desktop may render the same navigation as a centered phone frame or expanded layout, but mobile is the source design.

## Phase 3 — compact HUD
Replace the wide desktop HUD on small screens with:
- level + XP bar;
- coins;
- streak;
- compact profile access.

Do not hide important progression state behind a hamburger.

## Phase 4 — touch UX
Requirements:
- 44px+ touch targets;
- no hover-only actions;
- dialogs become mobile sheets where appropriate;
- safe-area support;
- `100dvh` layouts;
- one-column content flow;
- transaction actions remain reachable with one thumb.

## Phase 5 — installability
Evaluate PWA after the mobile information architecture is stable:
- manifest;
- service worker/offline shell;
- install prompt;
- cached static assets;
- explicit sync status when offline.

Do not introduce PWA complexity before remote/local synchronization behavior is reliable.

## Phase 6 — native wrapper only if justified
If store distribution becomes necessary, evaluate Capacitor or another thin wrapper around the web app. Avoid rewriting the product in a new framework without evidence that web/PWA is insufficient.

## Acceptance criteria for the mobile rewrite
- designed at 390x844 first;
- bottom navigation, not desktop sidebar adaptation;
- no horizontal scrolling;
- main actions accessible with one hand;
- game feedback remains readable on small screens;
- offline/local fallback still works;
- backend API contract unchanged unless spec is updated.

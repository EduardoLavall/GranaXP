# Product Spec — GranaXP

## Product goal
GranaXP is a gamified personal-finance application that turns healthy financial habits into visible game progression.

The product should help users consistently record, review and understand spending without rewarding consumption itself.

## Core loop
1. user performs a real financial action;
2. records/reviews it in GranaXP;
3. system updates budget/progress;
4. quests advance;
5. user earns XP/virtual coins for healthy behavior;
6. progression unlocks cosmetic/interface upgrades;
7. user returns for the next short session.

## MVP capabilities
- monthly budget;
- expenses and categories;
- remaining budget;
- XP/levels;
- virtual coins;
- daily/weekly quests;
- achievements;
- upgrades;
- local persistence fallback;
- Vercel backend persistence in Google Sheets;
- presentation + playable demo.

## Ethical rules
- XP is based on consistency/behavior, never transaction value.
- Never reward debt, credit usage, risky investing or higher spending.
- Virtual coins are not BRL, crypto, investment or withdrawable value.
- Imported bank transactions are candidates until reviewed by the user.

## Current MVP boundary
The current backend is intentionally single-user. Identity comes from server env `GRANAXP_USER_ID`. Real authentication, multi-user authorization and stronger concurrency guarantees are future phases.

## Success direction
The product hypothesis remains: gamification can improve frequency and retention in personal-finance tracking compared with a plain tracker, without creating unhealthy financial incentives.

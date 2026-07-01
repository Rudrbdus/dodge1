@GAME_SPEC.md

# Project Instructions

This project is a mobile-first, PC-compatible casual bullet-dodging game. Use `GAME_SPEC.md` as the source of truth for gameplay, visual style, input behavior, scoring, and scope decisions.

## Game Development Rules

- Preserve the same playable area and gameplay behavior across mobile and PC.
- Treat the mobile portrait playfield as the canonical play area.
- On PC, keep the playable area at the mobile aspect ratio and use the outer area only as non-interactive background.
- Keep the PC playfield boundary visually simple, preferably a thin line or similarly minimal divider.
- Do not allow gameplay objects, collisions, scoring, or input to depend on the outer PC background area.

## Input Rules

- Mobile input uses drag movement from the current position, based on drag direction and distance.
- PC input uses left mouse drag with the same movement behavior as mobile touch drag.
- Do not move the player directly to the touched or clicked coordinate.
- Keep touch and mouse behavior consistent through a shared input abstraction when practical.

## Gameplay Rules

- Avoid frame-rate-dependent movement, timers, bullet approach behavior, scoring, and reward calculation.
- Keep player state, bullet state, item state, score, time, and run state explicit and easy to inspect.
- Separate gameplay simulation from rendering, UI, audio, and platform-specific input glue.
- Collision behavior must be clear and deterministic: touching a bullet immediately ends the run.
- When adding bullets, items, bosses, or encounters, preserve the core readability of the playfield.

## Visual Direction

- Follow the reference images for the initial look: bright background, minimal UI, colorful circular bullet objects, and a casual mobile-game feel.
- Prefer readable, simple shapes over detailed assets for MVP implementation.
- Keep UI sparse during active play so bullets, player position, time, score, and coins remain easy to read.
- Theme and character variations should be treated as unlockable content, not core MVP blockers.

## MVP Priorities

- Prioritize the playable loop: start run, move player, spawn bullets, dodge, collect/trigger item effects, die, show result, grant coins.
- Implement scoring and reward values with simple tunable constants before building complex balancing systems.
- Keep future boss, random encounter, theme, and character unlock systems possible without implementing them early.
- Add tests or debug checks around input movement, playfield bounds, collision, scoring, and reward calculation when those systems are implemented.


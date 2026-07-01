# Game Spec

## Concept

A mobile-first bullet-dodging game that also supports PC. The player controls a cursor-shaped character, avoids colorful circular bullets, survives as long as possible, gains score, and earns coins based on run performance.

Reference images:

- `게임모티브.png`
- `게임모티브2.png`
- `게임모티브3.png`

## Target Platforms

- Mobile
- PC

Mobile portrait play is the primary layout. PC should preserve the same playable area ratio and gameplay space instead of expanding the game field to the full desktop window.

## Playfield

- Mobile: the full screen is the playable area.
- PC: the playable area uses the same aspect ratio as the mobile playfield.
- PC outer area: non-interactive background only.
- The PC playable area should be separated from the outer area with a simple line or similarly minimal visual treatment.
- Gameplay objects must remain inside the playable area.

## Player

- The default player character is a cursor-shaped object.
- Additional player shapes may be unlockable later.
- Player readability is more important than visual detail.

## Controls

### Mobile

- The player moves by dragging on the screen.
- Movement is based on drag direction and drag distance from the player's current position.
- Touching a location must not teleport or snap the player to that coordinate.

### PC

- The player uses left mouse drag.
- PC mouse drag should match the mobile drag behavior.
- The same control feel should be preserved across both platforms.

## Bullet Behavior

- Bullets are colorful circular objects with a soft, water-drop-like feel.
- Bullets spawn at random positions.
- Bullets gradually approach the player character.
- Bullet colors should follow the bright, playful reference image palette.
- Bullet readability is more important than decorative complexity.

## Items

- Items can be collected to destroy bullets.
- Destroying bullets increases the score.
- Item behavior should be simple for the MVP and remain tunable later.

## Death And Results

- Touching a bullet immediately kills the player.
- On death, show a result view with the current survival time and score.
- The result view should support showing earned coins.

## Score And Rewards

- Survival time increases during play.
- Score increases during play, especially when bullets are destroyed.
- Coins are granted after a run based on:

```text
survival time + score * alpha
```

- `alpha` is a tunable balance value to be adjusted later.
- The first implementation can use a simple constant value for `alpha`.

## Progression

Planned unlockable content:

- Player character shapes
- Visual themes

Theme changes should be possible later, but the first version should use the reference image color direction.

## Visual Style

- Bright cream or off-white background.
- Minimal, spacious mobile UI.
- Thin line UI elements.
- Pastel or vivid multicolor circular bullets.
- Casual, clean, lightweight presentation.
- Avoid dense UI during active play.

## Future Features

Planned but not required for the first MVP:

- Boss encounters
- Random encounters
- Additional player shapes
- Theme unlocks
- More detailed reward balancing

## MVP Scope

The first playable version should include:

- One player shape
- One visual theme based on the reference images
- Mobile portrait playfield rules
- PC playfield with matching mobile aspect ratio
- Touch drag and mouse drag input
- Bullet spawning
- Bullet movement toward the player
- Collision death
- Basic item effect for bullet removal
- Time tracking
- Score tracking
- Result screen
- Coin reward calculation


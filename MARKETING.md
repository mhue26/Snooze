# Snooze — design tokens

**Fonts:** System (Roboto / SF). Sizes: 21 wordmark · 36–38 display · 30 title · 14–16 body · 15 button · 9–10 overline · 12 tab.

## Palette (4 colours only)

| | Hex | Role |
|---|-----|------|
| **Key** | `#101b32` | Night — app background, chrome, ink on light accents |
| **Key** | `#f2f0e9` | Paper — cards and light surfaces on dark |
| **Accent** | `#cbd7fa` | Action — buttons, links, active tab, focus |
| **Accent** | `#d5dfff` | Glow — brand mark, highlights, halos |

**Derived (on paper cards):** `textOnPaperFaint` — night at **48%** (`rgba(16, 27, 50, 0.48)`) · small **h** / **m** on duration (28px vs 40px numbers).

**Weekday dots:** `dotActive` — glow (`#d5dfff`, 22px circle with day initial) · `dotInactive` — paper at **30%** (`rgba(242, 240, 233, 0.3)`, 6px circle).

Implemented in `src/theme/tokens.ts` (`palette` + `theme` semantics). Other secondary UI uses alpha on **night** / **paper** only.

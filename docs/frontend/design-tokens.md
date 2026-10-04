# Design tokens

Defined in `@theme` of `frontend/src/styles/globals.css`; Tailwind turns each into utilities (`--color-ink` → `text-ink`, `bg-ink`; `--radius-field` → `rounded-field`; `--font-sans` → `font-sans`).

## Font
| Token | Value |
|---|---|
| `--font-sans` | `'DM Sans', ui-sans-serif, system-ui, sans-serif` |

## Color
| Token | Value | Note |
|---|---|---|
| `--color-brand-50` | `#eef0ff` | |
| `--color-brand-100` | `#e0e3ff` | |
| `--color-brand-600` | `#4338ca` | |
| `--color-brand-700` | `#3730a3` | |
| `--color-brand-900` | `#1e1b4b` | |
| `--color-ink` | `#111827` | default text |
| `--color-muted` | `#374151` | |
| `--color-subtle` | `#6b7280` | 4.8:1 on white (WCAG AA) for placeholder and helper text |
| `--color-line` | `#e5e7eb` | |
| `--color-danger` | `#b91c1c` | |

## Radius
| Token | Value |
|---|---|
| `--radius-field` | `0.5rem` |

## Base
`html`: `bg-white font-sans text-ink antialiased`.

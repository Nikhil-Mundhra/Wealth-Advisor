# Design tokens

Source: `@theme` in `frontend/src/styles/globals.css`. Each token becomes Tailwind utilities by its suffix: `--color-ink` → `text-ink`, `bg-ink`; `--radius-field` → `rounded-field`; `--font-sans` → `font-sans`, `--font-display` → `font-display`. Dark values live in the `.dark` override in the same file; utilities read the vars, so `dark:` classes appear only where light and dark need different tokens (e.g. text on brand fills).

| Family | Tokens |
|---|---|
| font | `sans` (DM Sans, body) `display` (Fraunces, headings and hero numbers) |
| color | `brand-50` `brand-100` `brand-600` `brand-700` `brand-900` `brand-950` (on-brand-fill ink) `gold` `gold-subtle` `ink` `muted` `subtle` `line` `danger` `surface` `surface-subtle` |
| chart | `chart-1` … `chart-5` (colorblind-safe set, both modes) |
| radius | `field` |

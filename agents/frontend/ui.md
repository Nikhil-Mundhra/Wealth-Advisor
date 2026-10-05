# Frontend: UI primitives and layout

## Calls
- `docs/frontend/design-tokens.md` : token names

## Rules
- Theme colors, field radius and font come from tokens; no raw hex values.
- Variants use `cva`.
- Every control has a label (`FormField`); errors link via `aria-describedby`; icon-only buttons take `label`; focus stays visible.

## Workflow
- token change → `docs/frontend/design-tokens.md`

## File structure

```
frontend/src/components/layout/app-shell.test.tsx : page body with sidebar and bottom-tab links
frontend/src/components/layout/app-shell.tsx : signed-in frame: header, desktop sidebar, mobile bottom tabs
frontend/src/components/layout/split-layout.tsx : two-pane page: media aside (desktop) + centered content
frontend/src/components/ui/alert.tsx : form-level message (role=alert), error/info tones
frontend/src/components/ui/button.test.tsx : Button type default and loading state
frontend/src/components/ui/button.tsx : Button: primary/outline/ghost/inverse variants, loading state
frontend/src/components/ui/checkbox.tsx : labelled checkbox
frontend/src/components/ui/divider.tsx : horizontal rule with optional centered text (currently unused)
frontend/src/components/ui/form-field.test.tsx : label, hint and error wiring
frontend/src/components/ui/form-field.tsx : label + control + hint/error with accessible id wiring
frontend/src/components/ui/icon-button.tsx : icon-only Button with required accessible label
frontend/src/components/ui/input.tsx : text input; invalid style follows aria-invalid
frontend/src/components/ui/label.tsx : form label
frontend/src/components/ui/language-select.test.tsx : every locale listed, choice persisted
frontend/src/components/ui/language-select.tsx : header locale select backed by the locale store
frontend/src/components/ui/password-input.test.tsx : visibility toggle and aria-pressed
frontend/src/components/ui/password-input.tsx : Input with show/hide toggle
frontend/src/components/ui/spinner.tsx : loading indicator, optionally announced
frontend/src/components/ui/text-link.tsx : router-aware inline link
frontend/src/components/ui/theme-toggle.test.tsx : flips the dark class and announces the next mode
frontend/src/components/ui/theme-toggle.tsx : header control flipping .dark on <html>
frontend/src/lib/cn.ts : className merge helper
frontend/src/lib/demo-data.ts : Elena fixture standing in for the Phase 2 endpoints
frontend/src/lib/dictionaries.test.ts : every locale carries exactly the English keys
frontend/src/lib/dictionaries.ts : UI copy per locale with a locale-reading hook
frontend/src/lib/format-money.test.ts : locale currency rendering
frontend/src/lib/format-money.ts : locale-aware money rendering
frontend/src/lib/locale-store.ts : active locale, localStorage, <html lang> applier
frontend/src/lib/theme-store.ts : light/dark choice, localStorage, .dark applier
frontend/src/lib/use-count-up.test.ts : lands on target, jumps with reduced motion
frontend/src/lib/use-count-up.ts : eased hero-number count-up
frontend/src/lib/use-reveal.test.ts : immediate fallback and scroll-in flip
frontend/src/lib/use-reveal.ts : scroll-in reveal hook
frontend/src/styles/globals.css : Tailwind import and design tokens
```

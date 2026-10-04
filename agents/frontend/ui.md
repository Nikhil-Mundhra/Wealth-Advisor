# Frontend: UI primitives and layout

## Calls
- `docs/frontend/design-tokens.md` : token names before styling

## Rules
- `components/` knows nothing about features.
- Colors, radius and fonts come only from tokens in `styles/globals.css`.
- Variants use `cva`; class names merge through `cn`.
- Every control has a label (`FormField`); errors link via `aria-describedby`; icon-only buttons take `label`; focus stays visible.

## Workflow
- add a UI primitive: `components/ui/<name>.tsx` (cva for variants) + test next to it → map line
- add or change a token: `@theme` in `styles/globals.css` → `docs/frontend/design-tokens.md`

## File structure

```
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
frontend/src/components/ui/password-input.test.tsx : visibility toggle and aria-pressed
frontend/src/components/ui/password-input.tsx : Input with show/hide toggle
frontend/src/components/ui/spinner.tsx : loading indicator, optionally announced
frontend/src/components/ui/text-link.tsx : router-aware inline link
frontend/src/lib/cn.ts : className merge helper
frontend/src/styles/globals.css : Tailwind import and design tokens
```

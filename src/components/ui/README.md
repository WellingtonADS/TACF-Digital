TACF-Digital UI components

This folder contains primitive UI components aligned with the TACF-Digital Design System.

Available components:

- `Button` — variants: `primary`, `ghost`, `success`, `alert`, `error`.
- `Card` — simple container with rounded corners and optional shadow.
- `Typography` — `H1`, `H2`, `Body`, `Caption`.
- `Icon` — wrapper for `lucide-react` icons (use `as` prop).
- `Badge` — small status/counter badge.

Usage examples:

```tsx
import { Button, Card, H1, Badge } from "@/components/ui";

<Card>
  <H1>Meu título</H1>
  <Button variant="primary">Confirmar</Button>
  <Badge>8/21</Badge>
</Card>;
```

Follow project conventions: TypeScript strict and Tailwind tokens defined in `tailwind.config.ts`.

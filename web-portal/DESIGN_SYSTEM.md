# CareConnect Design System — Page Contract

Read this before redesigning any page. The shell (sidebar/header/command palette) and tokens already exist — pages only render their content area.

## Hard rules
1. **Never change business logic.** Every fetch/axios/react-query call, socket.io subscription, handler, route path, param, and piece of state logic stays byte-for-byte equivalent. You may move code between components but not alter behavior.
2. Do not edit shared files: `src/app/globals.css`, `src/app/layout.tsx`, `src/components/ui/*`, `src/components/shell/*`, `src/lib/*`. If a primitive is missing, build the page-local piece in the page file (or a sibling component file) and note the gap in your final report.
3. Pages must remain `'use client'` if they currently are, keep the same default export, and keep the same file path.
4. No new dependencies. Available: framer-motion, lucide-react, recharts, @tanstack/react-query, socket.io-client, clsx, tailwind-merge.

## Tokens (Tailwind classes)
- Surfaces: `bg-background`, `bg-card`, `bg-muted`, `bg-popover`
- Text: `text-foreground`, `text-muted-foreground`, `text-subtle-foreground`
- Borders: `border-border`, inputs `border-input`
- Intents: `bg-primary text-primary-foreground`, `text-success`/`bg-success-soft`, `text-warning`/`bg-warning-soft`, `text-danger`/`bg-danger-soft`, `text-info`/`bg-info-soft`
- Shadows: `shadow-soft`, `shadow-float`, `shadow-pop`
- Radii: cards `rounded-2xl` (16px) / panels `rounded-3xl` (24px)
- Utility classes: `glass-card`, `glass-panel`, `gradient-brand`, `gradient-surface`, `text-gradient`, `skeleton-shimmer`, `scrollbar-thin`, `no-scrollbar`, `animate-fade-up`, `animate-fade-in`, `animate-scale-in`
- **Never** use raw palette classes for chrome (`bg-white`, `bg-zinc-*`, `dark:bg-zinc-*`, `text-slate-*`) — use the semantic tokens above so light/dark/high-contrast all work. Soft accent tints (`bg-blue-50 dark:bg-blue-500/15` etc.) are allowed for icon tiles/badges only.

## Components — import from `@/components/ui`
- `Button` — variant: primary|secondary|outline|ghost|danger|glass|link; size: sm|md|lg|icon|icon-sm; `loading`
- `Badge` — tone: neutral|brand|success|warning|danger|info|outline; `dot`, `pulse`
- `Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter` — Card `variant`: default|glass|gradient|interactive
- `Tabs, TabsList, TabsTrigger, TabsContent` — controlled or `defaultValue`
- `Input` (`icon`, `error`), `Textarea`, `Select`, `Label`, `FieldHint`
- `Avatar` (`name` required, `src?`, `size xs-xl`, `status`), `AvatarGroup`
- `Skeleton`, `SkeletonCard`, `SkeletonTable` — replace ALL spinners with these
- `StatCard` (label, value, sub, icon, trend, trendPositive, tone, delay), `StatGrid` — for every KPI row
- `EmptyState` (icon, title, description, action), `ErrorState` (onRetry)
- `Dialog` (open, onClose, title, footer, size), `Drawer` (side panel)
- `Progress` (value, tone, label, showValue), `ProgressRing`
- `Dropdown, DropdownItem, DropdownSeparator, DropdownLabel` — row actions, menus
- `Switch`, `Timeline, TimelineItem` (icon, tone, title, meta)
- `PageHeader` (title, description, crumbs, actions) — **every page starts with this**
- `useToast()` from `@/components/ui/toast` — `toast('success','Saved')` for action feedback
- `DataTable<T>` from `@/components/ui` — columns/data/rowKey, built-in search/sort/pagination/CSV export/row actions/empty state. **Replace every hand-rolled table with it** unless the table has bespoke interactions worth keeping.

## Charts
Import `{ CHART_COLORS, chartGrid, chartAxis, chartTooltip }` from `@/lib/chart-theme` and spread into recharts elements. Wrap charts in a `Card` with a `CardHeader`; height via `ResponsiveContainer`.

## Page anatomy
```tsx
<div className="space-y-6">
  <PageHeader title="…" description="…" crumbs={[…]} actions={<Button>…</Button>} />
  <StatGrid>…4 StatCards…</StatGrid>          {/* if the page has KPIs */}
  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">…main + context panel…</div>
</div>
```
- 12-col mental model: main content `xl:col-span-2`, context rail `xl:col-span-1`.
- Loading: skeletons shaped like the real content. Error: `ErrorState` with retry. Empty: `EmptyState` with a primary CTA.
- Icons: lucide only, `h-4 w-4`/`h-5 w-5`, always `aria-hidden` unless standalone (then aria-label).
- Motion: entrance via `animate-fade-up` or framer-motion with `duration ≤0.45s`, stagger `delay={i * 0.05}`. Respect reduced motion (framer picks this up automatically; CSS anims are globally gated).
- Accessibility: semantic headings (one h1 via PageHeader), labels on inputs, `aria-current` nav, focus-visible is global. Tables need `<th scope="col">` (DataTable does this).
- Currency is INR (₹) — keep existing formatting.
- Responsive: grids collapse to 1 col on mobile; no fixed widths; wide tables scroll inside their container.

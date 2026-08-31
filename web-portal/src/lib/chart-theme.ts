/**
 * Shared recharts theming so every chart reads the design-system tokens.
 * Usage:
 *   <CartesianGrid {...chartGrid} />
 *   <XAxis {...chartAxis} dataKey="day" />
 *   <Tooltip {...chartTooltip} />
 *   <Area stroke={CHART_COLORS[0]} fill="url(#ccGradient1)" ... />
 */

export const CHART_COLORS = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
];

export const chartGrid = {
    stroke: 'var(--chart-grid)',
    strokeDasharray: '3 3',
    vertical: false,
} as const;

export const chartAxis = {
    stroke: 'transparent',
    tick: { fill: 'var(--muted-foreground)', fontSize: 12 },
    tickLine: false,
    axisLine: false,
} as const;

export const chartTooltip = {
    cursor: { stroke: 'var(--border)', strokeWidth: 1 },
    contentStyle: {
        background: 'var(--popover)',
        border: '1px solid var(--border)',
        borderRadius: '0.75rem',
        boxShadow: 'var(--shadow-float)',
        color: 'var(--foreground)',
        fontSize: 12,
        padding: '8px 12px',
    },
    labelStyle: { color: 'var(--muted-foreground)', fontWeight: 600, marginBottom: 4 },
    itemStyle: { color: 'var(--foreground)' },
} as const;

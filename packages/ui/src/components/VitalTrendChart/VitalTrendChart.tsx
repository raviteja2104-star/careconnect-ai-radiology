import React, { useMemo } from 'react';

export interface DataPoint {
  time: string;
  value: number;
  annotation?: string;
}

export interface ThresholdLine {
  value: number;
  label: string;
  color: 'red' | 'amber' | 'green';
}

export interface VitalTrendChartProps {
  title: string;
  unit: string;
  data: DataPoint[];
  thresholds?: ThresholdLine[];
  color?: string;
  height?: number;
  showGrid?: boolean;
  className?: string;
  isLoading?: boolean;
  normalRange?: [number, number];
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

export function VitalTrendChart({
  title, unit, data, thresholds = [], color = '#6366f1', height = 120, showGrid = true, className = '', isLoading, normalRange
}: VitalTrendChartProps) {
  const WIDTH = 400;
  const PAD = { top: 12, right: 16, bottom: 28, left: 36 };
  const chartW = WIDTH - PAD.left - PAD.right;
  const chartH = height - PAD.top - PAD.bottom;

  const { minVal, maxVal, points, pathD, areaD } = useMemo(() => {
    if (data.length === 0) return { minVal: 0, maxVal: 100, points: [], pathD: '', areaD: '' };

    const vals = data.map(d => d.value);
    const raw_min = Math.min(...vals);
    const raw_max = Math.max(...vals);
    const padding = (raw_max - raw_min) * 0.15 || 10;
    const minVal = raw_min - padding;
    const maxVal = raw_max + padding;

    const toX = (i: number) => (i / (data.length - 1)) * chartW;
    const toY = (v: number) => chartH - ((v - minVal) / (maxVal - minVal)) * chartH;

    const points = data.map((d, i) => ({ x: toX(i), y: clamp(toY(d.value), 0, chartH), data: d }));

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = `${pathD} L ${points[points.length - 1].x} ${chartH} L 0 ${chartH} Z`;

    return { minVal, maxVal, points, pathD, areaD };
  }, [data, chartW, chartH]);

  const toY = (v: number) => chartH - ((v - minVal) / (maxVal - minVal)) * chartH;

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm animate-pulse ${className}`}>
        <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded mb-3" />
        <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded" />
      </div>
    );
  }

  const latestVal = data[data.length - 1]?.value;
  const prevVal = data[data.length - 2]?.value;
  const trend = latestVal && prevVal ? (latestVal > prevVal ? '↑' : latestVal < prevVal ? '↓' : '→') : '';
  const isAbnormal = normalRange && latestVal !== undefined && (latestVal < normalRange[0] || latestVal > normalRange[1]);

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</span>
        {latestVal !== undefined && (
          <div className="flex items-center gap-1.5">
            <span className={`text-lg font-bold ${isAbnormal ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
              {latestVal}
            </span>
            <span className="text-xs text-slate-400">{unit}</span>
            <span className={`text-sm ${trend === '↑' ? 'text-amber-500' : trend === '↓' ? 'text-blue-500' : 'text-slate-400'}`}>{trend}</span>
            {isAbnormal && <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded">ABNORMAL</span>}
          </div>
        )}
      </div>

      {/* SVG Chart */}
      {data.length > 1 ? (
        <svg width="100%" viewBox={`0 0 ${WIDTH} ${height}`} className="overflow-visible">
          <defs>
            <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
            <clipPath id={`clip-${title}`}>
              <rect x={PAD.left} y={PAD.top} width={chartW} height={chartH} />
            </clipPath>
          </defs>

          <g transform={`translate(${PAD.left}, ${PAD.top})`}>
            {/* Grid Lines */}
            {showGrid && [0, 0.25, 0.5, 0.75, 1].map(t => (
              <line key={t} x1={0} y1={t * chartH} x2={chartW} y2={t * chartH}
                stroke="currentColor" strokeOpacity="0.06" strokeWidth="1" className="text-slate-900 dark:text-white" />
            ))}

            {/* Normal range shading */}
            {normalRange && (
              <rect
                x={0} y={clamp(toY(normalRange[1]), 0, chartH)}
                width={chartW}
                height={clamp(toY(normalRange[0]), 0, chartH) - clamp(toY(normalRange[1]), 0, chartH)}
                fill="green" fillOpacity="0.06"
              />
            )}

            {/* Threshold lines */}
            {thresholds.map((t, i) => {
              const y = clamp(toY(t.value), 0, chartH);
              const tColor = t.color === 'red' ? '#ef4444' : t.color === 'amber' ? '#f59e0b' : '#22c55e';
              return (
                <g key={i}>
                  <line x1={0} y1={y} x2={chartW} y2={y} stroke={tColor} strokeWidth="1" strokeDasharray="4 3" strokeOpacity="0.7" />
                  <text x={chartW - 2} y={y - 3} fill={tColor} fontSize="8" textAnchor="end">{t.label}: {t.value}</text>
                </g>
              );
            })}

            {/* Area fill */}
            <path d={areaD} fill={`url(#grad-${title})`} clipPath={`url(#clip-${title})`} />

            {/* Line */}
            <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" clipPath={`url(#clip-${title})`} />

            {/* Data points */}
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={3} fill={color} stroke="white" strokeWidth="1.5" />
                {p.data.annotation && (
                  <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="8" fill={color} className="font-medium">{p.data.annotation}</text>
                )}
              </g>
            ))}

            {/* X-axis labels */}
            {data.map((d, i) => {
              if (i % Math.ceil(data.length / 4) !== 0 && i !== data.length - 1) return null;
              const x = (i / (data.length - 1)) * chartW;
              return <text key={i} x={x} y={chartH + 14} textAnchor="middle" fontSize="8" fill="currentColor" fillOpacity="0.4" className="text-slate-600 dark:text-white">{d.time}</text>;
            })}

            {/* Y-axis label */}
            <text x={-PAD.left + 6} y={chartH / 2} textAnchor="middle" fontSize="8" fill="currentColor" fillOpacity="0.4" transform={`rotate(-90, ${-PAD.left + 6}, ${chartH / 2})`} className="text-slate-600 dark:text-white">{unit}</text>
          </g>
        </svg>
      ) : (
        <div className="h-20 flex items-center justify-center text-xs text-slate-400">Not enough data to render chart</div>
      )}
    </div>
  );
}

// Preset vital chart components
export const HeartRateChart = (props: Omit<VitalTrendChartProps, 'title' | 'unit' | 'color'>) =>
  <VitalTrendChart title="Heart Rate" unit="bpm" color="#ef4444" normalRange={[60, 100]} thresholds={[{ value: 100, label: 'Tachy', color: 'red' }, { value: 60, label: 'Brady', color: 'amber' }]} {...props} />;

export const BloodPressureChart = (props: Omit<VitalTrendChartProps, 'title' | 'unit' | 'color'>) =>
  <VitalTrendChart title="Systolic BP" unit="mmHg" color="#6366f1" normalRange={[90, 140]} thresholds={[{ value: 140, label: 'HTN', color: 'red' }, { value: 90, label: 'Hypo', color: 'amber' }]} {...props} />;

export const SpO2Chart = (props: Omit<VitalTrendChartProps, 'title' | 'unit' | 'color'>) =>
  <VitalTrendChart title="SpO₂" unit="%" color="#06b6d4" normalRange={[95, 100]} thresholds={[{ value: 94, label: 'Low', color: 'red' }]} {...props} />;

export const TemperatureChart = (props: Omit<VitalTrendChartProps, 'title' | 'unit' | 'color'>) =>
  <VitalTrendChart title="Temperature" unit="°C" color="#f59e0b" normalRange={[36.5, 37.5]} thresholds={[{ value: 38.0, label: 'Fever', color: 'red' }]} {...props} />;

export const RespiratoryChart = (props: Omit<VitalTrendChartProps, 'title' | 'unit' | 'color'>) =>
  <VitalTrendChart title="Resp Rate" unit="brpm" color="#22c55e" normalRange={[12, 20]} thresholds={[{ value: 20, label: 'High', color: 'red' }]} {...props} />;

export const BloodSugarChart = (props: Omit<VitalTrendChartProps, 'title' | 'unit' | 'color'>) =>
  <VitalTrendChart title="Blood Glucose" unit="mg/dL" color="#8b5cf6" normalRange={[70, 180]} thresholds={[{ value: 180, label: 'High', color: 'amber' }, { value: 70, label: 'Hypo', color: 'red' }]} {...props} />;

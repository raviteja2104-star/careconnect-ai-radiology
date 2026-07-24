import React from 'react';

// ─────────────────────────────────────────────────────────────────────
// NEWS2 Gauge
// ─────────────────────────────────────────────────────────────────────
export interface ClinicalScoreProps {
  score: number;
  maxScore: number;
  title: string;
  interpretation: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  lastUpdated?: string;
  trend?: 'improving' | 'stable' | 'deteriorating';
  aiInsight?: string;
  breakdown?: { label: string; value: number }[];
  className?: string;
}

const severityConfig = {
  low:      { color: '#22c55e', label: 'LOW RISK',      bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',  dot: 'bg-green-500' },
  medium:   { color: '#f59e0b', label: 'MEDIUM RISK',   bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',  dot: 'bg-amber-500' },
  high:     { color: '#ef4444', label: 'HIGH RISK',     bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',          dot: 'bg-red-500' },
  critical: { color: '#dc2626', label: 'CRITICAL RISK', bg: 'bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600',          dot: 'bg-red-600 animate-pulse' },
};

const trendIcon = { improving: '↓ Improving', stable: '→ Stable', deteriorating: '↑ Deteriorating' };
const trendColor = { improving: 'text-green-600', stable: 'text-slate-500', deteriorating: 'text-red-600' };

function ScoreGauge({ score, maxScore, color }: { score: number; maxScore: number; color: string }) {
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const progress = Math.min(score / maxScore, 1);
  const dash = progress * circumference;

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-100 dark:text-slate-800" />
        <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round" />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{score}</div>
        <div className="text-xs text-slate-400">/{maxScore}</div>
      </div>
    </div>
  );
}

export function ClinicalScoreCard({ score, maxScore, title, interpretation, severity, lastUpdated, trend, aiInsight, breakdown, className = '' }: ClinicalScoreProps) {
  const cfg = severityConfig[severity];

  return (
    <div className={`rounded-xl border-2 p-4 shadow-sm ${cfg.bg} ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">{title}</span>
          </div>
          {lastUpdated && <div className="text-xs text-slate-400 mt-0.5">Updated: {lastUpdated}</div>}
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full`} style={{ background: cfg.color + '22', color: cfg.color }}>
          {cfg.label}
        </span>
      </div>

      {/* Gauge + Interpretation */}
      <div className="flex items-center gap-4">
        <ScoreGauge score={score} maxScore={maxScore} color={cfg.color} />
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-800 dark:text-white">{interpretation}</p>
          {trend && (
            <div className={`text-xs font-medium mt-1 ${trendColor[trend]}`}>{trendIcon[trend]}</div>
          )}
        </div>
      </div>

      {/* Breakdown */}
      {breakdown && breakdown.length > 0 && (
        <div className="mt-3 pt-3 border-t border-current/10">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {breakdown.map((b, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">{b.label}</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{b.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Insight */}
      {aiInsight && (
        <div className="mt-3 pt-3 border-t border-current/10 flex items-start gap-2">
          <span className="text-sm shrink-0">🤖</span>
          <p className="text-xs text-slate-600 dark:text-slate-400 italic">{aiInsight}</p>
        </div>
      )}
    </div>
  );
}

// ─── Preset Scores ─────────────────────────────────────────────────────────
export function NEWS2Card({ score, className }: { score: number; className?: string }) {
  const severity: ClinicalScoreProps['severity'] = score >= 7 ? 'critical' : score >= 5 ? 'high' : score >= 3 ? 'medium' : 'low';
  const interp = score >= 7 ? 'Urgent clinical review required immediately' : score >= 5 ? 'Urgent ward review. Consider HDU/ICU' : score >= 3 ? 'Increased monitoring required' : 'Continue routine monitoring';
  return <ClinicalScoreCard score={score} maxScore={20} title="NEWS2" interpretation={interp} severity={severity} className={className} />;
}

export function SOFACard({ score, className }: { score: number; className?: string }) {
  const severity: ClinicalScoreProps['severity'] = score >= 11 ? 'critical' : score >= 7 ? 'high' : score >= 3 ? 'medium' : 'low';
  const interp = score >= 11 ? 'Predicted mortality >80%' : score >= 7 ? 'Predicted mortality 40–80%' : score >= 3 ? 'Significant organ dysfunction' : 'Minimal organ dysfunction';
  return <ClinicalScoreCard score={score} maxScore={24} title="SOFA" interpretation={interp} severity={severity} className={className} />;
}

export function APACHEIICard({ score, className }: { score: number; className?: string }) {
  const severity: ClinicalScoreProps['severity'] = score >= 25 ? 'critical' : score >= 15 ? 'high' : score >= 5 ? 'medium' : 'low';
  const interp = score >= 25 ? 'Predicted hospital mortality >50%' : score >= 15 ? 'Moderate-severe illness' : score >= 5 ? 'Moderate illness' : 'Low severity';
  return <ClinicalScoreCard score={score} maxScore={71} title="APACHE II" interpretation={interp} severity={severity} className={className} />;
}

export function GCSCard({ eye, verbal, motor, className }: { eye: number; verbal: number; motor: number; className?: string }) {
  const total = eye + verbal + motor;
  const severity: ClinicalScoreProps['severity'] = total <= 8 ? 'critical' : total <= 12 ? 'high' : total <= 14 ? 'medium' : 'low';
  const interp = total <= 8 ? 'Severe brain injury — intubation threshold' : total <= 12 ? 'Moderate brain injury' : total <= 14 ? 'Minor brain injury' : 'Normal consciousness';
  return (
    <ClinicalScoreCard score={total} maxScore={15} title="GCS" interpretation={interp} severity={severity}
      breakdown={[{ label: 'Eye (E)', value: eye }, { label: 'Verbal (V)', value: verbal }, { label: 'Motor (M)', value: motor }]}
      className={className}
    />
  );
}

export function PainScaleCard({ score, className }: { score: number; className?: string }) {
  const severity: ClinicalScoreProps['severity'] = score >= 8 ? 'critical' : score >= 5 ? 'high' : score >= 3 ? 'medium' : 'low';
  const interp = score >= 8 ? 'Severe — immediate intervention' : score >= 5 ? 'Moderate — analgesic review' : score >= 3 ? 'Mild-moderate pain' : 'Minimal/no pain';
  return <ClinicalScoreCard score={score} maxScore={10} title="Pain Scale" interpretation={interp} severity={severity} className={className} />;
}

export function SepsisRiskCard({ score, className }: { score: number; className?: string }) {
  const severity: ClinicalScoreProps['severity'] = score >= 3 ? 'critical' : score >= 2 ? 'high' : score === 1 ? 'medium' : 'low';
  const interp = score >= 3 ? 'High risk — activate Sepsis Bundle' : score >= 2 ? 'Moderate risk — ICU consult' : score === 1 ? 'At risk — close monitoring' : 'Low risk';
  return <ClinicalScoreCard score={score} maxScore={5} title="qSOFA/Sepsis Risk" interpretation={interp} severity={severity} className={className} />;
}

import React from 'react';

export type TimelineEventType =
  | 'admission' | 'discharge' | 'transfer'
  | 'consultation' | 'procedure' | 'surgery'
  | 'medication' | 'lab' | 'imaging' | 'note'
  | 'vitals' | 'alert' | 'ems' | 'other';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  timestamp: string;
  actor?: string;
  department?: string;
  data?: Record<string, unknown>;
  severity?: 'info' | 'success' | 'warning' | 'critical';
}

export interface ClinicalTimelineProps {
  events: TimelineEvent[];
  isLoading?: boolean;
  compact?: boolean;
  maxItems?: number;
  className?: string;
}

const typeConfig: Record<TimelineEventType, { color: string; icon: string; bg: string }> = {
  admission:    { color: 'bg-blue-500',   icon: '🏥', bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
  discharge:    { color: 'bg-green-500',  icon: '🚪', bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' },
  transfer:     { color: 'bg-purple-500', icon: '↔', bg: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' },
  consultation: { color: 'bg-indigo-500', icon: '👨‍⚕️', bg: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' },
  procedure:    { color: 'bg-cyan-500',   icon: '⚕', bg: 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800' },
  surgery:      { color: 'bg-orange-500', icon: '✂', bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' },
  medication:   { color: 'bg-teal-500',   icon: '💊', bg: 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800' },
  lab:          { color: 'bg-yellow-500', icon: '🔬', bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' },
  imaging:      { color: 'bg-gray-500',   icon: '📷', bg: 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800' },
  note:         { color: 'bg-slate-400',  icon: '📝', bg: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' },
  vitals:       { color: 'bg-red-500',    icon: '❤', bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
  alert:        { color: 'bg-red-600',    icon: '🚨', bg: 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700' },
  ems:          { color: 'bg-amber-500',  icon: '🚑', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
  other:        { color: 'bg-slate-400',  icon: '•',  bg: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' },
};

const severityPulse: Record<string, string> = {
  critical: 'ring-2 ring-red-400 ring-offset-2 animate-pulse',
  warning: 'ring-2 ring-amber-400 ring-offset-1',
  success: '',
  info: '',
};

export function ClinicalTimeline({ events, isLoading, compact = false, maxItems, className = '' }: ClinicalTimelineProps) {
  const displayed = maxItems ? events.slice(0, maxItems) : events;

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="w-0.5 h-12 bg-slate-200 dark:bg-slate-800 mt-1" />
            </div>
            <div className="flex-1 pb-4">
              <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
              <div className="h-3 w-2/3 bg-slate-100 dark:bg-slate-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 dark:text-slate-600">
        <div className="text-3xl mb-2">📋</div>
        <div className="text-sm">No timeline events recorded</div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800" />
      <div className="space-y-1">
        {displayed.map((event, idx) => {
          const cfg = typeConfig[event.type];
          return (
            <div key={event.id} className="relative flex gap-4">
              {/* Dot */}
              <div className="relative z-10 shrink-0">
                <div className={`w-8 h-8 rounded-full ${cfg.color} flex items-center justify-center text-xs shadow-sm ${event.severity ? severityPulse[event.severity] : ''}`}>
                  <span>{cfg.icon}</span>
                </div>
              </div>

              {/* Content */}
              <div className={`flex-1 mb-4 ${compact ? '' : ''}`}>
                <div className={`rounded-xl border p-3 shadow-sm ${cfg.bg}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">{event.title}</p>
                      {event.description && !compact && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{event.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                        <span>{event.timestamp}</span>
                        {event.actor && <span>· {event.actor}</span>}
                        {event.department && <span>· {event.department}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {maxItems && events.length > maxItems && (
        <div className="text-center mt-2">
          <span className="text-xs text-slate-400 dark:text-slate-500">{events.length - maxItems} more events...</span>
        </div>
      )}
    </div>
  );
}

// Specialized timeline variants built on ClinicalTimeline
export function MedicationTimeline({ events, ...props }: Omit<ClinicalTimelineProps, 'events'> & { events: TimelineEvent[] }) {
  return <ClinicalTimeline events={events.filter(e => e.type === 'medication')} {...props} />;
}

export function ProcedureTimeline({ events, ...props }: Omit<ClinicalTimelineProps, 'events'> & { events: TimelineEvent[] }) {
  return <ClinicalTimeline events={events.filter(e => ['procedure', 'surgery'].includes(e.type))} {...props} />;
}

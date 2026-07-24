import React from 'react';
import { Badge } from '../Badge/Badge';

// ─── StudyCard (Radiology) ────────────────────────────────────────────────────
export interface RadiologyStudy {
  studyId: string;
  modality: 'CT' | 'MRI' | 'XR' | 'US' | 'PET' | 'NM' | 'MG';
  studyDescription: string;
  bodyPart: string;
  orderedAt: string;
  status: 'ordered' | 'scheduled' | 'in-progress' | 'completed' | 'reported' | 'verified';
  priority: 'routine' | 'urgent' | 'stat';
  reportedBy?: string;
  aiFindings?: string[];
  thumbnailUrl?: string;
}

const modalityColors: Record<string, string> = {
  CT:  'bg-blue-600 text-white',
  MRI: 'bg-purple-600 text-white',
  XR:  'bg-slate-600 text-white',
  US:  'bg-teal-600 text-white',
  PET: 'bg-orange-600 text-white',
  NM:  'bg-indigo-600 text-white',
  MG:  'bg-pink-600 text-white',
};

const priorityBadge = {
  routine: { variant: 'neutral' as const, label: 'ROUTINE' },
  urgent:  { variant: 'warning' as const, label: 'URGENT' },
  stat:    { variant: 'danger' as const,  label: 'STAT' },
};

const studyStatusVariant = {
  ordered:      'neutral' as const,
  scheduled:    'info' as const,
  'in-progress':'warning' as const,
  completed:    'info' as const,
  reported:     'success' as const,
  verified:     'success' as const,
};

export function StudyCard({ study, onViewReport, onViewImages, className = '' }: { study: RadiologyStudy; onViewReport?: () => void; onViewImages?: () => void; className?: string }) {
  const pb = priorityBadge[study.priority];
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden ${className}`}>
      <div className="flex items-start gap-3 p-4">
        {/* Modality badge */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${modalityColors[study.modality]}`}>
          {study.modality}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{study.studyDescription}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{study.bodyPart} · {study.orderedAt}</p>
            </div>
            <Badge variant={pb.variant}>{pb.label}</Badge>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <Badge variant={studyStatusVariant[study.status]}>{study.status.toUpperCase()}</Badge>
            {study.reportedBy && <span className="text-xs text-slate-500">Dr. {study.reportedBy}</span>}
          </div>

          {study.aiFindings && study.aiFindings.length > 0 && (
            <div className="mt-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 mb-1">🤖 AI Findings</div>
              {study.aiFindings.map((f, i) => <div key={i} className="text-xs text-indigo-600 dark:text-indigo-400">· {f}</div>)}
            </div>
          )}
        </div>
      </div>

      {(onViewReport || onViewImages) && (
        <div className="flex border-t border-slate-100 dark:border-slate-800">
          {onViewImages && (
            <button onClick={onViewImages} className="flex-1 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              🖼 View Images
            </button>
          )}
          {onViewReport && (
            <button onClick={onViewReport} className="flex-1 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border-l border-slate-100 dark:border-slate-800 transition-colors">
              📄 View Report
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── DICOM Thumbnail ───────────────────────────────────────────────────────────
export function DICOMThumbnail({ imageUrl, modality, studyDescription, onClick, className = '' }:
  { imageUrl?: string; modality: string; studyDescription: string; onClick?: () => void; className?: string }) {
  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-black border border-slate-700 shadow-lg cursor-pointer group ${className}`}
      onClick={onClick}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={studyDescription} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-32 flex flex-col items-center justify-center text-slate-600">
          <div className="text-3xl">🔬</div>
          <div className="text-xs mt-1">No preview</div>
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium bg-black/60 px-2 py-1 rounded">View</div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/80 to-transparent">
        <div className="text-xs text-white font-medium truncate">{studyDescription}</div>
        <div className="text-[10px] text-slate-400">{modality}</div>
      </div>
    </div>
  );
}

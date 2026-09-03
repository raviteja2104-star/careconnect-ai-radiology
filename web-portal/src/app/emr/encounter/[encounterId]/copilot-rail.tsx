'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowDownToLine, Bot, Loader2, User } from 'lucide-react';
import { Badge, Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import {
    formatWhen, patientDisplayName, ageOf,
    fetchAiHealth, postAiSoapDraft, postAiDischargeSummary, postAiExplain, postAiDifferentials,
    type EncounterRecord, type Patient360, type DiagnosisEntry, type VitalsEntry,
    type NoteFormat, type NoteSections,
} from '../../_lib/api';

interface CopilotRailProps {
    encounter: EncounterRecord;
    p360?: Patient360;
    vitals: VitalsEntry[];
    diagnoses: DiagnosisEntry[];
    noteFormat: NoteFormat;
    insertSections: (s: NoteSections) => void;
}

interface CopilotMessage {
    id: number;
    role: 'user' | 'assistant';
    text: string;
    /** When present, the explicit "Insert into note" button appends these sections. */
    sections?: NoteSections;
}

type ActionKey = 'summary' | 'soap' | 'labs' | 'differentials' | 'discharge';

const ACTIONS: { key: ActionKey; label: string }[] = [
    { key: 'summary', label: 'Summarize history' },
    { key: 'soap', label: 'Generate SOAP draft' },
    { key: 'labs', label: 'Explain abnormal labs' },
    { key: 'differentials', label: 'Suggest differentials' },
    { key: 'discharge', label: 'Draft discharge summary' },
];

export function CopilotRail({ encounter, p360, vitals, diagnoses, insertSections }: CopilotRailProps) {
    const [messages, setMessages] = React.useState<CopilotMessage[]>([
        {
            id: 0,
            role: 'assistant',
            text: 'I can assemble drafts from the data already loaded in this encounter — nothing leaves this device. Pick an action below; results are only added to the note when you press "Insert into note".',
        },
    ]);
    const nextId = React.useRef(1);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    // Real-AI availability: probed once on mount. null = probing, false = keep
    // the on-device deterministic drafting exactly as before.
    const [aiAvailable, setAiAvailable] = React.useState<boolean | null>(null);
    const [pending, setPending] = React.useState<ActionKey | null>(null);

    React.useEffect(() => {
        let active = true;
        fetchAiHealth().then((ok) => {
            if (!active) return;
            setAiAvailable(ok);
            if (ok) {
                setMessages((m) => (m.length === 1 && m[0].id === 0 ? [{
                    id: 0,
                    role: 'assistant',
                    text: 'Claude AI drafting is connected. Drafts are generated from this encounter\'s loaded data and always require your review — nothing is added to the note until you press "Insert into note".',
                }] : m));
            }
        });
        return () => { active = false; };
    }, []);

    React.useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, pending]);

    const push = (entries: Omit<CopilotMessage, 'id'>[]) => {
        setMessages((m) => [...m, ...entries.map((e) => ({ id: nextId.current++, ...e }))]);
    };

    const run = async (action: ActionKey, label: string) => {
        if (pending) return;
        const ctx = { encounter, p360, vitals, diagnoses };
        push([{ role: 'user', text: label }]);

        // "Summarize history" stays on-device (pure restructuring of loaded
        // data); the other actions use Claude when the service is available.
        if (!aiAvailable || action === 'summary') {
            push([{ role: 'assistant', ...draft(action, ctx) }]);
            return;
        }

        setPending(action);
        try {
            const result = await aiDraft(action, ctx);
            push([{ role: 'assistant', ...result }]);
        } catch {
            const fallback = draft(action, ctx);
            push([{
                role: 'assistant',
                text: `Claude AI didn't respond for this request — showing the on-device draft instead.\n\n${fallback.text}`,
                sections: fallback.sections,
            }]);
        } finally {
            setPending(null);
        }
    };

    return (
        <Card className="animate-fade-up xl:sticky xl:top-6">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-primary" aria-hidden /> AI Copilot
                </CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-1.5">
                    {aiAvailable ? (
                        <Badge tone="brand" className="text-[10px]">Claude AI — clinician review required</Badge>
                    ) : (
                        <Badge tone="outline" className="text-[10px]">
                            {aiAvailable === null ? 'Checking AI service…' : 'On-device drafting — AI service unavailable'}
                        </Badge>
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                {/* Conversation */}
                <div
                    ref={scrollRef}
                    className="max-h-[26rem] space-y-3 overflow-y-auto pr-1 scrollbar-thin"
                    role="log"
                    aria-label="Copilot conversation"
                    aria-live="polite"
                >
                    {messages.map((m) => (
                        <motion.div
                            key={m.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25 }}
                            className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}
                        >
                            {m.role === 'assistant' && (
                                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <Bot className="h-3.5 w-3.5" aria-hidden />
                                </span>
                            )}
                            <div
                                className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                                    m.role === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'border border-border bg-muted/50 text-foreground'
                                }`}
                            >
                                <p className="whitespace-pre-line">{m.text}</p>
                                {m.sections && (
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="mt-2"
                                        onClick={() => insertSections(m.sections!)}
                                    >
                                        <ArrowDownToLine className="h-3.5 w-3.5" aria-hidden /> Insert into note
                                    </Button>
                                )}
                            </div>
                            {m.role === 'user' && (
                                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                    <User className="h-3.5 w-3.5" aria-hidden />
                                </span>
                            )}
                        </motion.div>
                    ))}
                    {pending && (
                        <div className="flex gap-2">
                            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <Bot className="h-3.5 w-3.5 animate-pulse" aria-hidden />
                            </span>
                            <div className="max-w-[85%] rounded-2xl border border-border bg-muted/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                                <span className="inline-flex items-center gap-1.5">
                                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> Claude is drafting…
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action chips */}
                <div className="border-t border-border pt-3">
                    <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-subtle-foreground">Quick actions</h4>
                    <div className="flex flex-wrap gap-1.5">
                        {ACTIONS.map((a) => (
                            <button
                                key={a.key}
                                type="button"
                                disabled={pending != null}
                                onClick={() => run(a.key, a.label)}
                                className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {pending === a.key ? 'Drafting…' : a.label}
                            </button>
                        ))}
                    </div>
                    <p className="mt-3 text-[10px] leading-relaxed text-subtle-foreground">
                        {aiAvailable
                            ? 'Drafts are generated by Claude from this encounter’s loaded data and require clinician review.'
                            : 'Drafts are assembled deterministically from this encounter’s loaded data.'}{' '}
                        Content is never added to the clinical note without your explicit insert.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

/* ─────────────── Deterministic client-side drafting ─────────────── */

interface DraftContext {
    encounter: EncounterRecord;
    p360?: Patient360;
    vitals: VitalsEntry[];
    diagnoses: DiagnosisEntry[];
}

/* ────────────────── Claude AI drafting (when available) ────────────── */
/**
 * Builds the request payload from the loaded encounter data, calls the real
 * AI endpoints via the backend proxy, and maps the structured JSON back into
 * a chat message (+ note sections for the explicit insert button). Throws on
 * any failure — the caller falls back to the deterministic draft.
 */
async function aiDraft(action: ActionKey, ctx: DraftContext): Promise<{ text: string; sections?: NoteSections }> {
    const { encounter, p360, vitals, diagnoses } = ctx;
    const patient = p360?.patient;
    const cc = encounter.chiefComplaint || 'not recorded';
    const latestVitals = vitals[0] ?? null;
    const dxList = diagnoses.map((d) => `${d.term}${d.code ? ` (${d.code})` : ''}${d.isPrimary ? ' [primary]' : ''}`);
    const meds = (p360?.activeMedications || []).map((m) => [m.name, m.dose, m.frequency].filter(Boolean).join(' '));
    const history = {
        age: ageOf(patient?.dateOfBirth),
        gender: patient?.gender,
        allergies: patient?.allergies || [],
        chronicDiseases: patient?.chronicDiseases || [],
        activeMedications: meds,
        recentEvents: (p360?.timeline || []).slice(0, 10).map((e) => `${formatWhen(e.at)} — ${e.title}${e.status ? ` (${e.status})` : ''}`),
    };

    switch (action) {
        case 'soap': {
            const d = await postAiSoapDraft({ chiefComplaint: cc, vitals: latestVitals, diagnoses: dxList, history });
            return {
                text: `SOAP draft (Claude AI — review before inserting):\n\nS: ${d.subjective}\n\nO: ${d.objective}\n\nA:\n${d.assessment}\n\nP:\n${d.plan}`,
                sections: { subjective: d.subjective, objective: d.objective, assessment: d.assessment, plan: d.plan },
            };
        }
        case 'discharge': {
            const d = await postAiDischargeSummary({
                patient: { name: patientDisplayName(patient), age: ageOf(patient?.dateOfBirth), gender: patient?.gender },
                chiefComplaint: cc,
                vitals: latestVitals,
                diagnoses: dxList,
                medications: meds,
                allergies: patient?.allergies || [],
            });
            const text = [
                'Discharge summary draft (Claude AI — review before inserting):',
                d.summary,
                d.advice ? `Advice: ${d.advice}` : '',
                d.followUp ? `Follow-up: ${d.followUp}` : '',
            ].filter(Boolean).join('\n\n');
            return { text, sections: { plan: [d.summary, d.advice, d.followUp].filter(Boolean).join('\n\n') } };
        }
        case 'labs': {
            const labs = (p360?.timeline || [])
                .filter((e) => e.kind === 'lab' || e.kind === 'order:lab')
                .slice(0, 10)
                .map((l) => `${formatWhen(l.at)} — ${l.title}${l.status ? ` (${l.status})` : ''}`);
            if (!labs.length) return { text: 'No lab events found in the loaded record to explain.' };
            const d = await postAiExplain({ labs });
            const points = (d.keyPoints || []).map((k) => `• ${k}`).join('\n');
            return { text: `Lab explanation (Claude AI):\n\n${d.explanation}${points ? `\n\nKey points:\n${points}` : ''}` };
        }
        case 'differentials': {
            const d = await postAiDifferentials({
                presentation: { chiefComplaint: cc, vitals: latestVitals, ...history },
            });
            const list = d.differentials.map((x, i) =>
                `${i + 1}. ${x.condition}${x.likelihood ? ` — ${x.likelihood} likelihood` : ''}${x.reasoning ? `\n   ${x.reasoning}` : ''}`);
            const text = `Differentials for "${cc}" (Claude AI — decision support only):\n\n${list.join('\n')}${d.note ? `\n\n${d.note}` : ''}`;
            return {
                text,
                sections: { assessment: `Differentials considered (AI-assisted, clinician reviewed): ${d.differentials.map((x) => x.condition).join('; ')}.` },
            };
        }
        case 'summary':
        default:
            // Handled on-device by the caller; kept for exhaustiveness.
            return draft(action, ctx);
    }
}

function vitalsLine(v?: VitalsEntry): string {
    if (!v) return 'No vitals recorded this encounter.';
    const parts: string[] = [];
    if (v.systolicBp && v.diastolicBp) parts.push(`BP ${v.systolicBp}/${v.diastolicBp} mmHg`);
    if (v.pulse) parts.push(`HR ${v.pulse} bpm`);
    if (v.respiratoryRate) parts.push(`RR ${v.respiratoryRate}/min`);
    if (v.temperatureC) parts.push(`Temp ${v.temperatureC} °C`);
    if (v.spo2) parts.push(`SpO2 ${v.spo2}%`);
    if (v.weightKg) parts.push(`Wt ${v.weightKg} kg`);
    if (v.painScore != null) parts.push(`Pain ${v.painScore}/10`);
    return parts.length ? parts.join(', ') : 'No vitals recorded this encounter.';
}

function draft(action: ActionKey, ctx: DraftContext): { text: string; sections?: NoteSections } {
    const { encounter, p360, vitals, diagnoses } = ctx;
    const patient = p360?.patient;
    const name = patientDisplayName(patient);
    const age = ageOf(patient?.dateOfBirth);
    const demographics = `${name}, ${age != null ? `${age}-year-old` : 'age unknown'} ${patient?.gender || ''}`.trim();
    const cc = encounter.chiefComplaint || 'chief complaint not recorded';
    const dxList = diagnoses.map((d) => `${d.term}${d.code ? ` (${d.code})` : ''}${d.isPrimary ? ' [primary]' : ''}`);
    const meds = (p360?.activeMedications || []).map((m) => [m.name, m.dose, m.frequency].filter(Boolean).join(' '));
    const allergies = patient?.allergies || [];
    const latestVitals = vitals[0];

    switch (action) {
        case 'summary': {
            const events = (p360?.timeline || []).slice(0, 8).map((e) => `• ${formatWhen(e.at)} — ${e.title}${e.status ? ` (${e.status})` : ''}`);
            const text = [
                `History summary for ${demographics}:`,
                allergies.length ? `Allergies: ${allergies.join(', ')}.` : 'No known allergies.',
                dxList.length ? `Problem list: ${dxList.join('; ')}.` : 'No recorded diagnoses.',
                meds.length ? `Active medications: ${meds.join('; ')}.` : 'No active medications.',
                events.length ? `Recent events:\n${events.join('\n')}` : 'No recorded events.',
            ].join('\n\n');
            return {
                text,
                sections: {
                    pastMedicalHistory: [
                        dxList.length ? `Known conditions: ${dxList.join('; ')}.` : '',
                        meds.length ? `On: ${meds.join('; ')}.` : '',
                        allergies.length ? `Allergies: ${allergies.join(', ')}.` : '',
                    ].filter(Boolean).join(' '),
                },
            };
        }
        case 'soap': {
            const subjective = `${demographics} presenting with ${cc}`;
            const objective = `Vitals: ${vitalsLine(latestVitals)}${allergies.length ? ` Known allergies: ${allergies.join(', ')}.` : ''}`;
            const assessment = dxList.length
                ? dxList.map((d, i) => `${i + 1}. ${d}`).join('\n')
                : 'Assessment pending — no diagnoses recorded yet.';
            const plan = [
                meds.length ? `Continue current medications (${meds.join('; ')}).` : '',
                'Investigations and follow-up as per orders placed this encounter.',
            ].filter(Boolean).join('\n');
            return {
                text: `SOAP draft assembled from the loaded encounter data:\n\nS: ${subjective}\n\nO: ${objective}\n\nA:\n${assessment}\n\nP:\n${plan}`,
                sections: { subjective, objective, assessment, plan },
            };
        }
        case 'labs': {
            const labs = (p360?.timeline || []).filter((e) => e.kind === 'lab' || e.kind === 'order:lab');
            if (!labs.length) return { text: 'No lab events found in the loaded record to explain.' };
            const lines = labs.slice(0, 6).map((l) => {
                let note = '';
                if (/hba1c/i.test(l.title)) {
                    const m = l.title.match(/(\d+(?:\.\d+)?)\s*%/);
                    if (m) {
                        const v = parseFloat(m[1]);
                        note = v >= 6.5 ? ' — above the 6.5% diabetes threshold; suggests suboptimal glycaemic control.'
                            : v >= 5.7 ? ' — in the prediabetes range (5.7–6.4%).' : ' — within normal range.';
                    }
                }
                if (/ldl\s*(\d+)/i.test(l.title)) {
                    const v = parseInt(l.title.match(/ldl\s*(\d+)/i)![1], 10);
                    note = v >= 100 ? ` — LDL ${v} mg/dL is above the <100 mg/dL target for patients with cardiometabolic risk.` : '';
                }
                return `• ${formatWhen(l.at)} — ${l.title}${note}`;
            });
            return { text: `Lab findings in the loaded record:\n\n${lines.join('\n')}\n\nInterpretation is rule-based from the visible values only — full analyte-level review needs the lab report itself.` };
        }
        case 'differentials': {
            const lower = cc.toLowerCase();
            let list: string[];
            if (lower.includes('chest')) {
                list = ['Acute coronary syndrome (rule out first)', 'Stable angina', 'Gastro-oesophageal reflux', 'Musculoskeletal chest wall pain', 'Anxiety-related chest discomfort'];
            } else if (lower.includes('breath') || lower.includes('dyspnea')) {
                list = ['Congestive heart failure', 'Asthma / COPD exacerbation', 'Anaemia', 'Pulmonary embolism (assess risk factors)'];
            } else if (lower.includes('fever')) {
                list = ['Viral upper respiratory infection', 'Urinary tract infection', 'Dengue / malaria (seasonal, region-dependent)', 'Enteric fever'];
            } else {
                list = ['Insufficient structured symptoms for a keyword-based differential — document the chief complaint and HPI first.'];
            }
            const text = `Rule-based differentials for "${cc}":\n\n${list.map((d, i) => `${i + 1}. ${d}`).join('\n')}\n\nOrdered by typical pre-test probability; not a substitute for clinical judgement.`;
            return { text, sections: { assessment: `Differentials considered: ${list.join('; ')}.` } };
        }
        case 'discharge': {
            const text = [
                `Discharge / visit summary draft for ${demographics}:`,
                `Presented with ${cc}.`,
                `Examination: ${vitalsLine(latestVitals)}`,
                dxList.length ? `Diagnoses this visit: ${dxList.join('; ')}.` : 'No diagnoses recorded this visit.',
                meds.length ? `Medications on discharge: ${meds.join('; ')}.` : 'No active medications recorded.',
                'Advice: continue prescribed medications, complete ordered investigations, and return earlier if symptoms worsen (severe chest pain, breathlessness at rest, syncope).',
            ].join('\n\n');
            return { text, sections: { plan: text } };
        }
    }
}

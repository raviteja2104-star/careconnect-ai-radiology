'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Type, AlignLeft, CheckSquare, CircleDot,
  Calendar, FileSignature, Save, Eye, Send,
  Plus, GripVertical, Sparkles, SlidersHorizontal, Loader2,
} from 'lucide-react';
import {
  PageHeader, Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge, Button, Input, Label, useToast,
} from '@/components/ui';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';
function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

const STANDARD_FIELDS = [
  { icon: Type, label: 'Short Text', type: 'text' },
  { icon: AlignLeft, label: 'Paragraph', type: 'paragraph' },
  { icon: CheckSquare, label: 'Checkbox', type: 'checkbox' },
  { icon: CircleDot, label: 'Radio', type: 'radio' },
  { icon: Calendar, label: 'Date', type: 'date' },
];

type FormField = { id: string; type: string; label: string; required: boolean };
type Template = { _id: string; name: string; description?: string; status: string; version: number; fields: FormField[] };

const DEFAULT_FIELDS: FormField[] = [
  { id: '1', type: 'text',      label: 'Patient Full Name',  required: true },
  { id: '2', type: 'date',      label: 'Date of Birth',      required: true },
  { id: '3', type: 'signature', label: 'Patient Signature',  required: true },
];

export default function FormBuilder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [templateId, setTemplateId]   = useState<string | null>(null);
  const [templateName, setTemplateName] = useState('General Surgery Consent');
  const [status, setStatus]           = useState<'draft' | 'published'>('draft');
  const [version, setVersion]         = useState(1);
  const [formFields, setFormFields]   = useState<FormField[]>(DEFAULT_FIELDS);
  const [selectedId, setSelectedId]   = useState<string | null>('3');

  // Load most recent draft template on mount
  const { data: templatesData } = useQuery({
    queryKey: ['form-templates'],
    queryFn: () => fetch(`${API}/api/admin/form-templates`, { headers: authHeaders() }).then(r => r.json()),
    staleTime: 30_000,
  });

  useEffect(() => {
    const list: Template[] = templatesData?.data ?? [];
    const draft = list.find(t => t.status === 'draft') ?? list[0];
    if (draft) {
      setTemplateId(draft._id);
      setTemplateName(draft.name);
      setStatus(draft.status as 'draft' | 'published');
      setVersion(draft.version);
      setFormFields(draft.fields.length > 0 ? draft.fields : DEFAULT_FIELDS);
    }
  }, [templatesData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = { name: templateName, fields: formFields };
      if (templateId) {
        const res = await fetch(`${API}/api/admin/form-templates/${templateId}`, {
          method: 'PATCH', headers: authHeaders(), body: JSON.stringify(body),
        });
        return res.json();
      }
      const res = await fetch(`${API}/api/admin/form-templates`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(body),
      });
      return res.json();
    },
    onSuccess: (json) => {
      if (json.success) {
        setTemplateId(json.data._id);
        setStatus(json.data.status);
        setVersion(json.data.version);
        queryClient.invalidateQueries({ queryKey: ['form-templates'] });
        toast('success', 'Saved', 'Template saved as draft.');
      } else {
        toast('error', 'Save failed', json.error ?? 'Unknown error');
      }
    },
    onError: () => toast('error', 'Save failed', 'Network error. Please try again.'),
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!templateId) {
        // Save first, then publish
        const saveRes = await fetch(`${API}/api/admin/form-templates`, {
          method: 'POST', headers: authHeaders(),
          body: JSON.stringify({ name: templateName, fields: formFields }),
        });
        const saveJson = await saveRes.json();
        if (!saveJson.success) throw new Error(saveJson.error ?? 'Save failed');
        setTemplateId(saveJson.data._id);
        const pubRes = await fetch(`${API}/api/admin/form-templates/${saveJson.data._id}/publish`, {
          method: 'PATCH', headers: authHeaders(),
        });
        return pubRes.json();
      }
      const res = await fetch(`${API}/api/admin/form-templates/${templateId}/publish`, {
        method: 'PATCH', headers: authHeaders(),
      });
      return res.json();
    },
    onSuccess: (json) => {
      if (json.success) {
        setStatus('published');
        setVersion(json.data.version);
        queryClient.invalidateQueries({ queryKey: ['form-templates'] });
        toast('success', 'Published', `Template published as v${json.data.version}.`);
      } else {
        toast('error', 'Publish failed', json.error ?? 'Unknown error');
      }
    },
    onError: () => toast('error', 'Publish failed', 'Network error. Please try again.'),
  });

  const handleAddField = (type: string, label: string) => {
    const newField: FormField = { id: `f-${Date.now()}`, type, label: `New ${label} Field`, required: false };
    setFormFields(prev => [...prev, newField]);
    setSelectedId(newField.id);
  };

  const selectedField = formFields.find(f => f.id === selectedId) ?? null;

  const updateSelectedField = (patch: Partial<FormField>) => {
    setFormFields(prev => prev.map(f => f.id === selectedId ? { ...f, ...patch } : f));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={templateName}
        description={
          <span className="inline-flex items-center gap-2">
            eForm template builder
            <Badge tone={status === 'published' ? 'success' : 'warning'} dot>{status === 'published' ? 'Published' : 'Draft'}</Badge>
            <Badge tone="outline">v{version}</Badge>
          </span>
        }
        crumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Forms' }, { label: 'Builder' }]}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => window.open(`/admin/forms/preview?id=${templateId ?? ''}`, '_blank')}
              disabled={!templateId}
            >
              <Eye className="h-4 w-4" aria-hidden /> Preview
            </Button>
            <Button
              variant="outline"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" aria-hidden />}
              Save Draft
            </Button>
            <Button
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending || status === 'published'}
            >
              {publishMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" aria-hidden />}
              {status === 'published' ? 'Published' : 'Publish Template'}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[17rem_minmax(0,1fr)_19rem]">

        {/* Left Toolbar */}
        <Card className="xl:sticky xl:top-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Field Palette</CardTitle>
            <CardDescription>Click to add to the canvas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">Standard Fields</h3>
              <div className="grid grid-cols-2 gap-2">
                {STANDARD_FIELDS.map((f) => (
                  <button
                    key={f.label}
                    onClick={() => handleAddField(f.type, f.label)}
                    className="group flex flex-col items-center justify-center rounded-xl border border-border bg-muted/40 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <f.icon className="mb-2 h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden />
                    <span className="text-xs font-medium text-foreground">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">Specialized Fields</h3>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleAddField('signature', 'e-Signature')} className="group flex flex-col items-center justify-center rounded-xl border border-primary/30 bg-primary/5 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <FileSignature className="mb-2 h-5 w-5 text-primary" aria-hidden />
                  <span className="text-xs font-semibold text-primary">e-Signature</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Center Canvas */}
        <div className="min-w-0">
          <div className="mx-auto max-w-3xl">
            {/* Header Document Area */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mb-px space-y-4 rounded-t-2xl border border-border bg-card p-10 text-center shadow-soft"
            >
              <h2 className="text-2xl font-extrabold uppercase tracking-widest text-foreground">{templateName}</h2>
              <p className="mx-auto max-w-xl text-sm text-muted-foreground">
                By signing this document, the patient acknowledges that the procedure, its risks, alternatives, and expected outcomes have been fully explained by the attending physician.
              </p>
            </motion.div>

            {/* Fields List */}
            <div className="min-h-[500px] space-y-4 rounded-b-2xl border border-border bg-card p-4 shadow-soft">
              {formFields.map((field, idx) => (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.1 + idx * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => setSelectedId(field.id)}
                  className={`group flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all ${
                    selectedId === field.id
                      ? 'border-primary/40 bg-primary/5 shadow-soft'
                      : 'border-transparent hover:border-border hover:bg-muted/40'
                  }`}
                >
                  <div className="mt-2 text-subtle-foreground transition-colors group-hover:text-muted-foreground">
                    <GripVertical className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="flex-1">
                    <label className="mb-2 block text-sm font-semibold text-foreground">
                      {field.label} {field.required && <span className="text-danger" aria-hidden>*</span>}
                    </label>
                    {field.type === 'text' && (
                      <input type="text" disabled className="w-full rounded-lg border border-input bg-muted px-4 py-2 text-sm text-muted-foreground opacity-70" placeholder="Short text input..." />
                    )}
                    {field.type === 'paragraph' && (
                      <textarea disabled rows={3} className="w-full rounded-lg border border-input bg-muted px-4 py-2 text-sm text-muted-foreground opacity-70" placeholder="Long answer text..." />
                    )}
                    {field.type === 'checkbox' && (
                      <label className="flex items-center gap-2 text-sm text-muted-foreground opacity-70">
                        <input type="checkbox" disabled className="h-4 w-4 rounded border-input" /> Option 1
                      </label>
                    )}
                    {field.type === 'radio' && (
                      <div className="space-y-1.5 text-sm text-muted-foreground opacity-70">
                        <label className="flex items-center gap-2"><input type="radio" disabled className="h-4 w-4 border-input" /> Option 1</label>
                        <label className="flex items-center gap-2"><input type="radio" disabled className="h-4 w-4 border-input" /> Option 2</label>
                      </div>
                    )}
                    {field.type === 'date' && (
                      <input type="date" disabled className="w-full rounded-lg border border-input bg-muted px-4 py-2 text-sm text-muted-foreground opacity-70" />
                    )}
                    {field.type === 'signature' && (
                      <div className="flex h-32 w-full items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-primary/5">
                        <div className="text-center">
                          <FileSignature className="mx-auto mb-2 h-8 w-8 text-primary opacity-50" aria-hidden />
                          <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">Digital Signature Area</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              <div className="p-4">
                <Button variant="outline" className="w-full border-dashed" onClick={() => handleAddField('text', 'Short Text')}>
                  <Plus className="h-5 w-5" aria-hidden /> Add Field
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right - Properties Panel */}
        <Card className="xl:sticky xl:top-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" aria-hidden />
              {selectedField ? 'Field Properties' : 'Form Properties'}
            </CardTitle>
            <CardDescription>{selectedField ? 'Editing the selected field.' : 'Set the form name and settings.'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {selectedField ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="fb-field-label">Field label</Label>
                  <Input
                    id="fb-field-label"
                    type="text"
                    value={selectedField.label}
                    onChange={e => updateSelectedField({ label: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Validation</Label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-muted/40 p-3 transition-colors hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={selectedField.required}
                      onChange={e => updateSelectedField({ required: e.target.checked })}
                      className="h-4 w-4 rounded border-input accent-[var(--primary)]"
                    />
                    <span className="text-sm font-medium text-foreground">Required Field</span>
                  </label>
                </div>
                <div className="border-t border-border pt-5">
                  <Label className="mb-2 block">AI Integrations</Label>
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <p className="mb-3 flex items-start gap-1.5 text-xs font-medium text-foreground">
                      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                      Enable AI to explain this field to patients via voice or chat.
                    </p>
                    <Button size="sm" className="w-full" disabled title="Coming soon">Configure AI Explanation</Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="fb-form-name">Form name</Label>
                <Input
                  id="fb-form-name"
                  type="text"
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  placeholder="e.g. Surgical Consent Form"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

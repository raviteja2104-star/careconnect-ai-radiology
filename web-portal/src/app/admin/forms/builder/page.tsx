'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Type, AlignLeft, CheckSquare, CircleDot,
  Calendar, FileSignature, Save, Eye,
  Plus, GripVertical, Sparkles, SlidersHorizontal,
} from 'lucide-react';
import {
  PageHeader, Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge, Button, Input, Label,
} from '@/components/ui';

const STANDARD_FIELDS = [
  { icon: Type, label: 'Short Text', type: 'text' },
  { icon: AlignLeft, label: 'Paragraph', type: 'paragraph' },
  { icon: CheckSquare, label: 'Checkbox', type: 'checkbox' },
  { icon: CircleDot, label: 'Radio', type: 'radio' },
  { icon: Calendar, label: 'Date', type: 'date' },
];

export default function FormBuilder() {
  const [formFields, setFormFields] = useState([
    { id: '1', type: 'text', label: 'Patient Full Name', required: true },
    { id: '2', type: 'date', label: 'Date of Birth', required: true },
    { id: '3', type: 'signature', label: 'Patient Signature', required: true }
  ]);

  const handleAddField = (type: string, label: string) => {
    setFormFields((prev) => [
      ...prev,
      { id: `f-${Date.now()}`, type, label: `New ${label} Field`, required: false },
    ]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="General Surgery Consent"
        description={
          <span className="inline-flex items-center gap-2">
            eForm template builder
            <Badge tone="warning" dot>Draft</Badge>
            <Badge tone="outline">v1.2</Badge>
          </span>
        }
        crumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Forms' }, { label: 'Builder' }]}
        actions={
          <>
            <Button variant="secondary" disabled title="Coming soon">
              <Eye className="h-4 w-4" aria-hidden /> Preview
            </Button>
            <Button disabled title="Coming soon">
              <Save className="h-4 w-4" aria-hidden /> Publish Template
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[17rem_minmax(0,1fr)_19rem]">

        {/* Left Toolbar - Components */}
        <Card className="xl:sticky xl:top-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Field Palette</CardTitle>
            <CardDescription>Drag or click to add to the canvas.</CardDescription>
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
              <h2 className="text-2xl font-extrabold uppercase tracking-widest text-foreground">Consent for Surgical Procedure</h2>
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
                  className="group flex cursor-move items-start gap-4 rounded-xl border border-transparent p-4 transition-all hover:border-border hover:bg-muted/40"
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
              Field Properties
            </CardTitle>
            <CardDescription>Editing the selected field.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="fb-field-label">Field label</Label>
              <Input id="fb-field-label" type="text" defaultValue="Patient Signature" />
            </div>

            <div className="space-y-1.5">
              <Label>Validation</Label>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-muted/40 p-3 transition-colors hover:bg-muted">
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-input accent-[var(--primary)]" />
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

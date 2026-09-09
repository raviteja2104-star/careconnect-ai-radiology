'use client';
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import { Button, Input, Select, Badge } from '@/components/ui';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  specialty: string;
  department: string;
  hospital: string;
  qualification: string;
  experienceYears: string;
  consultationFee: string;
  medicalRegNumber: string;
  consultationType: string;
  room: string;
  status: string;
  createLogin: boolean;
  password: string;
};

const INITIAL: FormState = {
  firstName: '', lastName: '', email: '', phone: '',
  gender: '', dateOfBirth: '', specialty: '', department: '',
  hospital: 'CareConnect Main Hospital', qualification: '',
  experienceYears: '0', consultationFee: '0', medicalRegNumber: '',
  consultationType: 'In-Person', room: '', status: 'active',
  createLogin: false, password: '',
};

const SPECIALTIES = [
  'General Medicine', 'Cardiology', 'Neurology', 'Orthopedics',
  'Pediatrics', 'Ophthalmology', 'Dermatology', 'Gastroenterology',
  'Oncology', 'Psychiatry', 'Radiology', 'Urology', 'ENT', 'Gynecology',
];

const DEPARTMENTS = [
  'OPD', 'IPD', 'Emergency', 'ICU', 'Surgery', 'Radiology', 'Laboratory',
  'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Gynecology',
];

export function AddDoctorModal({ onClose, onCreated }: { onClose: () => void; onCreated?: () => void }) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const set = (field: keyof FormState, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const createMutation = useMutation({
    mutationFn: async (payload: FormState) => {
      const res = await fetch(`${API}/api/admin/doctors`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          ...payload,
          experienceYears: Number(payload.experienceYears),
          consultationFee: Number(payload.consultationFee),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to create doctor');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_doctors'] });
      onCreated?.();
      onClose();
    },
    onError: (err: Error) => setError(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('First and last name are required.');
      return;
    }
    if (!form.specialty) {
      setError('Specialty is required.');
      return;
    }
    if (form.createLogin && !form.password) {
      setError('Password is required when creating a login account.');
      return;
    }
    createMutation.mutate(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-float">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Add New Doctor</h2>
              <p className="text-xs text-muted-foreground">Create doctor profile and schedule</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-6">
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Personal Info */}
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Personal Information</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">First Name *</label>
                  <Input value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="First name" className="h-9" required />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">Last Name *</label>
                  <Input value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Last name" className="h-9" required />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">Email</label>
                  <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="doctor@hospital.com" className="h-9" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">Phone</label>
                  <Input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 9000000000" className="h-9" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">Gender</label>
                  <Select value={form.gender} onChange={e => set('gender', e.target.value)} className="h-9 text-sm">
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">Date of Birth</label>
                  <Input type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} className="h-9" />
                </div>
              </div>
            </section>

            {/* Professional Info */}
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Professional Information</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">Specialization *</label>
                  <Select value={form.specialty} onChange={e => set('specialty', e.target.value)} className="h-9 text-sm" required>
                    <option value="">Select specialty</option>
                    {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">Department</label>
                  <Select value={form.department} onChange={e => set('department', e.target.value)} className="h-9 text-sm">
                    <option value="">Select department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">Medical Reg. No.</label>
                  <Input value={form.medicalRegNumber} onChange={e => set('medicalRegNumber', e.target.value)} placeholder="MCI-12345" className="h-9" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">Qualification</label>
                  <Input value={form.qualification} onChange={e => set('qualification', e.target.value)} placeholder="MBBS, MD" className="h-9" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">Experience (years)</label>
                  <Input type="number" min="0" value={form.experienceYears} onChange={e => set('experienceYears', e.target.value)} className="h-9" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">Consultation Fee (₹)</label>
                  <Input type="number" min="0" value={form.consultationFee} onChange={e => set('consultationFee', e.target.value)} className="h-9" />
                </div>
              </div>
            </section>

            {/* Hospital / Room */}
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assignment</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">Hospital</label>
                  <Select value={form.hospital} onChange={e => set('hospital', e.target.value)} className="h-9 text-sm">
                    <option value="CareConnect Main Hospital">Main Campus</option>
                    <option value="CareConnect North">North Branch</option>
                    <option value="CareConnect South">South Branch</option>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">Room / Cabin</label>
                  <Input value={form.room} onChange={e => set('room', e.target.value)} placeholder="Room 204-A" className="h-9" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">Consultation Type</label>
                  <Select value={form.consultationType} onChange={e => set('consultationType', e.target.value)} className="h-9 text-sm">
                    <option value="In-Person">In-Person Only</option>
                    <option value="Telemedicine">Telemedicine Only</option>
                    <option value="Both">Both</option>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">Status</label>
                  <Select value={form.status} onChange={e => set('status', e.target.value)} className="h-9 text-sm">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </div>
              </div>
            </section>

            {/* Login Account */}
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Portal Access</h3>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.createLogin}
                  onChange={e => set('createLogin', e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <span className="text-sm text-foreground">Create login account for doctor portal</span>
              </label>
              {form.createLogin && (
                <div className="mt-3">
                  <label className="mb-1 block text-xs font-medium text-foreground">Password *</label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="h-9"
                    minLength={6}
                  />
                </div>
              )}
            </section>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/30 px-6 py-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating…' : 'Create Doctor'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

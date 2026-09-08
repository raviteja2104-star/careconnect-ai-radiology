'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  Users, UserPlus, HeartPulse, ShieldCheck, CalendarClock, Phone,
  Droplets, FileText, MoreHorizontal, Link2, Loader2,
} from 'lucide-react';
import {
  PageHeader,
  StatCard,
  StatGrid,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  Dropdown,
  DropdownItem,
  DropdownSeparator,
  Input,
  Label,
  Select,
  EmptyState,
  Skeleton,
  useToast,
} from '@/components/ui';

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'}/api`;

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

interface ApiFamilyMember {
  _id: string;
  name: string;
  relationship: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  phone?: string;
}

interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  age: number | null;
  bloodGroup: string;
  phone: string;
}

function computeAge(dob?: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function toUiFamilyMember(m: ApiFamilyMember): FamilyMember {
  return {
    id: m._id,
    name: m.name,
    relation: m.relationship,
    age: computeAge(m.dateOfBirth),
    bloodGroup: m.bloodGroup || '—',
    phone: m.phone || '—',
  };
}

interface AddMemberForm {
  name: string;
  relationship: string;
  dateOfBirth: string;
  bloodGroup: string;
  phone: string;
}

const INITIAL_FORM: AddMemberForm = { name: '', relationship: '', dateOfBirth: '', bloodGroup: '', phone: '' };

const RELATIONSHIP_OPTIONS = [
  'Self', 'Spouse', 'Son', 'Daughter', 'Father', 'Mother',
  'Brother', 'Sister', 'Grandfather', 'Grandmother', 'Other',
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function FamilyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast: showToast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState<AddMemberForm>(INITIAL_FORM);

  const { data: apiMembers = [], isLoading } = useQuery<ApiFamilyMember[]>({
    queryKey: ['family-members'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/patient/family`, { headers: authHeaders() });
      if (!res.ok) return [];
      const json = await res.json();
      return json.success ? json.data : [];
    },
  });

  const members: FamilyMember[] = apiMembers.map(toUiFamilyMember);

  const addMutation = useMutation({
    mutationFn: async (body: AddMemberForm) => {
      const res = await fetch(`${API_BASE}/patient/family`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to add member');
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      setShowAddModal(false);
      setForm(INITIAL_FORM);
      showToast('success', 'Family member added', 'The member has been added to your family profile.');
    },
    onError: (err: Error) => {
      showToast('error', 'Error', err.message);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.relationship.trim()) return;
    addMutation.mutate(form);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Family Health"
        description="Manage health profiles, records and care access for your family members."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Family' }]}
        actions={
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            <UserPlus className="h-4 w-4" aria-hidden /> Add Member
          </Button>
        }
      />

      <StatGrid>
        <StatCard label="Family Members" value={isLoading ? '—' : members.length} icon={Users} tone="brand" delay={0} sub="Profiles under your care" />
        <StatCard label="ABHA Linked" value="—" icon={ShieldCheck} tone="emerald" delay={0.05} sub="Health IDs connected" />
        <StatCard label="Tracked Conditions" value="—" icon={HeartPulse} tone="rose" delay={0.1} sub="Across all members" />
        <StatCard label="Upcoming Visits" value="—" icon={CalendarClock} tone="amber" delay={0.15} sub="Scheduled appointments" />
      </StatGrid>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[0, 1].map(i => <Skeleton key={i} className="h-52 rounded-2xl" />)}
        </div>
      ) : members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No family members yet"
          description="Add your first family member to start managing their health records."
          action={{ label: 'Add Member', onClick: () => setShowAddModal(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {members.map((member, i) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card variant="interactive" className="h-full">
                <CardContent className="flex h-full flex-col gap-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <Avatar name={member.name} size="xl" />
                      <div>
                        <h3 className="text-lg font-bold leading-tight text-foreground">{member.name}</h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {member.relation}{member.age != null ? ` · ${member.age} yrs` : ''}
                        </p>
                      </div>
                    </div>
                    <Dropdown
                      trigger={
                        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${member.name}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      }
                    >
                      <DropdownItem onClick={() => router.push('/health-records')}>View Records</DropdownItem>
                      <DropdownItem onClick={() => router.push('/appointments/book')}>Book Appointment</DropdownItem>
                      <DropdownSeparator />
                      <DropdownItem onClick={() => router.push('/settings')}>Manage Access</DropdownItem>
                    </Dropdown>
                  </div>

                  <div className="grid grid-cols-2 gap-3 rounded-2xl bg-muted/50 p-4 text-sm sm:grid-cols-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Droplets className="h-4 w-4 text-danger" aria-hidden />
                      <span className="font-semibold text-foreground">{member.bloodGroup}</span>
                    </div>
                    <div className="col-span-2 flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" aria-hidden />
                      <span className="tabular-nums">{member.phone}</span>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-end gap-3 border-t border-border pt-4">
                    <Button variant="outline" size="sm" onClick={() => router.push('/health-records')}>
                      <FileText className="h-4 w-4" aria-hidden /> Records
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog
        open={showAddModal}
        onClose={() => { setShowAddModal(false); setForm(INITIAL_FORM); }}
        title="Add Family Member"
        description="Fill in the details to add a new member to your family health profile."
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => { setShowAddModal(false); setForm(INITIAL_FORM); }}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={addMutation.isPending || !form.name.trim() || !form.relationship.trim()}>
              {addMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : 'Add Member'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fm-name">Full Name <span className="text-danger">*</span></Label>
            <Input
              id="fm-name"
              placeholder="e.g. Sunita Prasad"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fm-relationship">Relationship <span className="text-danger">*</span></Label>
            <Select
              id="fm-relationship"
              value={form.relationship}
              onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))}
              required
            >
              <option value="">Select relationship</option>
              {RELATIONSHIP_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fm-dob">Date of Birth</Label>
              <Input
                id="fm-dob"
                type="date"
                value={form.dateOfBirth}
                onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fm-blood">Blood Group</Label>
              <Select
                id="fm-blood"
                value={form.bloodGroup}
                onChange={e => setForm(f => ({ ...f, bloodGroup: e.target.value }))}
              >
                <option value="">Select</option>
                {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fm-phone">Phone</Label>
            <Input
              id="fm-phone"
              type="tel"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            />
          </div>
        </form>
      </Dialog>
    </div>
  );
}

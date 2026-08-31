'use client';
import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { User, Phone, Stethoscope, CheckCircle, IndianRupee, Ticket, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  PageHeader, Card, CardHeader, CardTitle, CardDescription, CardContent,
  Button, Input, Select, Label, FieldHint, Badge,
} from '@/components/ui';

function SectionHeading({ step, icon: Icon, title, description }: {
  step: number;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-subtle-foreground">Step {step}</p>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export default function WalkInRegistration() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    patientName: '',
    phone: '',
    department: 'Cardiology',
    doctorId: '',
    priorityReason: 'Normal'
  });

  const { data: doctorsRes } = useQuery({
    queryKey: ['doctors', formData.department],
    queryFn: () => fetch(`http://localhost:5000/api/appointments/doctors?specialty=${formData.department}`).then(res => res.json())
  });

  const doctors = doctorsRes?.data || [];

  const registerMutation = useMutation({
    mutationFn: (data: any) =>
      fetch('http://localhost:5000/api/reception/walkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => res.json()),
    onSuccess: (res) => {
      // In a real app, open print modal for the token
      alert(`Token Generated: ${res.data.tokenNumber}`);
      router.push('/reception/dashboard');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Walk-in Registration"
        description="Register an unscheduled patient and assign them to a live queue."
        crumbs={[{ label: 'Reception', href: '/reception/dashboard' }, { label: 'Walk-in' }]}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="xl:col-span-2"
        >
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Step 1 — Patient details */}
                <section className="space-y-5">
                  <SectionHeading
                    step={1}
                    icon={User}
                    title="Patient Details"
                    description="Who is being registered today?"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="walkin-name">Full name</Label>
                      <Input
                        id="walkin-name"
                        type="text"
                        required
                        value={formData.patientName}
                        onChange={e => setFormData({ ...formData, patientName: e.target.value })}
                        placeholder="e.g. John Doe"
                      />
                      <FieldHint>As it should appear on the token and receipt.</FieldHint>
                    </div>
                    <div>
                      <Label htmlFor="walkin-phone">Mobile number</Label>
                      <Input
                        id="walkin-phone"
                        type="tel"
                        required
                        icon={<Phone aria-hidden />}
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="10-digit number"
                      />
                      <FieldHint>Used to link an existing UHID if one exists.</FieldHint>
                    </div>
                  </div>
                </section>

                <div className="h-px w-full bg-border" role="separator" />

                {/* Step 2 — Clinical routing */}
                <section className="space-y-5">
                  <SectionHeading
                    step={2}
                    icon={Stethoscope}
                    title="Clinical Routing"
                    description="Route the patient to the right department and doctor."
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <Label htmlFor="walkin-dept">Department</Label>
                      <Select
                        id="walkin-dept"
                        value={formData.department}
                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                      >
                        <option value="Cardiology">Cardiology</option>
                        <option value="Neurology">Neurology</option>
                        <option value="Orthopedics">Orthopedics</option>
                        <option value="Pediatrics">Pediatrics</option>
                        <option value="General Medicine">General Medicine</option>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="walkin-doctor">Doctor assignment</Label>
                      <Select
                        id="walkin-doctor"
                        value={formData.doctorId}
                        onChange={e => setFormData({ ...formData, doctorId: e.target.value })}
                      >
                        <option value="">Auto-Assign (Any Available)</option>
                        {doctors.map((doc: any) => (
                          <option key={doc._id} value={doc._id}>{doc.name}</option>
                        ))}
                      </Select>
                      <FieldHint>Leave on auto-assign for the shortest wait.</FieldHint>
                    </div>

                    <div>
                      <Label htmlFor="walkin-priority">Priority / type</Label>
                      <Select
                        id="walkin-priority"
                        value={formData.priorityReason}
                        onChange={e => setFormData({ ...formData, priorityReason: e.target.value })}
                      >
                        <option value="Normal">Normal Walk-in</option>
                        <option value="Emergency">Emergency / Critical</option>
                        <option value="Senior Citizen">Senior Citizen</option>
                        <option value="VIP">VIP</option>
                      </Select>
                    </div>
                  </div>
                  {formData.priorityReason === 'Emergency' && (
                    <div className="flex items-center gap-2 rounded-xl bg-danger-soft px-3.5 py-2.5 text-xs font-medium text-danger">
                      <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden />
                      Emergency patients jump the queue and the triage desk is notified immediately.
                    </div>
                  )}
                </section>

                {/* Submit */}
                <div className="flex flex-col-reverse items-stretch gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-end">
                  <Button
                    type="submit"
                    size="lg"
                    loading={registerMutation.isPending}
                  >
                    {!registerMutation.isPending && <CheckCircle className="h-5 w-5" aria-hidden />}
                    Collect ₹500 & Generate Token
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Context rail */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-6"
        >
          <Card variant="gradient">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-primary" aria-hidden /> Consultation Fee
              </CardTitle>
              <CardDescription>Collected at the desk before a token is issued.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums">₹500</p>
              <p className="mt-1 text-xs text-muted-foreground">Standard OPD walk-in consultation, inclusive of registration.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-primary" aria-hidden /> What happens next
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2.5">
                <Badge tone="brand" className="mt-0.5">1</Badge>
                <p>A queue token is generated and printed for the patient.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <Badge tone="brand" className="mt-0.5">2</Badge>
                <p>The patient appears on the live OPD display board.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <Badge tone="brand" className="mt-0.5">3</Badge>
                <p>The assigned doctor calls the token from their console.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

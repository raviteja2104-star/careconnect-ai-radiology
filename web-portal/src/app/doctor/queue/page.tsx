'use client';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users, Clock, ArrowRight, Play, CheckCircle, Microscope,
  Pill, FileText, Banknote, MapPin, Timer,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  PageHeader, StatCard, StatGrid, Badge, Button, Avatar,
  Card, CardHeader, CardTitle, CardContent, Dialog,
  EmptyState, Skeleton, SkeletonCard, Textarea, Label,
} from '@/components/ui';

export default function DoctorQueueWorkspace() {
  const queryClient = useQueryClient();
  const department = 'OPD'; // Hardcoded for demo
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTarget, setTransferTarget] = useState('Laboratory');

  const { data: queueData, isLoading } = useQuery({
    queryKey: ['queue', department],
    queryFn: () => fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'}/api/queue/${department}`).then(res => res.json())
  });

  const callMutation = useMutation({
    mutationFn: (tokenId: string) =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'}/api/queue/call/${tokenId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: 'OPD-1' })
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue', department] });
    }
  });


  const completeMutation = useMutation({
    mutationFn: (tokenId: string) =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'}/api/queue/call/${tokenId}`, { // Assuming complete endpoint would be here, mocking for now
        method: 'POST'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue', department] });
    }
  });

  const transferMutation = useMutation({
    mutationFn: (data: any) =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'}/api/transfers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => res.json()),
    onSuccess: () => {
      setShowTransferModal(false);
      queryClient.invalidateQueries({ queryKey: ['queue', department] });
      alert('Patient Transferred successfully. Token generated for destination.');
    }
  });

  const tokens = queueData?.data || [];
  const waitingTokens = tokens.filter((t: any) => t.status === 'WAITING');
  const activeToken = tokens.find((t: any) => t.status === 'CALLED' || t.status === 'IN_PROGRESS');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doctor Workspace"
        description="Live queue and token management"
        crumbs={[{ label: 'Doctor', href: '/dashboard' }, { label: 'Live Queue' }]}
      />

      <StatGrid className="sm:grid-cols-2 xl:grid-cols-2">
        <StatCard
          label="Waiting"
          value={isLoading ? '—' : waitingTokens.length}
          sub={`${department} department`}
          icon={Users}
          tone="brand"
        />
        <StatCard
          label="Avg Wait"
          value="12m"
          sub="Rolling average today"
          icon={Timer}
          tone="violet"
          delay={0.05}
        />
      </StatGrid>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* Active Patient Panel */}
        <div className="space-y-4 xl:col-span-2">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Play className="h-5 w-5 text-primary" aria-hidden /> Current Patient
          </h2>

          {isLoading ? (
            <SkeletonCard />
          ) : activeToken ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="rounded-3xl p-8">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <Avatar name={activeToken.patientName} size="lg" status="online" />
                    <div>
                      <Badge tone="success" dot pulse className="mb-2">In Consultation</Badge>
                      <h3 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{activeToken.patientName}</h3>
                      <p className="mt-1 font-mono text-lg text-muted-foreground">Token: {activeToken.tokenNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time Elapsed</p>
                    <p className="font-mono text-3xl font-bold tabular-nums text-foreground">04:22</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row">
                  <Button
                    size="lg"
                    className="flex-1"
                    onClick={() => {
                      // Complete logic here
                      queryClient.invalidateQueries({ queryKey: ['queue', department] });
                    }}
                  >
                    <CheckCircle className="h-5 w-5" aria-hidden /> Complete Consultation
                  </Button>
                  <Button size="lg" variant="secondary" onClick={() => setShowTransferModal(true)}>
                    <ArrowRight className="h-5 w-5" aria-hidden /> Transfer Patient
                  </Button>
                </div>
              </Card>
            </motion.div>
          ) : (
            <EmptyState
              icon={Users}
              title="No Active Patient"
              description="Call the next patient from the queue when you are ready."
              className="rounded-3xl py-16"
              action={waitingTokens.length > 0 ? {
                label: callMutation.isPending ? 'Calling…' : 'Call Next Patient',
                onClick: () => callMutation.mutate(waitingTokens[0]._id),
              } : undefined}
            />
          )}
        </div>

        {/* Up Next Panel */}
        <div className="space-y-4 xl:col-span-1">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Clock className="h-5 w-5 text-muted-foreground" aria-hidden /> Up Next
          </h2>

          <Card className="rounded-3xl">
            <CardContent className="p-4 pt-4">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full rounded-2xl" />
                  <Skeleton className="h-16 w-full rounded-2xl" />
                  <Skeleton className="h-16 w-full rounded-2xl" />
                </div>
              ) : waitingTokens.length === 0 ? (
                <EmptyState icon={Clock} title="Queue is empty" description="Waiting patients will appear here." />
              ) : (
                <div className="space-y-3">
                  {waitingTokens.map((token: any, i: number) => (
                    <motion.div
                      key={token._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="flex items-center justify-between rounded-2xl border border-border bg-muted/40 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={token.patientName} size="sm" />
                        <div>
                          <p className="font-bold text-foreground">{token.patientName}</p>
                          <p className="mt-0.5 font-mono text-xs text-muted-foreground">{token.tokenNumber}</p>
                        </div>
                      </div>
                      {i === 0 && !activeToken && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="text-primary"
                          onClick={() => callMutation.mutate(token._id)}
                        >
                          Call
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Transfer Modal */}
      {activeToken && (
        <Dialog
          open={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          title="Transfer Patient"
          size="lg"
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowTransferModal(false)}>
                Cancel
              </Button>
              <Button
                disabled={transferMutation.isPending}
                loading={transferMutation.isPending}
                onClick={() => transferMutation.mutate({
                  patientId: activeToken.patient,
                  patientName: activeToken.patientName,
                  fromDepartment: department,
                  toDepartment: transferTarget,
                  priority: 'Routine', // Hardcoded for demo
                  clinicalReason: 'Requested by doctor'
                })}
              >
                {transferMutation.isPending ? 'Transferring…' : <><ArrowRight className="h-4 w-4" aria-hidden /> Confirm Transfer</>}
              </Button>
            </>
          }
        >
          <p className="mb-4 text-sm text-muted-foreground">
            Route <span className="font-semibold text-foreground">{activeToken.patientName}</span> to the next department.
          </p>

          <Label className="mb-3 block text-xs font-bold uppercase tracking-wide">Select Destination</Label>
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
            {[
              { id: 'Laboratory', icon: Microscope },
              { id: 'Pharmacy', icon: Pill },
              { id: 'Radiology', icon: FileText },
              { id: 'Billing', icon: Banknote },
              { id: 'Emergency', icon: MapPin },
              { id: 'Admission', icon: CheckCircle },
            ].map((dept) => (
              <button
                key={dept.id}
                onClick={() => setTransferTarget(dept.id)}
                aria-pressed={transferTarget === dept.id}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border p-4 transition-all',
                  transferTarget === dept.id
                    ? 'border-primary bg-primary/10 text-primary shadow-soft'
                    : 'border-border bg-muted/40 text-muted-foreground hover:border-input hover:text-foreground'
                )}
              >
                <dept.icon className="h-6 w-6" aria-hidden />
                <span className="text-xs font-bold">{dept.id}</span>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="transfer-notes" className="mb-2 block text-xs font-bold uppercase tracking-wide">Clinical Reason / Notes</Label>
              <Textarea
                id="transfer-notes"
                placeholder="e.g. CBC and Lipid Profile required..."
                className="min-h-[100px] resize-none"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-warning/30 bg-warning-soft p-4">
              <input type="checkbox" className="h-5 w-5 rounded border-warning/40 text-warning focus:ring-warning" />
              <span>
                <span className="mb-1 block text-sm font-bold leading-none text-warning">Mark as STAT / Urgent</span>
                <span className="block text-xs text-warning/80">This will push the patient to the top of the destination queue.</span>
              </span>
            </label>
          </div>
        </Dialog>
      )}
    </div>
  );
}

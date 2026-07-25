import type { Meta, StoryObj } from '@storybook/react';
import { ClinicalTimeline } from '../components/ClinicalTimeline/ClinicalTimeline';
import type { TimelineEvent } from '../components/ClinicalTimeline/ClinicalTimeline';

const sampleEvents: TimelineEvent[] = [
  { id: '1', type: 'ems',          title: 'EMS Dispatch',            description: 'Unit 4 dispatched — chest pain, 54M', timestamp: '08:14', actor: 'Dispatch', severity: 'warning' },
  { id: '2', type: 'admission',    title: 'Patient Admitted via ED', description: 'Admitted through Emergency. BP 90/60, HR 112', timestamp: '09:02', actor: 'Dr. Priya Mehta', department: 'Emergency' },
  { id: '3', type: 'vitals',       title: 'Vitals Recorded',         description: 'BP 88/58 · HR 118 · SpO₂ 91% — NEWS2: 7', timestamp: '09:15', actor: 'Nurse Anitha', severity: 'critical' },
  { id: '4', type: 'lab',          title: 'Troponin I Ordered',      description: 'STAT — suspected STEMI', timestamp: '09:18', actor: 'Dr. Priya Mehta', department: 'Emergency' },
  { id: '5', type: 'imaging',      title: 'ECG + Chest X-Ray',       description: 'ST elevation leads V1-V4', timestamp: '09:22' },
  { id: '6', type: 'procedure',    title: 'PCI — Primary Angioplasty', description: 'LAD 95% occlusion. Drug-eluting stent placed.', timestamp: '10:45', actor: 'Dr. Ravi Sharma', department: 'Cath Lab', severity: 'info' },
  { id: '7', type: 'transfer',     title: 'Transferred to ICU',      description: 'Post-PCI monitoring. Haemodynamically stable.', timestamp: '12:30', actor: 'ICU Team' },
  { id: '8', type: 'medication',   title: 'Aspirin + Clopidogrel Started', description: 'DAPT initiated', timestamp: '12:45', actor: 'Dr. Priya Mehta' },
  { id: '9', type: 'consultation', title: 'Cardiology Review',       description: 'EF 45% on echo. Plan: GDMT + follow-up in 4 weeks.', timestamp: '16:00', actor: 'Dr. K. Venkatesh' },
];

const meta = {
  title: 'Healthcare / ClinicalTimeline',
  component: ClinicalTimeline,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Chronological clinical event timeline supporting 14 event types. Used across EMR, Patient Portal, and Doctor Workspace. Critical events animate with a pulsing ring. Supports skeleton loading and compact mode.',
      },
    },
  },
} satisfies Meta<typeof ClinicalTimeline>;
export default meta;

type Story = StoryObj<typeof meta>;

export const AcuteSTEMIJourney: Story = {
  args: { events: sampleEvents },
};

export const Compact: Story = {
  args: { events: sampleEvents, compact: true },
};

export const Loading: Story = {
  args: { events: [], isLoading: true },
};

export const Empty: Story = {
  args: { events: [] },
};

export const LimitedItems: Story = {
  args: { events: sampleEvents, maxItems: 3 },
};

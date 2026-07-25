import type { Meta, StoryObj } from '@storybook/react';
import { LabResultCard, CriticalResultBanner } from '../components/LabVisualization/LabVisualization';

const meta = {
  title: 'Healthcare / LabVisualization',
  component: LabResultCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Lab result panel with per-result status flagging (N/L/H/LL/HH), delta indicators, reference ranges, and critical value highlighting. CriticalResultBanner is used for real-time critical alerts.',
      },
    },
  },
} satisfies Meta<typeof LabResultCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const CBC: Story = {
  args: {
    panelName: 'Complete Blood Count (CBC)',
    orderedAt: '09:18, 24 Jul',
    reportedAt: '10:45, 24 Jul',
    status: 'final',
    orderedBy: 'Priya Mehta',
    results: [
      { test: 'Haemoglobin',      value: 8.2,  unit: 'g/dL',    referenceRange: '13.5–17.5 g/dL', status: 'low',   delta: -1.3 },
      { test: 'WBC',              value: 14800, unit: '/µL',     referenceRange: '4000–11000 /µL', status: 'high',  delta: 2100 },
      { test: 'Platelets',        value: 145000, unit: '/µL',    referenceRange: '150000–400000',  status: 'low' },
      { test: 'Haematocrit',      value: 26.4,  unit: '%',       referenceRange: '41–53%',         status: 'low' },
    ],
  },
};

export const CardiacMarkers: Story = {
  args: {
    panelName: 'Cardiac Markers (STAT)',
    orderedAt: '09:18, 24 Jul',
    reportedAt: '09:52, 24 Jul',
    status: 'final',
    orderedBy: 'Priya Mehta',
    results: [
      { test: 'Troponin I',   value: 4.82,  unit: 'ng/mL', referenceRange: '<0.04 ng/mL', status: 'critical-high', delta: 4.82 },
      { test: 'CK-MB',        value: 68,    unit: 'U/L',   referenceRange: '0–25 U/L',   status: 'critical-high' },
      { test: 'BNP',          value: 890,   unit: 'pg/mL', referenceRange: '<100 pg/mL', status: 'high' },
      { test: 'D-Dimer',      value: 1.2,   unit: 'mg/L',  referenceRange: '<0.5 mg/L',  status: 'high' },
    ],
  },
};

export const Pending: Story = {
  args: {
    panelName: 'Renal Function Test',
    orderedAt: '10:00, 24 Jul',
    status: 'pending',
    results: [],
  },
};

export const CriticalBanner: Story = {
  render: () => (
    <CriticalResultBanner
      test="Troponin I"
      value="4.82"
      unit="ng/mL"
      direction="high"
      patient="Ravi Kumar — MRN-2024-08742"
      reportedAt="09:52, 24 Jul"
      onAcknowledge={() => alert('Acknowledged')}
    />
  ),
};

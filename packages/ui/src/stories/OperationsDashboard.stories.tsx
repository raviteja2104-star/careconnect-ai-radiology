import type { Meta, StoryObj } from '@storybook/react';
import { ICUCensusGrid, EDTrackingBoard, OccupancyHeatmap } from '../components/OperationsDashboard/OperationsDashboard';
import type { ICUBed, EDPatient, OccupancyCell } from '../components/OperationsDashboard/OperationsDashboard';

// ─── ICU Census Grid ──────────────────────────────────────────
const icuBeds: ICUBed[] = [
  { id: '1', bedNumber: '1', patientName: 'Ravi Kumar', diagnosis: 'Post-STEMI', news2: 5, ventilated: false, los: '2d', status: 'occupied' },
  { id: '2', bedNumber: '2', patientName: 'Ananya K.', diagnosis: 'Septic Shock', news2: 9, ventilated: true, los: '4d', status: 'occupied' },
  { id: '3', bedNumber: '3', status: 'available' },
  { id: '4', bedNumber: '4', patientName: 'Mohammed A.', diagnosis: 'ARDS', news2: 7, ventilated: true, los: '6d', status: 'occupied' },
  { id: '5', bedNumber: '5', status: 'cleaning' },
  { id: '6', bedNumber: '6', patientName: 'Lakshmi R.', diagnosis: 'DKA', news2: 3, ventilated: false, los: '1d', status: 'occupied' },
];

const edPatients: EDPatient[] = [
  { id: '1', name: 'Suresh Kumar', triage: 1, chiefComplaint: 'Chest Pain, ST elevation', location: 'Resus Bay 1', los: '00:32', status: 'in-treatment', assignedDoctor: 'Dr. Mehta' },
  { id: '2', name: 'Padma Devi', triage: 2, chiefComplaint: 'Acute Abdomen', location: 'Bay 3', los: '01:15', status: 'in-treatment' },
  { id: '3', name: 'Arjun Nair', triage: 3, chiefComplaint: 'Fracture — Right Wrist', location: 'Waiting Room', los: '00:48', status: 'waiting' },
  { id: '4', name: 'Meena Sharma', triage: 4, chiefComplaint: 'Fever 3 days', location: 'Waiting Room', los: '02:10', status: 'waiting' },
  { id: '5', name: 'Raju Pillai', triage: 2, chiefComplaint: 'Stroke — Aphasia', location: 'CT Scanner', los: '00:55', status: 'in-treatment', assignedDoctor: 'Dr. Rao', flags: ['thrombolysis'] },
];

const occupancyCells: OccupancyCell[] = [
  { id: 'w1', label: 'ICU', occupancy: 83 },
  { id: 'w2', label: 'Cardiology', occupancy: 91 },
  { id: 'w3', label: 'Surgery', occupancy: 67 },
  { id: 'w4', label: 'Neurology', occupancy: 72 },
  { id: 'w5', label: 'Ortho', occupancy: 45 },
  { id: 'w6', label: 'Paediatrics', occupancy: 38 },
  { id: 'w7', label: 'General A', occupancy: 88 },
  { id: 'w8', label: 'General B', occupancy: 95 },
];

const meta = {
  title: 'Healthcare / OperationsDashboard',
  component: ICUCensusGrid,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ICUCensusGrid>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ICUCensus: Story = {
  render: () => <ICUCensusGrid beds={icuBeds} />,
};

export const EDBoard: Story = {
  render: () => <EDTrackingBoard patients={edPatients} />,
};

export const OccupancyMap: Story = {
  render: () => <OccupancyHeatmap cells={occupancyCells} title="Hospital Occupancy" />,
};

export const EDEmpty: Story = {
  render: () => <EDTrackingBoard patients={[]} />,
};

import type { Meta, StoryObj } from '@storybook/react';
import { BedCard } from '../components/BedCard/BedCard';

const meta = {
  title: 'Healthcare / BedCard',
  component: BedCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Displays a hospital bed status. Color-coded: green (available), red (occupied), amber (cleaning/maintenance), blue (reserved). Used in Bed Management, ICU, and Nurse Station modules.',
      },
    },
  },
} satisfies Meta<typeof BedCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Available: Story = {
  args: { bedNumber: 'A-04', ward: 'General Ward A', status: 'available' },
};

export const Occupied: Story = {
  args: {
    bedNumber: 'B-12', ward: 'Cardiology Ward', status: 'occupied',
    patientName: 'Ravi Kumar Sharma', patientMrn: 'MRN-2024-08742',
    admittedSince: '22 Jul 2026, 10:30',
  },
};

export const Cleaning: Story = {
  args: { bedNumber: 'C-07', ward: 'Surgery Ward', status: 'cleaning' },
};

export const Reserved: Story = {
  args: { bedNumber: 'ICU-3', ward: 'ICU', status: 'reserved', patientName: 'Incoming from OT' },
};

export const Maintenance: Story = {
  args: { bedNumber: 'D-11', ward: 'General Ward D', status: 'maintenance' },
};

export const Clickable: Story = {
  args: {
    bedNumber: 'B-12', ward: 'Cardiology', status: 'occupied',
    patientName: 'Ananya Krishnamurthy', patientMrn: 'MRN-2024-09133',
    admittedSince: '23 Jul 2026',
    onClick: () => alert('Navigate to patient record'),
  },
};

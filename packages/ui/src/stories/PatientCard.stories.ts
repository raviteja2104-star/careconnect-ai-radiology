import type { Meta, StoryObj } from '@storybook/react';
import { PatientCard } from '../components/PatientCard/PatientCard';

const meta = {
  title: 'Healthcare / PatientCard',
  component: PatientCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Displays comprehensive patient context including demographics, status, ward, bed, consultant, diagnosis, and allergies. Used across EMR, Nurse Station, ICU, and ED modules.',
      },
    },
  },
} satisfies Meta<typeof PatientCard>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: 'Ravi Kumar Sharma',
    mrn: 'MRN-2024-08742',
    age: 54,
    gender: 'Male',
    status: 'Admitted',
    statusVariant: 'info',
    ward: 'Cardiology Ward 3',
    bed: 'B-12',
    consultant: 'Dr. Priya Mehta',
    diagnosis: 'Acute Myocardial Infarction (STEMI)',
    allergies: ['Penicillin', 'Aspirin'],
  },
};

export const Critical: Story = {
  args: {
    ...Default.args,
    status: 'Critical',
    statusVariant: 'danger',
    name: 'Ananya Krishnamurthy',
    mrn: 'MRN-2024-09133',
    age: 67,
    gender: 'Female',
    ward: 'ICU',
    bed: 'ICU-7',
    diagnosis: 'Septic Shock — Post-op',
  },
};

export const Compact: Story = {
  args: {
    ...Default.args,
    compact: true,
  },
};

export const NoAllergies: Story = {
  args: {
    name: 'Mohan Das',
    mrn: 'MRN-2024-07391',
    age: 32,
    gender: 'Male',
    status: 'Admitted',
    statusVariant: 'info',
  },
};

import type { Meta, StoryObj } from '@storybook/react';
import { VitalCard } from '../components/VitalCard/VitalCard';

const meta = {
  title: 'Healthcare / VitalCard',
  component: VitalCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Displays current vital signs with live severity color coding. Used in ICU, Nurse Station, and Patient Monitor views. Critical vitals pulse red to attract attention.',
      },
    },
  },
} satisfies Meta<typeof VitalCard>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  args: {
    title: 'Vital Signs',
    timestamp: '14:35',
    source: 'Bedside Monitor',
    readings: [
      { label: 'HR', value: 78, unit: 'bpm', status: 'normal', trend: 'stable' },
      { label: 'BP', value: '122/78', unit: 'mmHg', status: 'normal' },
      { label: 'SpO₂', value: 98, unit: '%', status: 'normal', trend: 'stable' },
      { label: 'Temp', value: 36.8, unit: '°C', status: 'normal' },
    ],
  },
};

export const Warning: Story = {
  args: {
    title: 'Vital Signs',
    timestamp: '14:35',
    readings: [
      { label: 'HR', value: 112, unit: 'bpm', status: 'warning', trend: 'up' },
      { label: 'BP', value: '148/96', unit: 'mmHg', status: 'warning' },
      { label: 'SpO₂', value: 93, unit: '%', status: 'warning', trend: 'down' },
      { label: 'Temp', value: 38.4, unit: '°C', status: 'warning' },
    ],
  },
};

export const Critical: Story = {
  args: {
    title: 'Vital Signs — CRITICAL',
    timestamp: '14:35',
    readings: [
      { label: 'HR', value: 142, unit: 'bpm', status: 'critical', trend: 'up' },
      { label: 'BP', value: '68/42', unit: 'mmHg', status: 'critical' },
      { label: 'SpO₂', value: 84, unit: '%', status: 'critical', trend: 'down' },
      { label: 'Temp', value: 39.9, unit: '°C', status: 'critical' },
    ],
  },
};

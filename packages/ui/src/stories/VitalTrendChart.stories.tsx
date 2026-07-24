import type { Meta, StoryObj } from '@storybook/react';
import { HeartRateChart, BloodPressureChart, SpO2Chart, TemperatureChart } from '../components/VitalTrendChart/VitalTrendChart';

const meta = {
  title: 'Healthcare / VitalTrendChart',
  component: HeartRateChart,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'SVG-based vital trend chart with no external chart library dependency. Supports threshold lines, normal range bands, data point annotations, and abnormal value detection. Available as preset variants for HR, BP, SpO₂, Temp, and Glucose.',
      },
    },
  },
} satisfies Meta<typeof HeartRateChart>;
export default meta;

const mockHRData = [
  { time: '06:00', value: 72 },
  { time: '08:00', value: 78 },
  { time: '10:00', value: 82 },
  { time: '12:00', value: 110, annotation: '▲' },
  { time: '14:00', value: 95 },
  { time: '16:00', value: 88 },
  { time: '18:00', value: 76 },
];

const mockBPData = [
  { time: '06:00', value: 118 },
  { time: '08:00', value: 125 },
  { time: '10:00', value: 138 },
  { time: '12:00', value: 148 },
  { time: '14:00', value: 142 },
  { time: '16:00', value: 133 },
  { time: '18:00', value: 127 },
];

type Story = StoryObj<typeof meta>;

export const HeartRate: Story = {
  render: () => <HeartRateChart data={mockHRData} />,
};

export const BloodPressure: Story = {
  render: () => <BloodPressureChart data={mockBPData} />,
};

export const SpO2: Story = {
  render: () => <SpO2Chart data={[
    { time: '06:00', value: 98 }, { time: '08:00', value: 97 }, { time: '10:00', value: 95 },
    { time: '12:00', value: 91, annotation: '↓' }, { time: '14:00', value: 94 }, { time: '16:00', value: 96 }, { time: '18:00', value: 98 },
  ]} />,
};

export const Temperature: Story = {
  render: () => <TemperatureChart data={[
    { time: '06:00', value: 36.6 }, { time: '08:00', value: 37.1 }, { time: '10:00', value: 37.8 },
    { time: '12:00', value: 38.6, annotation: 'Fever' }, { time: '14:00', value: 38.2 }, { time: '16:00', value: 37.6 }, { time: '18:00', value: 37.2 },
  ]} />,
};

export const NoData: Story = {
  render: () => <HeartRateChart data={[]} />,
};

export const Loading: Story = {
  render: () => <HeartRateChart data={[]} isLoading />,
};

import type { Meta, StoryObj } from '@storybook/react';
import { ClinicalScoreCard, NEWS2Card, SOFACard, GCSCard, PainScaleCard } from '../components/ClinicalScores/ClinicalScores';

const meta = {
  title: 'Healthcare / ClinicalScores',
  component: ClinicalScoreCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Clinical severity scoring widgets with SVG gauge visualization. Severity determines color: green (low) → amber (medium) → red (high) → pulsing red (critical). Used in ICU, ED, and Nurse Station.',
      },
    },
  },
} satisfies Meta<typeof ClinicalScoreCard>;
export default meta;

type Story = StoryObj<typeof meta>;

export const NEWS2Low: Story = {
  name: 'NEWS2 – Low Risk',
  render: () => <NEWS2Card score={2} />,
};
export const NEWS2High: Story = {
  name: 'NEWS2 – High Risk',
  render: () => <NEWS2Card score={6} />,
};
export const NEWS2Critical: Story = {
  name: 'NEWS2 – Critical',
  render: () => <NEWS2Card score={8} />,
};
export const SOFAMedium: Story = {
  name: 'SOFA – Moderate',
  render: () => <SOFACard score={5} />,
};
export const GCS_Severe: Story = {
  name: 'GCS – Severe Injury',
  render: () => <GCSCard eye={1} verbal={2} motor={4} />,
};
export const PainSevere: Story = {
  name: 'Pain Scale – Severe',
  render: () => <PainScaleCard score={8} />,
};
export const WithAIInsight: Story = {
  args: {
    score: 6,
    maxScore: 20,
    title: 'NEWS2',
    interpretation: 'Urgent review required',
    severity: 'high',
    trend: 'deteriorating',
    lastUpdated: '15:30 today',
    aiInsight: 'Score has increased by 3 points in last 4 hours. Consider escalation to ICU. Respiratory component driving deterioration.',
    breakdown: [
      { label: 'Resp Rate', value: 3 },
      { label: 'SpO₂', value: 1 },
      { label: 'Heart Rate', value: 1 },
      { label: 'BP', value: 0 },
      { label: 'Consciousness', value: 1 },
    ],
  },
};

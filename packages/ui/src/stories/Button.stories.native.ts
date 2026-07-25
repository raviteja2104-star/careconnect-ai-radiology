import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../components/Button/Button';

const meta = {
  title: 'Foundation / Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Primary interaction element. Supports 5 variants, 3 sizes, loading state, icon slots, and full-width layout. Uses `--color-brand-primary` from the design token system.',
      },
    },
  },
  argTypes: {
    variant: { control: 'select', options: ['primary','secondary','danger','ghost','link'] },
    size: { control: 'select', options: ['sm','md','lg'] },
    isLoading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
  },
} satisfies Meta<typeof Button>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { children: 'Save Patient', variant: 'primary' } };
export const Secondary: Story = { args: { children: 'Cancel', variant: 'secondary' } };
export const Danger: Story = { args: { children: 'Delete Record', variant: 'danger' } };
export const Ghost: Story = { args: { children: 'View Details', variant: 'ghost' } };
export const Loading: Story = { args: { children: 'Saving...', variant: 'primary', isLoading: true } };
export const Disabled: Story = { args: { children: 'Unavailable', variant: 'primary', disabled: true } };
export const SmallSize: Story = { args: { children: 'Add Tag', variant: 'primary', size: 'sm' } };
export const LargeSize: Story = { args: { children: 'Admit Patient', variant: 'primary', size: 'lg' } };
export const FullWidth: Story = { args: { children: 'Submit', variant: 'primary', fullWidth: true } };

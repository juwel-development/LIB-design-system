import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from './Select';

const meta: Meta<typeof Select> = {
  title: 'Interaction/Select',
  component: Select,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'An uncontrolled native single-select field. The empty placeholder remains selectable; required rejects it. Options use unique, stable, nonempty string values and caller-localized labels. defaultValue applies on mount only. onChange$ emits user changes, including clearing, but never rendering, option replacement, or native form reset. Removing the selected option returns the control to empty; consumers must reconcile their domain state when replacing options. The browser owns keyboard navigation and the popup appearance.',
      },
    },
  },
  tags: ['autodocs'],
  args: {
    label: 'Home market',
    name: 'homeMarket',
    placeholder: 'Choose a market',
    options: [
      { value: 'de', label: 'Germany' },
      { value: 'gb', label: 'United Kingdom' },
      { value: 'fr', label: 'France' },
    ],
  },
  argTypes: {
    onChange$: { control: false },
    defaultValue: {
      description:
        'Initial selection only; remount the field to initialize another record.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Required: Story = {
  args: { required: true, hint: 'Choose where your label is based' },
};

export const Selected: Story = {
  args: { defaultValue: 'de' },
};

export const Optional: Story = {
  args: {
    label: 'Comparison market',
    name: 'comparisonMarket',
    placeholder: 'No comparison',
    optionalLabel: 'optional',
  },
};

export const Localized: Story = {
  args: {
    label: 'Vergleichsmarkt',
    name: 'comparisonMarket',
    placeholder: 'Kein Vergleich',
    optionalLabel: 'freiwillig',
    options: [
      { value: 'de', label: 'Deutschland' },
      { value: 'gb', label: 'Vereinigtes Königreich' },
      { value: 'fr', label: 'Frankreich' },
    ],
  },
};

export const Invalid: Story = {
  args: {
    required: true,
    invalid: true,
    hint: 'Choose where your label is based',
    errorMessage: 'Choose an available market',
  },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'de' },
};

export const EmptyOptions: Story = {
  args: { options: [], required: true, hint: 'Markets are loading' },
};

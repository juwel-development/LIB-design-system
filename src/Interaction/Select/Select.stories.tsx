import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from './Select';

const meta: Meta<typeof Select.Root> = {
  title: 'Interaction/Select',
  component: Select.Root,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          "Compose Select.Root with Select.Option children for an uncontrolled native single-select field. The empty placeholder remains selectable; required rejects it. Options use unique, stable, nonempty string values and caller-localized labels. Use stable React keys when mapping options. defaultValue applies on mount only; native reset restores that default while its option stays mounted, otherwise empty. Newly mounted options do not inherit a removed option's reset default. onChange$ emits user changes, including clearing, but never rendering, option replacement, or native form reset. Removing the selected option returns the control to empty; consumers must reconcile their domain state when replacing options. The browser owns keyboard navigation and the popup appearance.",
      },
    },
  },
  tags: ['autodocs'],
  args: {
    label: 'Home market',
    name: 'homeMarket',
    placeholder: 'Choose a market',
  },
  render: (args) => (
    <Select.Root {...args}>
      <Select.Option value={'de'}>{'Germany'}</Select.Option>
      <Select.Option value={'gb'}>{'United Kingdom'}</Select.Option>
      <Select.Option value={'fr'}>{'France'}</Select.Option>
    </Select.Root>
  ),
  argTypes: {
    children: { control: false },
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
  render: (args) => (
    <Select.Root {...args}>
      <Select.Option value={'de'}>{'Deutschland'}</Select.Option>
      <Select.Option value={'gb'}>{'Vereinigtes Königreich'}</Select.Option>
      <Select.Option value={'fr'}>{'Frankreich'}</Select.Option>
    </Select.Root>
  ),
  args: {
    label: 'Vergleichsmarkt',
    name: 'comparisonMarket',
    placeholder: 'Kein Vergleich',
    optionalLabel: 'freiwillig',
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
  args: { required: true, hint: 'Markets are loading' },
  render: (args) => <Select.Root {...args} />,
};

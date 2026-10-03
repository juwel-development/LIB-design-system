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
          "Compose Select.Root with Select.Option children for an uncontrolled native single-select field. The empty placeholder remains selectable; required rejects it. Options use unique, stable, nonempty string values and caller-localized labels. Use stable React keys when mapping options. defaultValue applies on mount only; native reset restores that default while its option stays mounted, otherwise empty. Newly mounted options do not inherit a removed option's reset default. onChange$ emits user changes, including clearing, but never rendering, option replacement, or native form reset. Removing the selected option returns the control to empty; consumers must reconcile their domain state when replacing options. The browser owns keyboard navigation and the popup appearance." +
          '\n\n' +
          "`Select` is a compound namespace: `Select.Root` renders a labelled, uncontrolled native\nsingle-select field and `Select.Option` renders one text-only native option. Root starts on\nan empty, selectable placeholder; `required` makes that empty value invalid without choosing an\noption for the user.\n\n```tsx\nimport { Select } from '@juwel-development/design-system';\nimport { Subject } from 'rxjs';\n\nconst marketChange$ = new Subject<string>();\n\n<Select.Root\n  label={'Home market'}\n  name={'homeMarket'}\n  required={true}\n  placeholder={'Choose a market'}\n  onChange$={marketChange$}\n>\n  <Select.Option value={'de'}>{'Germany'}</Select.Option>\n  <Select.Option value={'gb'}>{'United Kingdom'}</Select.Option>\n</Select.Root>;\n```\n\n`Root` requires `label`, `name`, and `placeholder`; its `children` compose `Select.Option`\nmembers, including arrays, fragments, conditional children and consumer components that\nrender options. An empty field can omit children. Each `Option` requires a `value` and a\ntext-only `children` label, and accepts an optional `testId`. Option values must be\nunique, stable, nonempty strings; every label and message is worded by the consumer.\nThe empty string is reserved for the placeholder, which remains selectable so an optional\nfield can be cleared. The browser owns keyboard navigation and the native popup.\n\nOptional props are `required`, `disabled`, `defaultValue`, `onChange$`, `optionalLabel`,\n`hint`, `invalid`, `errorMessage`, and `testId`. Labels always name the control; hints and\nvisible errors describe it. `invalid` exposes the consumer's validation state through\n`aria-invalid`, and `errorMessage` renders only while invalid. Styling follows Input's\ncontrol, typography, focus-ring, motion, and state tokens.\n\n`defaultValue` initializes a matching option on mount; omitted or unmatched values start\nempty. Later `defaultValue` changes do not overwrite the user's selection. Reordered or\nrelabeled options preserve a surviving selected value; removing that option returns the\ncontrol to empty. Options arriving later do not apply an earlier unmatched default.\n\n`onChange$` emits the selected string once per user change, including `''` on clearing.\nRendering, option replacement, and native form reset do not emit. The consumer owns the\nSubject and must reconcile its own domain state when replacing options or resetting a form.\nNative form reset restores the original default while that option remains mounted; if it\nis removed, reset returns to empty. A newly mounted option does not inherit an earlier\noption's reset default, even when it reuses its value. Keep React keys stable (use the\noption value) across translation and reordering to preserve native selection and reset\nstate. No `reset$` prop is needed. A new record can initialize through a remount. Forms can\nalso read the current value directly by `name`, without any event subscription.\n\nThe previous unpublished `<Select options={...} />` API has been removed. For Home Market\nin `g-label-manager` #125, put the existing field props on `Select.Root` and map market\nrecords to `<Select.Option key={market.id} value={market.id}>{translatedName}</Select.Option>`\nchildren. Keep `required` and the localized `placeholder` on Root; the empty option is\nprovided by Root, so callers do not compose another empty Option. Derive types with\n`ComponentProps<typeof Select.Root>` or `ComponentProps<typeof Select.Option>` from React.\nThe consumer still awaits a published library release before changing its dependency.",
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

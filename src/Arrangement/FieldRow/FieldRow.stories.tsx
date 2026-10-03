import { Button } from 'Interaction/Button/Button';
import { Input } from 'Interaction/Input/Input';
import { MultiSelect } from 'Interaction/MultiSelect/MultiSelect';
import { NumberInput } from 'Interaction/NumberInput/NumberInput';
import { Select } from 'Interaction/Select/Select';
import { TextArea } from 'Interaction/TextArea/TextArea';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  type CSSProperties,
  type FunctionComponent,
  type ReactNode,
  useState,
} from 'react';
import { BehaviorSubject, Subject } from 'rxjs';
import { FieldRow } from './FieldRow';

// The consumer's theme declares every minimum the fields name, in its own units. These are the
// story's stand-in for a product stylesheet: FieldRow ships none of them.
const theme = {
  '--filter-search-min-width': '14rem',
  '--filter-threshold-min-width': '9rem',
  '--filter-region-min-width': '10rem',
  '--filter-tags-min-width': '12rem',
  '--filter-notes-min-width': '14rem',
  '--filter-wide-min-width': '20rem',
} as CSSProperties;

/** A holder the reviewer can drag narrower: `resize` on the frame, and `overflow: auto` so any
 *  overflow FieldRow caused would show as a scrollbar rather than hide. */
const Frame: FunctionComponent<{ width: string; children: ReactNode }> = ({
  width,
  children,
}) => (
  <div
    style={{
      ...theme,
      width,
      maxWidth: '100%',
      resize: 'horizontal',
      overflow: 'auto',
      padding: '1rem',
      border: '1px dashed var(--color-border)',
    }}
  >
    {children}
  </div>
);

const TagsFilter: FunctionComponent<{ hint?: string }> = ({ hint }) => {
  const [selected$] = useState(
    () => new BehaviorSubject<readonly string[]>([]),
  );
  const [onChange$] = useState(() => {
    const proposals = new Subject<readonly string[]>();
    proposals.subscribe((next) => selected$.next(next));
    return proposals;
  });
  return (
    <MultiSelect.Root
      label={'Tags'}
      selected$={selected$}
      onChange$={onChange$}
      emptyLabel={'Any tag'}
      removeLabel={'Remove {label}'}
      clearLabel={'Clear tags'}
      overflowLabel={'+{count}'}
      hint={hint}
    >
      <MultiSelect.Option value={'rare'}>Rare</MultiSelect.Option>
      <MultiSelect.Option value={'foil'}>Foil</MultiSelect.Option>
      <MultiSelect.Option value={'signed'}>Signed</MultiSelect.Option>
    </MultiSelect.Root>
  );
};

const RegionSelect: FunctionComponent<{
  label?: string;
  hint?: string;
  optionalLabel?: string;
}> = ({ label = 'Region', hint, optionalLabel }) => (
  <Select.Root
    name={'region'}
    label={label}
    placeholder={'Any region'}
    hint={hint}
    optionalLabel={optionalLabel}
  >
    <Select.Option value={'eu'}>Europe</Select.Option>
    <Select.Option value={'na'}>North America</Select.Option>
    <Select.Option value={'jp'}>Japan</Select.Option>
  </Select.Root>
);

const Actions: FunctionComponent<{ long?: boolean }> = ({ long }) => (
  <FieldRow.Actions>
    <Button>{long ? 'Apply these filters' : 'Apply'}</Button>
    <Button variant={'secondary'}>
      {long ? 'Reset every filter' : 'Reset'}
    </Button>
  </FieldRow.Actions>
);

const meta: Meta<typeof FieldRow.Root> = {
  title: 'Arrangement/FieldRow',
  component: FieldRow.Root,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    gap: {
      control: { type: 'radio' },
      options: ['stack', 'region'],
      description: 'Which space role separates items along a row',
    },
  },
  decorators: [(Story) => <div style={theme}>{Story()}</div>],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The default: short labels, a search field weighted twice a threshold, and the actions on the
 *  sibling gap. Every control bottom - and the buttons - sit on one line. */
export const Default: Story = {
  render: (args) => (
    <FieldRow.Root {...args}>
      <FieldRow.Field weight={2} minWidth={'--filter-search-min-width'}>
        <Input name={'search'} label={'Name'} placeholder={'Any name'} />
      </FieldRow.Field>
      <FieldRow.Field minWidth={'--filter-threshold-min-width'}>
        <NumberInput name={'quality'} label={'Minimum quality'} />
      </FieldRow.Field>
      <Actions />
    </FieldRow.Root>
  ),
};

/** All five supported fields with their different control heights: a `TextArea` and a
 *  `MultiSelect` keep their height and the single-line controls come down to the same bottom. */
export const AllFieldTypes: Story = {
  render: () => (
    <FieldRow.Root>
      <FieldRow.Field weight={2} minWidth={'--filter-search-min-width'}>
        <Input name={'search'} label={'Name'} />
      </FieldRow.Field>
      <FieldRow.Field minWidth={'--filter-threshold-min-width'}>
        <NumberInput name={'quality'} label={'Minimum quality'} />
      </FieldRow.Field>
      <FieldRow.Field minWidth={'--filter-region-min-width'}>
        <RegionSelect />
      </FieldRow.Field>
      <FieldRow.Field minWidth={'--filter-tags-min-width'}>
        <TagsFilter />
      </FieldRow.Field>
      <FieldRow.Field weight={2} minWidth={'--filter-notes-min-width'}>
        <TextArea name={'notes'} label={'Notes'} />
      </FieldRow.Field>
      <Actions />
    </FieldRow.Root>
  ),
};

/** Labels of very different lengths in a holder narrow enough to wrap the long ones: the
 *  wrapped label never moves its neighbours' controls, because the controls are the anchor. */
export const WrappedLabels: Story = {
  render: () => (
    <Frame width={'44rem'}>
      <FieldRow.Root>
        <FieldRow.Field minWidth={'--filter-search-min-width'}>
          <Input name={'search'} label={'Name'} />
        </FieldRow.Field>
        <FieldRow.Field minWidth={'--filter-threshold-min-width'}>
          <NumberInput
            name={'quality'}
            label={
              'Minimum quality, out of ten, below which a label is left out'
            }
          />
        </FieldRow.Field>
        <FieldRow.Field minWidth={'--filter-region-min-width'}>
          <RegionSelect label={'Region of the first release'} />
        </FieldRow.Field>
        <Actions />
      </FieldRow.Root>
    </Frame>
  ),
};

/** Optional markers, hints and an error, each on a different field: everything below a control
 *  is left where its field puts it, and nothing below a control pushes the row's controls apart. */
export const HintsAndErrors: Story = {
  render: () => (
    <FieldRow.Root>
      <FieldRow.Field weight={2} minWidth={'--filter-search-min-width'}>
        <Input
          name={'search'}
          label={'Name'}
          hint={'Partial names match anywhere in the name'}
        />
      </FieldRow.Field>
      <FieldRow.Field minWidth={'--filter-threshold-min-width'}>
        <NumberInput
          name={'quality'}
          label={'Minimum quality'}
          invalid={true}
          errorMessage={'Enter a number from 1 to 10'}
          defaultValue={'eleven'}
        />
      </FieldRow.Field>
      <FieldRow.Field minWidth={'--filter-region-min-width'}>
        <RegionSelect optionalLabel={'optional'} />
      </FieldRow.Field>
      <Actions />
    </FieldRow.Root>
  ),
};

/** Weights 3 : 1 : 1 across one row. The width left after the gaps and the actions' content
 *  width is shared in that proportion; the actions take no share. */
export const Weighted: Story = {
  render: () => (
    <FieldRow.Root>
      <FieldRow.Field weight={3} minWidth={'--filter-search-min-width'}>
        <Input name={'search'} label={'Name'} />
      </FieldRow.Field>
      <FieldRow.Field minWidth={'--filter-threshold-min-width'}>
        <NumberInput name={'quality'} label={'Minimum quality'} />
      </FieldRow.Field>
      <FieldRow.Field minWidth={'--filter-region-min-width'}>
        <RegionSelect />
      </FieldRow.Field>
      <Actions />
    </FieldRow.Root>
  ),
};

/** A narrow holder - drag the frame's corner. Fields wrap progressively at their minimums, each
 *  row aligning its own controls; the actions move to the next row as one group, and wrap their
 *  buttons inside the group only once the group cannot fit a row by itself. */
export const Narrow: Story = {
  render: () => (
    <Frame width={'24rem'}>
      <FieldRow.Root>
        <FieldRow.Field weight={2} minWidth={'--filter-search-min-width'}>
          <Input name={'search'} label={'Name'} />
        </FieldRow.Field>
        <FieldRow.Field minWidth={'--filter-threshold-min-width'}>
          <NumberInput name={'quality'} label={'Minimum quality'} />
        </FieldRow.Field>
        <FieldRow.Field minWidth={'--filter-region-min-width'}>
          <RegionSelect />
        </FieldRow.Field>
        <Actions long={true} />
      </FieldRow.Root>
    </Frame>
  ),
};

/** One field alone in a holder narrower than its own minimum (20rem in 14rem): the minimum
 *  yields and the field fits the holder instead of overflowing it. */
export const AloneBelowMinimum: Story = {
  render: () => (
    <Frame width={'14rem'}>
      <FieldRow.Root>
        <FieldRow.Field minWidth={'--filter-wide-min-width'}>
          <Input name={'search'} label={'Name'} />
        </FieldRow.Field>
      </FieldRow.Root>
    </Frame>
  ),
};

const ConditionalFilter: FunctionComponent = () => {
  const [showRegion, setShowRegion] = useState(false);
  const [toggle$] = useState(() => {
    const clicks = new Subject<void>();
    clicks.subscribe(() => setShowRegion((shown) => !shown));
    return clicks;
  });
  return (
    <FieldRow.Root>
      <FieldRow.Field weight={2} minWidth={'--filter-search-min-width'}>
        <Input name={'search'} label={'Name'} hint={'Type, then toggle'} />
      </FieldRow.Field>
      {showRegion && (
        <FieldRow.Field minWidth={'--filter-region-min-width'}>
          <RegionSelect label={'Region of the first release'} />
        </FieldRow.Field>
      )}
      <FieldRow.Actions>
        <Button variant={'secondary'} onClick$={toggle$}>
          {showRegion ? 'Hide region' : 'Show region'}
        </Button>
      </FieldRow.Actions>
    </FieldRow.Root>
  );
};

/** A field taken in and out: the omitted field reserves no space, and the typed name survives
 *  the reflow because nothing is remounted. */
export const ConditionalField: Story = {
  render: () => <ConditionalFilter />,
};

/** `gap="region"` separates fields that are not one set, with the wrapped-row gap and the gap
 *  between the buttons still the sibling role. */
export const RegionGap: Story = {
  render: () => (
    <FieldRow.Root gap={'region'}>
      <FieldRow.Field weight={2} minWidth={'--filter-search-min-width'}>
        <Input name={'search'} label={'Name'} />
      </FieldRow.Field>
      <FieldRow.Field minWidth={'--filter-region-min-width'}>
        <RegionSelect />
      </FieldRow.Field>
      <Actions />
    </FieldRow.Root>
  ),
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { type FunctionComponent, useEffect, useState } from 'react';
import { BehaviorSubject, Subject } from 'rxjs';
import { MultiSelect } from './MultiSelect';

const meta: Meta<typeof MultiSelect.Root> = {
  title: 'Interaction/MultiSelect',
  component: MultiSelect.Root,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "Compose MultiSelect.Root with MultiSelect.Option children for a consumer-controlled dropdown that selects zero, one or several options independently. Root renders the latest `selected$` emission - a replaying source such as a BehaviorSubject restores the state on remount - and emits one fresh full proposal on `onChange$` per toggle, chip removal or clear-all, in option order and without duplicates; the consumer feeds accepted proposals back into `selected$`. Rendering, opening, closing, option updates and source replacement never emit. The closed control stays on one line: chips that fit, then a `+N` count whose activation opens the dropdown; the dropdown floats over the page, opens above when the viewport below is too short, and scrolls. All wording is the caller's: `emptyLabel`, `removeLabel` (`{label}`), `clearLabel`, `overflowLabel` (`{count}`), the optional `hint` and every option label.",
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    selected$: { control: false },
    onChange$: { control: false },
    children: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

type Topic = readonly [string, string];

const TOPICS: readonly Topic[] = [
  ['family', 'Family'],
  ['love', 'Love'],
  ['loss', 'Loss'],
  ['hope', 'Hope'],
  ['work', 'Work'],
  ['travel', 'Travel'],
  ['home', 'Home'],
  ['faith', 'Faith'],
  ['youth', 'Youth'],
  ['city', 'City'],
  ['nature', 'Nature'],
  ['protest', 'Protest'],
];

const GERMAN_TOPICS: readonly Topic[] = [
  ['family', 'Familie'],
  ['love', 'Liebe'],
  ['loss', 'Verlust'],
  ['hope', 'Hoffnung'],
  ['work', 'Arbeit'],
  ['travel', 'Reisen'],
  ['home', 'Heimat'],
  ['faith', 'Glaube'],
  ['youth', 'Jugend'],
  ['city', 'Stadt'],
  ['nature', 'Natur'],
  ['protest', 'Protest'],
];

const LONG_TOPICS: readonly Topic[] = [
  ['coming-of-age', 'Coming of age in a small industrial town'],
  ['long-distance', 'Long-distance relationships and the letters they leave'],
  ['grief', 'Grief that arrives long after the funeral'],
  ['nachhaltigkeit', 'Nachhaltigkeitsberichterstattungspflicht'],
  ['donau', 'Donaudampfschifffahrtsgesellschaftskapitän'],
  ['arbeitsplatz', 'Arbeitsplatzunsicherheit in der Kreativwirtschaft'],
];

type Wording = {
  label: string;
  emptyLabel: string;
  removeLabel: string;
  clearLabel: string;
  overflowLabel: string;
  hint: string;
};

const ENGLISH_WORDING: Wording = {
  label: 'Main topics',
  emptyLabel: 'No topics selected',
  removeLabel: 'Remove {label}',
  clearLabel: 'Clear topics',
  overflowLabel: '+{count}',
  hint: 'Songs match any selected topic.',
};

const GERMAN_WORDING: Wording = {
  label: 'Hauptthemen',
  emptyLabel: 'Keine Themen ausgewählt',
  removeLabel: '{label} entfernen',
  clearLabel: 'Themen zurücksetzen',
  overflowLabel: '+{count}',
  hint: 'Songs passen zu jedem ausgewählten Thema.',
};

type TopicFilterProps = {
  initial?: readonly string[];
  options?: readonly Topic[];
  wording?: Wording;
  width?: string;
  disabled?: boolean;
  /** Hands the story's consumer-side state source out, for external clear and restore. */
  onSource?: (selected$: BehaviorSubject<readonly string[]>) => void;
};

// The controlled wiring every consumer repeats: a replaying state source, an output Subject
// whose proposals are accepted straight into that source, and the current set passed back in.
const TopicFilter: FunctionComponent<TopicFilterProps> = ({
  initial = [],
  options = TOPICS,
  wording = ENGLISH_WORDING,
  width = '28rem',
  disabled,
  onSource,
}) => {
  const [selected$] = useState(
    () => new BehaviorSubject<readonly string[]>(initial),
  );
  const [onChange$] = useState(() => new Subject<readonly string[]>());
  const [proposals, setProposals] = useState<readonly string[][]>([]);
  useEffect(() => {
    onSource?.(selected$);
    const subscription = onChange$.subscribe((next) => {
      selected$.next(next);
      setProposals((current) => [...current, [...next]]);
    });
    return () => subscription.unsubscribe();
  }, [onChange$, selected$, onSource]);
  return (
    <div style={{ width, maxWidth: '100%' }}>
      <MultiSelect.Root
        label={wording.label}
        selected$={selected$}
        onChange$={onChange$}
        emptyLabel={wording.emptyLabel}
        removeLabel={wording.removeLabel}
        clearLabel={wording.clearLabel}
        overflowLabel={wording.overflowLabel}
        hint={wording.hint}
        disabled={disabled}
      >
        {options.map(([value, label]) => (
          <MultiSelect.Option key={value} value={value}>
            {label}
          </MultiSelect.Option>
        ))}
      </MultiSelect.Root>
      <p
        style={{ marginTop: '1rem', fontSize: '0.8125rem', opacity: 0.7 }}
        aria-live={'polite'}
      >
        {proposals.length === 0
          ? 'No proposal emitted yet.'
          : `Last proposal: [${proposals[proposals.length - 1]?.join(', ')}] (${proposals.length} so far)`}
      </p>
    </div>
  );
};

export const Empty: Story = {
  render: () => <TopicFilter />,
};

export const OneSelected: Story = {
  render: () => <TopicFilter initial={['love']} />,
};

export const SeveralSelected: Story = {
  render: () => <TopicFilter initial={['family', 'love', 'hope']} />,
};

export const AllSelected: Story = {
  render: () => <TopicFilter initial={TOPICS.map(([value]) => value)} />,
};

// Eight of twelve selected in a 24rem control: the leading chips that fit, then the count.
// Resize the viewport or the container to watch the count follow the width.
export const Overflow: Story = {
  render: () => (
    <TopicFilter
      width={'24rem'}
      initial={[
        'family',
        'love',
        'loss',
        'hope',
        'work',
        'travel',
        'nature',
        'protest',
      ]}
    />
  ),
};

// A 12rem control holds no chip beside the reserved controls: a count-only display, still on
// one line, with every selection reachable through the dropdown.
export const NarrowWidth: Story = {
  render: () => (
    <TopicFilter width={'12rem'} initial={['family', 'love', 'hope']} />
  ),
};

// English and German labels at the lengths translation actually produces: chips truncate
// while their removal names stay complete; rows in the dropdown wrap instead of widening it.
export const LongLabels: Story = {
  render: () => (
    <TopicFilter
      options={LONG_TOPICS}
      initial={['long-distance', 'nachhaltigkeit', 'donau']}
    />
  ),
};

export const German: Story = {
  render: () => (
    <TopicFilter
      options={GERMAN_TOPICS}
      wording={GERMAN_WORDING}
      initial={['family', 'love']}
    />
  ),
};

// External clear and restore act on the consumer's state source alone: chips and checks update
// silently - open the dropdown first to watch - and the proposal log below records no event.
const ClearAndRestoreExample: FunctionComponent = () => {
  const [source, setSource] = useState<
    BehaviorSubject<readonly string[]> | undefined
  >(undefined);
  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <TopicFilter initial={['family', 'love']} onSource={setSource} />
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type={'button'} onClick={() => source?.next([])}>
          Clear externally
        </button>
        <button
          type={'button'}
          onClick={() => source?.next(['family', 'love', 'protest'])}
        >
          Restore Family, Love, Protest
        </button>
      </div>
    </div>
  );
};

export const ClearAndRestore: Story = {
  render: () => <ClearAndRestoreExample />,
};

export const Disabled: Story = {
  render: () => <TopicFilter initial={['family', 'love', 'hope']} disabled />,
};

// Options translate, reorder and shrink under a retained selection: identity keeps the chips
// and checks, the new order re-sorts them, and a removed option leaves with its identity
// because the consumer reconciles its own state in the same update - nothing is emitted.
const OptionUpdatesExample: FunctionComponent = () => {
  const [selected$] = useState(
    () => new BehaviorSubject<readonly string[]>(['family', 'love', 'hope']),
  );
  const [onChange$] = useState(() => new Subject<readonly string[]>());
  const [options, setOptions] = useState<readonly Topic[]>(TOPICS);
  useEffect(() => {
    const subscription = onChange$.subscribe((next) => selected$.next(next));
    return () => subscription.unsubscribe();
  }, [onChange$, selected$]);
  const removeHope = () => {
    setOptions((current) => current.filter(([value]) => value !== 'hope'));
    selected$.next(selected$.getValue().filter((value) => value !== 'hope'));
  };
  return (
    <div style={{ display: 'grid', gap: '1rem', width: '28rem' }}>
      <MultiSelect.Root
        label={'Main topics'}
        selected$={selected$}
        onChange$={onChange$}
        emptyLabel={'No topics selected'}
        removeLabel={'Remove {label}'}
        clearLabel={'Clear topics'}
        overflowLabel={'+{count}'}
      >
        {options.map(([value, label]) => (
          <MultiSelect.Option key={value} value={value}>
            {label}
          </MultiSelect.Option>
        ))}
      </MultiSelect.Root>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button type={'button'} onClick={() => setOptions(GERMAN_TOPICS)}>
          Translate to German
        </button>
        <button
          type={'button'}
          onClick={() => setOptions((current) => [...current].reverse())}
        >
          Reverse order
        </button>
        <button type={'button'} onClick={removeHope}>
          Remove Hope and reconcile
        </button>
        <button type={'button'} onClick={() => setOptions(TOPICS)}>
          Reset options
        </button>
      </div>
    </div>
  );
};

export const OptionUpdates: Story = {
  render: () => <OptionUpdatesExample />,
};

// The control sits at the bottom of the viewport, so the dropdown opens above it and is capped
// to the room it has there.
export const NearViewportBottom: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'flex-end',
        padding: '1rem',
        boxSizing: 'border-box',
      }}
    >
      <TopicFilter initial={['family', 'love']} />
    </div>
  ),
};

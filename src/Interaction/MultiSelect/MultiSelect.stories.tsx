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
          "Compose MultiSelect.Root with MultiSelect.Option children for a consumer-controlled dropdown that selects zero, one or several options independently. Root renders the latest `selected$` emission - a replaying source such as a BehaviorSubject restores the state on remount - and emits one fresh full proposal on `onChange$` per toggle, chip removal or clear-all, in option order and without duplicates; the consumer feeds accepted proposals back into `selected$`. Rendering, opening, closing, option updates and source replacement never emit. The closed control stays on one line: chips that fit, then a `+N` count whose activation opens the dropdown; the dropdown floats over the page, opens above when the viewport below is too short, and scrolls. All wording is the caller's: `emptyLabel`, `removeLabel` (`{label}`), `clearLabel`, `overflowLabel` (`{count}`), the optional `hint` and every option label." +
          '\n\n' +
          "`MultiSelect` is a compound namespace for selecting zero, one or several options\nindependently from a finite set: `MultiSelect.Root` renders a labelled one-line dropdown\ntrigger with the selected options as individually removable chips, a count for the chips\nthat do not fit, and a clear-all control; `MultiSelect.Option` renders one checkable row in\nthe dropdown. The consumer owns the options, the selection, every word and what the selected\nset means; the library owns the control, the selection semantics, focus and the presentation.\n\n```tsx\nimport { MultiSelect } from '@juwel-development/design-system';\nimport { BehaviorSubject, Subject } from 'rxjs';\n\nconst topics$ = new BehaviorSubject<readonly string[]>([]);\nconst topicChange$ = new Subject<readonly string[]>();\ntopicChange$.subscribe((next) => topics$.next(next));\n\n<MultiSelect.Root\n  label={'Main topics'}\n  selected$={topics$}\n  onChange$={topicChange$}\n  emptyLabel={'No topics selected'}\n  removeLabel={'Remove {label}'}\n  clearLabel={'Clear topics'}\n  overflowLabel={'+{count}'}\n  hint={'Songs match any selected topic.'}\n>\n  <MultiSelect.Option value={'family'}>{'Family'}</MultiSelect.Option>\n  <MultiSelect.Option value={'love'}>{'Love'}</MultiSelect.Option>\n</MultiSelect.Root>;\n```\n\nThe same control in German changes only the caller's wording:\n\n```tsx\n<MultiSelect.Root\n  label={'Hauptthemen'}\n  selected$={topics$}\n  onChange$={topicChange$}\n  emptyLabel={'Keine Themen ausgewählt'}\n  removeLabel={'{label} entfernen'}\n  clearLabel={'Themen zurücksetzen'}\n  overflowLabel={'{count} weitere'}\n>\n  <MultiSelect.Option value={'family'}>{'Familie'}</MultiSelect.Option>\n  <MultiSelect.Option value={'love'}>{'Liebe'}</MultiSelect.Option>\n</MultiSelect.Root>;\n```\n\n`Root` requires `label`, `selected$`, `onChange$`, `emptyLabel`, `removeLabel`, `clearLabel`\nand `overflowLabel`; `hint`, `disabled`, `testId` and `children` are optional. Each `Option`\nrequires a unique, stable string `value` and a text-only `children` label, and accepts a\n`testId`. Options are direct children of `Root`; arrays and fragments are supported. The\nwording contract is closed: `removeLabel` replaces `{label}` with the option's label to name a\nchip's removal control, and `overflowLabel` replaces `{count}` with the number of selected\noptions hidden behind the count. There are no callback props and no built-in English; a\nmissing `hint` renders nothing.\n\n**Streams.** `selected$` is a read-only `Observable<readonly string[]>` of the current\nselection. Root renders the latest emission and nothing else: empty before the first\nemission, empty again while a replaced source has not yet emitted, and updated silently on\nevery emission whether the dropdown is open, closed or disabled. Use a replaying source such\nas a `BehaviorSubject` or `ReplaySubject(1)` so a remounted control shows the current state\nat once. `onChange$` is a `Subject<readonly string[]>` that receives one fresh full proposed\nselection per user edit - a toggle, a chip removal or clear-all - ordered by option order,\nwithout duplicates and holding only supplied identities. Handed-in arrays are never mutated.\nRendering, opening, closing, option updates, source replacement and `selected$` emissions\nnever emit. Feed accepted proposals back into `selected$` immediately for ordinary\ninteraction; an unanswered proposal leaves the selection unchanged, and repeating the edit\nrepeats the proposal. Root subscribes only to `selected$`, unsubscribes on replacement and\nunmount, and never completes either stream or assigns behaviour to their errors or completion.\n\n**Caller obligations.** Keep option identities stable across reordering and translation, so\nselection is preserved by identity; map options with the value as the React key. `selected$`\nnames supplied identities only: when an update removes options, remove their identities from\nthe selection in the same logical update. MultiSelect prunes nothing, invents nothing and\nemits no synthetic change to reconcile invalid input.\n\n**Behaviour.** The closed control stays on one line at every width: the leading chips that\nfit are shown in option order, the rest are counted by `overflowLabel`, and at narrow widths\nonly the count remains. Overflow is recalculated on width, label and selection changes\nwithout touching the selection; activating the count opens the dropdown, so every selection\nstays reachable. Long chip labels truncate visually while the removal control keeps the full\nname. The dropdown floats over the page on the shared `--elevation-floating` role, opens above\nthe control when the viewport below cannot hold it, is capped to the room it has and scrolls\nits options. `disabled` keeps the selection visible, closes an open dropdown, disables every\ncontrol and emits nothing. With no options the dropdown opens empty.\n\n**Keyboard and accessibility.** The visible label names the trigger and the option group; the\ntrigger exposes `aria-expanded` and, while open, `aria-controls`. Each option is a\n`role=\"checkbox\"` button with `aria-checked` and a tick that does not depend on colour. Enter,\nSpace or ArrowDown on the closed trigger opens the dropdown and focuses the first selected\noption, or the first option; with no options focus stays on the trigger. Tab and Shift+Tab\ntraverse chips, clear-all and options normally with no focus trap; Space toggles a focused\noption. Escape closes and returns focus to the trigger. Focus leaving the whole control, an\noutside pointer interaction and the trigger itself close the dropdown without moving focus or\nemitting. Chip removals and clear-all are named, non-submitting buttons outside the trigger:\na removal that takes its own focused control away moves focus to the next visible removal,\nthen the preceding one, then the trigger; clear-all returns focus to the trigger; a chip hidden\nby overflow while focused hands focus to the trigger. This is a consumer-controlled selection\ncontrol, not a form field: it has no `name`, native submission, reset or validation.",
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

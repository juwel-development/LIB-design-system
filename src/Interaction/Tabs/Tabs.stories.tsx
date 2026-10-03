import { Stack } from 'Arrangement/Stack/Stack';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  type ComponentProps,
  type FunctionComponent,
  type ReactNode,
  useEffect,
  useState,
} from 'react';
import { Subject } from 'rxjs';
import { Tabs } from './Tabs';

const meta: Meta<typeof Tabs.Root> = {
  title: 'Interaction/Tabs',
  component: Tabs.Root,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'A few named views sharing one surface, composed from `Tabs.Root`, `Tabs.List`, `Tabs.Tab` and `Tabs.Panel`. Controlled: the consumer owns the active key, answers `onSelect$`, and supplies every label and view.',
          '',
          "**Labels.** A tab's label is the consumer's content: a text name, optionally with an icon, a count or inline emphasis beside it. The whole label is rendered - never clipped, shortened, elided or replaced by a tooltip - and the tab's accessible name is computed from it. Mark decorative parts (an icon that repeats the text) `aria-hidden` so they stay out of the name; a count or an emphasis is meaning and stays in. No part of a label may be interactive: no link, button or input inside a tab, since the tab is the control.",
          '',
          "**Width.** The controls stay on one line. As the space narrows, a label's text wraps inside its tab down to its longest word; only when the controls still cannot fit does the row scroll horizontally - the row, never the page. Focusing a scrolled-off tab reveals it, so every tab is reachable by keyboard, and the focus ring survives the scroll clip. Reach for no truncation or responsive collapsing: a long translation is the row's to accommodate.",
          '',
          '**Separation.** Tabs sets no spacing between the row and the view. Put a `Stack` between `Tabs.Root` and its members - `<Tabs.Root><Stack gap="region"><Tabs.List/>…<Tabs.Panel/>…</Stack></Tabs.Root>`: `gap="stack"` holds the row and its view together as one block, `gap="region"` sets the view apart as a region of its own. Inactive panels are hidden, so the gap is exactly one whichever panel is active. The members need not be direct children of `Root`; the tabs must stay direct children of the `List`.',
        ].join('\n'),
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    active: {
      control: false,
      description:
        'The key of the active tab; the consumer owns it and answers selection requests',
    },
    onSelect$: {
      control: false,
      description: 'Subject that emits the selected key on click or arrow keys',
    },
    label: {
      control: { type: 'text' },
      description: "The tab list's accessible name",
    },
    testId: {
      control: { type: 'text' },
      description: 'Test ID for automated testing',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

type View = { value: string; label: ReactNode; content: string };

// The controlled wiring every consumer repeats: hold the active key, subscribe it to the Subject,
// and switch the panels' content with it. Tabs itself never selects. `gap` is the separation
// contract - a Stack between Root and its members puts that one space role between row and view.
const ControlledTabs: FunctionComponent<{
  label: string;
  views: View[];
  gap?: ComponentProps<typeof Stack>['gap'];
}> = ({ label, views, gap }) => {
  const [active, setActive] = useState(views[0]?.value ?? '');
  const [onSelect$] = useState(() => new Subject<string>());
  useEffect(() => {
    const subscription = onSelect$.subscribe(setActive);
    return () => subscription.unsubscribe();
  }, [onSelect$]);
  const members = (
    <>
      <Tabs.List>
        {views.map((view) => (
          <Tabs.Tab key={view.value} value={view.value}>
            {view.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {views.map((view) => (
        <Tabs.Panel key={view.value} value={view.value}>
          <Stack>
            <p>{view.content}</p>
            <button type={'button'}>An action inside the view</button>
          </Stack>
        </Tabs.Panel>
      ))}
    </>
  );
  return (
    <Tabs.Root active={active} onSelect$={onSelect$} label={label}>
      {gap === undefined ? members : <Stack gap={gap}>{members}</Stack>}
    </Tabs.Root>
  );
};

const shortViews: View[] = [
  {
    value: 'staff',
    label: 'Staff',
    content:
      'The working staff view. Switching away unmounts it; switching back mounts it fresh.',
  },
  {
    value: 'candidates',
    label: 'Candidates',
    content: 'The candidate list, filled entirely by the consumer.',
  },
  {
    value: 'alumni',
    label: 'Alumni',
    content:
      'Who has left the label - a third view, so first, middle and last are distinct.',
  },
];

// A decorative mark beside a label: it repeats the text, so the consumer hides it from the name.
const Dot: FunctionComponent = () => (
  <svg
    aria-hidden={'true'}
    width={'0.6em'}
    height={'0.6em'}
    viewBox={'0 0 10 10'}
    style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.4em' }}
  >
    <circle cx={5} cy={5} r={5} fill={'currentColor'} />
  </svg>
);

// Rich labels as a consuming product composes them: an icon the name does without, a count that
// belongs to the name, an emphasis - every part non-interactive, inside the one control.
const richViews: View[] = [
  {
    value: 'staff',
    label: (
      <>
        <Dot />
        Staff <em>12</em>
      </>
    ),
    content: 'Twelve people under contract; the count is part of the tab name.',
  },
  {
    value: 'candidates',
    label: (
      <>
        <Dot />
        Candidates <em>3</em>
      </>
    ),
    content: 'Three open applications.',
  },
  {
    value: 'alumni',
    label: 'Alumni',
    content: 'A plain string label beside the rich ones - the same control.',
  },
];

// Translated labels as a consuming product renders them: long compounds in German, each a view
// name rather than an action, none of them shortened for the row.
const translatedViews: View[] = [
  {
    value: 'staff',
    label: 'Festangestellte Mitarbeiterinnen und Mitarbeiter',
    content: 'Die Belegschaft mit Rolle, Fähigkeit und Wochenlohn.',
  },
  {
    value: 'candidates',
    label: 'Kandidatinnen und Kandidaten für offene Stellen',
    content: 'Alle Bewerbungen, nach Rolle gefiltert.',
  },
  {
    value: 'market',
    label: 'Marktforschungsberichte der laufenden Saison',
    content: 'Die fünf Märkte mit Fokus und Bericht.',
  },
  {
    value: 'alumni',
    label: 'Ehemalige',
    content: 'Wer das Label verlassen hat.',
  },
];

const englishViews: View[] = [
  {
    value: 'staff',
    label: 'Permanently employed staff members',
    content: 'Everyone under contract, with role, proficiency and weekly wage.',
  },
  {
    value: 'candidates',
    label: 'Candidates for the open positions',
    content: 'All applications, filtered by role.',
  },
  {
    value: 'market',
    label: 'Market research reports of the current season',
    content: 'The five markets with focus and report.',
  },
  {
    value: 'alumni',
    label: 'Alumni',
    content: 'Who has left the label.',
  },
];

// One compound a 24rem column cannot hold even after wrapping: the row's longest word.
const unbrokenViews: View[] = [
  {
    value: 'summary',
    label: 'Marktforschungsberichtszusammenfassung',
    content:
      'Ein Wort breiter als der Platz: die Zeile scrollt, nichts wird gekürzt.',
  },
  ...translatedViews.slice(1),
];

export const Controlled: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Short labels, the common case: one line, nothing to scroll, the active view below.',
      },
    },
  },
  render: () => <ControlledTabs label={'Staff'} views={shortViews} />,
};

export const RichLabels: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Labels with an icon and a count beside the text, and a plain string beside them. The icon repeats the text, so the consumer marks it `aria-hidden` and it stays out of the name; the count is meaning and stays in - the second tab is named "Candidates 3". Every part is non-interactive and clicking any of it selects the one tab.',
      },
    },
  },
  render: () => <ControlledTabs label={'Staff'} views={richViews} />,
};

export const LongLabels: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Translated labels in a 44rem column, narrower than the labels run on one line: each label wraps inside its tab, the controls stay on one line and share one height, so the markers sit on one line, and nothing is clipped, shortened or scrolled away. A tab shrinks no further than its longest word; the row scrolls only once even those do not fit - see Overflow.',
      },
    },
  },
  render: () => (
    <div style={{ maxWidth: '44rem' }}>
      <ControlledTabs label={'Saison'} views={translatedViews} />
    </div>
  ),
};

export const Overflow: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'An unbroken compound wider than the space its tab can shrink to: the row scrolls horizontally - the row, never the page - and the word stays whole. Overflow is an accommodation, not a tab strip: nothing closes, reorders or collapses, and focusing a scrolled-off tab reveals it with its focus ring intact.',
      },
    },
  },
  render: () => (
    <div style={{ maxWidth: '24rem' }}>
      <ControlledTabs label={'Saison'} views={unbrokenViews} />
    </div>
  ),
};

export const SeparationStack: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The separation contract at the stack gap: a `Stack gap="stack"` between `Tabs.Root` and its members holds the row and its view together as one block, one sibling gap apart. Inactive panels are hidden, so the gap stays exactly one whichever tab is active. Compare with Controlled, where the view sits directly under the row.',
      },
    },
  },
  render: () => (
    <ControlledTabs label={'Staff'} views={shortViews} gap={'stack'} />
  ),
};

export const SeparationRegion: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The separation contract at the region gap: a `Stack gap="region"` sets the view apart as a region of its own, from the same token the surrounding groups use - the composition the consuming product asks for between its tab strip and its content.',
      },
    },
  },
  render: () => (
    <ControlledTabs label={'Staff'} views={shortViews} gap={'region'} />
  ),
};

export const KeyboardNavigation: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tab into the list: focus lands on the active tab. Left and Right move focus to the neighbouring tab, wrapping at either end, and select it at once; focus stays on the tab and a scrolled-off tab scrolls into view. Tab again reaches the active panel, then the action inside it. The focus ring and the selection marker are separate marks.',
      },
    },
  },
  render: () => (
    <div style={{ maxWidth: '32rem' }}>
      <ControlledTabs label={'Saison'} views={unbrokenViews} gap={'region'} />
    </div>
  ),
};

// A real narrow window, locked through the viewport global rather than a frame inside a wide one:
// the width the story is about is the viewport's.
export const NarrowDesktop: Story = {
  globals: { viewport: { value: 'narrowDesktop', isRotated: false } },
  parameters: {
    viewport: {
      options: {
        narrowDesktop: {
          name: 'Narrow desktop',
          styles: { width: '900px', height: '700px' },
          type: 'desktop',
        },
      },
    },
    docs: {
      description: {
        story:
          'A narrow desktop window as a consuming product sees it: an English and a German row in the content column a sidebar leaves, labels wrapping inside their tabs onto a second line, the controls still one row, and the region gap separating each row from its view. Nothing is clipped and nothing scrolls sideways.',
      },
    },
  },
  render: () => (
    <Stack gap={'region'}>
      <ControlledTabs label={'Staff'} views={englishViews} gap={'region'} />
      <ControlledTabs
        label={'Personal'}
        views={translatedViews}
        gap={'region'}
      />
    </Stack>
  ),
};

import { Stack } from 'Arrangement/Stack/Stack';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type FunctionComponent, useEffect, useState } from 'react';
import { Subject } from 'rxjs';
import { Tabs } from './Tabs';

const meta: Meta<typeof Tabs.Root> = {
  title: 'Interaction/Tabs',
  component: Tabs.Root,
  parameters: {
    layout: 'padded',
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

type View = { value: string; label: string; content: string };

// The controlled wiring every consumer repeats: hold the active key, subscribe it to the Subject,
// and switch the panels' content with it. Tabs itself never selects. `separated` is the separation
// contract - a Stack between Root and its members puts one region gap between the row and the view.
const ControlledTabs: FunctionComponent<{
  label: string;
  views: View[];
  overflow?: 'scroll' | 'wrap';
  separated?: boolean;
}> = ({ label, views, overflow, separated }) => {
  const [active, setActive] = useState(views[0]?.value ?? '');
  const [onSelect$] = useState(() => new Subject<string>());
  useEffect(() => {
    const subscription = onSelect$.subscribe(setActive);
    return () => subscription.unsubscribe();
  }, [onSelect$]);
  const members = (
    <>
      <Tabs.List overflow={overflow}>
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
      {separated ? <Stack gap={'region'}>{members}</Stack> : members}
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

export const Overflow: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Long labels in a narrow column with the default `overflow="scroll"`: the row stays one line and scrolls horizontally. Overflow is an accommodation, not a tab strip - nothing closes, reorders or collapses, and focusing a scrolled-off tab reveals it.',
      },
    },
  },
  render: () => (
    <div style={{ maxWidth: '24rem' }}>
      <ControlledTabs label={'Season'} views={translatedViews} />
    </div>
  ),
};

export const LongLabels: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The same translated labels with `overflow="wrap"`: the row breaks onto further lines, every tab stays in view, and a label wider than the row breaks across lines instead of being clipped, shortened or scrolled away.',
      },
    },
  },
  render: () => (
    <div style={{ maxWidth: '24rem' }}>
      <ControlledTabs
        label={'Season'}
        views={translatedViews}
        overflow={'wrap'}
      />
    </div>
  ),
};

export const Separation: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The separation contract: a `Stack gap="region"` between `Tabs.Root` and its members puts one region gap between the row and the view, from the same token the surrounding groups use. Inactive panels are hidden, so the gap stays exactly one. Compare with Controlled, where the view sits directly under the row.',
      },
    },
  },
  render: () => (
    <ControlledTabs label={'Staff'} views={shortViews} separated={true} />
  ),
};

export const KeyboardNavigation: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tab into the list: focus lands on the active tab. Left and Right move focus to the neighbouring tab, wrapping at either end, and select it at once; focus stays on the tab. Tab again reaches the active panel, then the action inside it. The focus ring and the selection marker are separate marks, and the behaviour is identical with the row wrapped.',
      },
    },
  },
  render: () => (
    <Stack gap={'region'}>
      <ControlledTabs
        label={'Staff'}
        views={translatedViews}
        separated={true}
      />
      <div style={{ maxWidth: '32rem' }}>
        <ControlledTabs
          label={'Season'}
          views={translatedViews}
          overflow={'wrap'}
          separated={true}
        />
      </div>
    </Stack>
  ),
};

export const NarrowDesktop: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A narrow desktop window as a consuming product sees it: a 50rem content frame beside a sidebar, translated labels wrapping onto a second line, and the region gap separating the row from the view. Nothing is clipped and nothing scrolls sideways.',
      },
    },
  },
  render: () => (
    <div style={{ maxWidth: '50rem' }}>
      <ControlledTabs
        label={'Personal'}
        views={translatedViews}
        overflow={'wrap'}
        separated={true}
      />
    </div>
  ),
};

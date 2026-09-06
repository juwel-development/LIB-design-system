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

// The controlled wiring every consumer repeats: hold the active key, subscribe it to the Subject,
// and switch the panels' content with it. Tabs itself never selects.
const ControlledExample: FunctionComponent = () => {
  const [active, setActive] = useState('staff');
  const [onSelect$] = useState(() => new Subject<string>());
  useEffect(() => {
    const subscription = onSelect$.subscribe(setActive);
    return () => subscription.unsubscribe();
  }, [onSelect$]);
  return (
    <Tabs.Root active={active} onSelect$={onSelect$} label={'Staff'}>
      <Tabs.List>
        <Tabs.Tab value={'staff'}>Staff</Tabs.Tab>
        <Tabs.Tab value={'candidates'}>Candidates</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value={'staff'}>
        The working staff view. Switching away unmounts it; switching back
        mounts it fresh.
      </Tabs.Panel>
      <Tabs.Panel value={'candidates'}>
        The candidate list, filled entirely by the consumer.
      </Tabs.Panel>
    </Tabs.Root>
  );
};

export const Controlled: Story = {
  render: () => <ControlledExample />,
};

// Long labels in a narrow column: the row stays a single line and scrolls horizontally. Overflow
// is an accommodation, not a tab strip - nothing closes, reorders or collapses.
const OverflowExample: FunctionComponent = () => {
  const [active, setActive] = useState('overview');
  const [onSelect$] = useState(() => new Subject<string>());
  useEffect(() => {
    const subscription = onSelect$.subscribe(setActive);
    return () => subscription.unsubscribe();
  }, [onSelect$]);
  const views = [
    { value: 'overview', label: 'Overview of the season' },
    { value: 'staff', label: 'Permanent staff members' },
    { value: 'candidates', label: 'Labor market candidates' },
    { value: 'alumni', label: 'Alumni and former hires' },
  ];
  return (
    <div style={{ maxWidth: '24rem' }}>
      <Tabs.Root active={active} onSelect$={onSelect$} label={'Season'}>
        <Tabs.List>
          {views.map((view) => (
            <Tabs.Tab key={view.value} value={view.value}>
              {view.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {views.map((view) => (
          <Tabs.Panel key={view.value} value={view.value}>
            {view.label}
          </Tabs.Panel>
        ))}
      </Tabs.Root>
    </div>
  );
};

export const Overflow: Story = {
  render: () => <OverflowExample />,
};

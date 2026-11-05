import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  Choices,
  Cluster,
  FieldRow,
  H1,
  Header,
  Input,
  Note,
  Pane,
  Screen,
  Shell,
  Sidebar,
  Stack,
  Table,
  Tabs,
} from 'index';
import { useEffect, useState } from 'react';
import { Subject } from 'rxjs';

const meta: Meta<typeof Choices.Root> = {
  title: 'Interaction/Choices Filter',
  component: Choices.Root,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `A visible single-choice filter in a consumer-style head: Shell → Sidebar fill → Screen heading → Tabs fill → Pane. Choices is the first logical head row; search/Clear/count is the second. Five direct Choice children use arrangement="wrapping" with optional descriptions omitted. The consumer owns the selected value, filtering and all translated words. No layout wrapper belongs between Root and Choice; arrays and fragments are supported.

At 1280×720 this composition allocates 892 CSS pixels to Choices, matching the recorded g-label-manager #316 head allocation (not the viewport width). The five English/German labels fit one content-sized row. Narrow space wraps whole choices in declared order; long text wraps inside a choice. Down/Right move to the next declared option, Up/Left to the previous, including across visual line breaks and at either end. Tab enters at the selected option. Choice is a non-submitting radio button, not a tab or navigation link.

The default arrangement remains vertical and descriptions remain supported in both arrangements. Use the Choices stories for described, long-text and inert groups. Source changes are unreleased; 4.1.0 is the published baseline inspected for #156 and does not support this capability. Adopt only after a release containing #156 has actually been published; no future version is promised here.`,
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

const roles = [
  { value: 'all', english: 'All', german: 'Alle' },
  { value: 'ar', english: 'A&R', german: 'A&R' },
  { value: 'research', english: 'Market Research', german: 'Marktforschung' },
  { value: 'songwriting', english: 'Songwriting', german: 'Songwriting' },
  { value: 'producer', english: 'Producer', german: 'Produzent' },
];

const FilterExample = ({ german = false }: { german?: boolean }) => {
  const [selected, setSelected] = useState('all');
  const [onSelect$] = useState(() => new Subject<string>());
  const [navigate$] = useState(() => new Subject<string>());
  const [clear$] = useState(() => new Subject<void>());
  const [search$] = useState(() => new Subject<string>());
  const [query, setQuery] = useState('');
  useEffect(() => {
    const selection = onSelect$.subscribe(setSelected);
    const search = search$.subscribe(setQuery);
    const clear = clear$.subscribe(() => {
      setSelected('all');
      setQuery('');
    });
    return () => {
      selection.unsubscribe();
      search.unsubscribe();
      clear.unsubscribe();
    };
  }, [onSelect$, search$, clear$]);
  const visible = roles
    .slice(1)
    .filter(
      (role) =>
        (selected === 'all' || role.value === selected) &&
        role[german ? 'german' : 'english']
          .toLowerCase()
          .includes(query.toLowerCase()),
    );
  return (
    <Shell
      ariaLabel="Application body"
      bar={
        <Header
          status={german ? 'Personalverwaltung' : 'Staff management'}
          action={<Note>EN / DE</Note>}
        />
      }
    >
      <Sidebar.Root
        fill
        active="staff"
        onSelect$={navigate$}
        label={german ? 'Bereiche' : 'Sections'}
      >
        <Sidebar.Item entryKey="staff">
          {german ? 'Personal' : 'Staff'}
        </Sidebar.Item>
        <Sidebar.Content>
          <Screen heading={<H1>{german ? 'Personal' : 'Staff'}</H1>}>
            <Tabs.Root
              fill
              active="candidates"
              onSelect$={navigate$}
              label={german ? 'Personalansichten' : 'Staff views'}
            >
              <Tabs.List>
                <Tabs.Tab value="candidates">
                  {german ? 'Kandidaten' : 'Candidates'}
                </Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="candidates">
                <Pane.Root name={german ? 'Kandidaten' : 'Candidates'}>
                  <Pane.Head testId="filter-head">
                    <Stack>
                      <Choices.Root
                        arrangement="wrapping"
                        selected={selected}
                        onSelect$={onSelect$}
                        label={german ? 'Rolle' : 'Preferred role'}
                      >
                        {roles.map((role) => (
                          <Choices.Choice key={role.value} value={role.value}>
                            {role[german ? 'german' : 'english']}
                          </Choices.Choice>
                        ))}
                      </Choices.Root>
                      <Cluster gap="stack" testId="search-clear-count">
                        <FieldRow.Root>
                          <FieldRow.Field minWidth="--control-min-width">
                            <Input
                              label={
                                german
                                  ? 'Kandidaten suchen'
                                  : 'Search candidates'
                              }
                              name="candidates-search"
                              onInput$={search$}
                              reset$={clear$}
                            />
                          </FieldRow.Field>
                          <FieldRow.Actions>
                            <Button variant="ghost" onClick$={clear$}>
                              {german ? 'Zurücksetzen' : 'Clear'}
                            </Button>
                          </FieldRow.Actions>
                        </FieldRow.Root>
                        <Note>{`${visible.length} / 4`}</Note>
                      </Cluster>
                    </Stack>
                  </Pane.Head>
                  <Pane.Body ariaLabel="Candidates" scrollOwner="child">
                    <Table.Root
                      bounded
                      caption={
                        german
                          ? 'Verfügbare Kandidaten'
                          : 'Available candidates'
                      }
                      columns={[{ weight: 1 }]}
                    >
                      <Table.Head>
                        <Table.Row>
                          <Table.HeaderCell scope="col">
                            {german ? 'Bevorzugte Rolle' : 'Preferred role'}
                          </Table.HeaderCell>
                        </Table.Row>
                      </Table.Head>
                      <Table.Body>
                        {visible.map((role) => (
                          <Table.Row key={role.value}>
                            <Table.Cell>
                              {role[german ? 'german' : 'english']}
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                  </Pane.Body>
                </Pane.Root>
              </Tabs.Panel>
            </Tabs.Root>
          </Screen>
        </Sidebar.Content>
      </Sidebar.Root>
    </Shell>
  );
};

export const English: Story = { render: () => <FilterExample /> };
export const German: Story = { render: () => <FilterExample german /> };

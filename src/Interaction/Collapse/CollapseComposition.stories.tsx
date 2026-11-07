import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  Cluster,
  Collapse,
  FieldRow,
  H1,
  H2,
  Header,
  Input,
  Note,
  NumberInput,
  Pane,
  Screen,
  Select,
  Shell,
  Table,
} from 'index';
import type { CSSProperties, FunctionComponent } from 'react';

const meta: Meta<typeof Collapse> = {
  title: 'Interaction/Collapse Composition',
  component: Collapse,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `Collapse in the head of a Screen's bounded Pane: filter fields above a bounded Table body and a fixed foot. A representative composition built from this library's components, not any application's screen.

Collapsed, the head holds the heading and the summary, and the table keeps the rest of the pane's height as its one scroll owner. Expanding grows the head by the filter rows; the pane re-measures without any registration, and the table shrinks. Where the head, foot and one readable table row no longer fit - a short or narrow holder with the filters open - Screen's existing whole-content fallback releases the bound, so everything grows into the Shell body, which becomes the only scroll owner. Collapsing again restores the bound. Neither direction remounts the fields or the table, so typed filter values and focus survive.

\`scripts/browser/collapse.mjs\` records this geometry at 1920×1080, 1280×720 and narrower holders; \`docs/verification/170-collapse.md\` holds the results.`,
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;
type Language = 'en' | 'de';

const filterTheme = {
  '--filter-name-min-width': '12rem',
  '--filter-genre-min-width': '10rem',
  '--filter-quality-min-width': '9rem',
} as CSSProperties;

const copy = {
  en: {
    bar: 'Label workspace',
    body: 'Workspace body',
    heading: 'Artist roster',
    pane: 'Artists',
    summary: 'Filters · 2 active',
    name: 'Name contains',
    genre: 'Genre',
    anyGenre: 'Any genre',
    genres: ['Jazz', 'Soul'],
    quality: 'Minimum song quality',
    contract: 'Contract status',
    anyContract: 'Any status',
    contracts: ['Signed', 'Unsigned'],
    caption: 'Artists matching the filters',
    artist: 'Artist',
    action: 'Action',
    open: (entry: number) => `Open artist ${entry}`,
    count: '40 artists',
    add: 'Add an artist',
  },
  de: {
    bar: 'Arbeitsbereich des Labels',
    body: 'Arbeitsbereich',
    heading: 'Künstlerliste',
    pane: 'Künstler',
    summary: 'Filter · 2 aktiv',
    name: 'Name enthält',
    genre: 'Genre',
    anyGenre: 'Jedes Genre',
    genres: ['Jazz', 'Soul'],
    quality: 'Mindestqualität der Songs',
    contract: 'Vertragsstatus',
    anyContract: 'Jeder Status',
    contracts: ['Unter Vertrag', 'Ohne Vertrag'],
    caption: 'Künstler, die den Filtern entsprechen',
    artist: 'Künstler',
    action: 'Aktion',
    open: (entry: number) => `Künstler ${entry} öffnen`,
    count: '40 Künstler',
    add: 'Künstler hinzufügen',
  },
};
const entries = Array.from({ length: 40 }, (_, index) => index + 1);

const ArtistRoster: FunctionComponent<{
  language: Language;
  defaultExpanded?: boolean;
}> = ({ language, defaultExpanded }) => {
  const text = copy[language];
  return (
    <Shell
      testId="shell"
      ariaLabel={text.body}
      bar={<Header status={text.bar} />}
    >
      <Screen spacing="compact" heading={<H1>{text.heading}</H1>}>
        <Pane.Root name={text.pane} testId="roster-pane">
          <Pane.Head testId="roster-head">
            <H2>{text.pane}</H2>
            <Collapse
              summary={text.summary}
              defaultExpanded={defaultExpanded}
              testId="filters"
            >
              <div style={filterTheme}>
                <FieldRow.Root>
                  <FieldRow.Field weight={2} minWidth="--filter-name-min-width">
                    <Input name="name" label={text.name} />
                  </FieldRow.Field>
                  <FieldRow.Field minWidth="--filter-genre-min-width">
                    <Select.Root
                      name="genre"
                      label={text.genre}
                      placeholder={text.anyGenre}
                    >
                      {text.genres.map((genre) => (
                        <Select.Option key={genre} value={genre}>
                          {genre}
                        </Select.Option>
                      ))}
                    </Select.Root>
                  </FieldRow.Field>
                  <FieldRow.Field minWidth="--filter-quality-min-width">
                    <NumberInput name="quality" label={text.quality} />
                  </FieldRow.Field>
                  <FieldRow.Field minWidth="--filter-genre-min-width">
                    <Select.Root
                      name="contract"
                      label={text.contract}
                      placeholder={text.anyContract}
                    >
                      {text.contracts.map((contract) => (
                        <Select.Option key={contract} value={contract}>
                          {contract}
                        </Select.Option>
                      ))}
                    </Select.Root>
                  </FieldRow.Field>
                </FieldRow.Root>
              </div>
            </Collapse>
          </Pane.Head>
          <Pane.Body scrollOwner="child" ariaLabel={text.caption}>
            <Table.Root
              bounded
              caption={text.caption}
              columns={[{ weight: 2 }, { weight: 1 }]}
              testId="roster-table"
            >
              <Table.Head>
                <Table.Row>
                  <Table.HeaderCell scope="col">{text.artist}</Table.HeaderCell>
                  <Table.HeaderCell scope="col">{text.action}</Table.HeaderCell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {entries.map((entry) => (
                  <Table.Row key={entry}>
                    <Table.HeaderCell scope="row">{`${text.artist} ${entry}`}</Table.HeaderCell>
                    <Table.Cell>
                      <Button variant="plain">{text.open(entry)}</Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Pane.Body>
          <Pane.Foot testId="roster-foot">
            <Cluster gap="stack" justify="between">
              <Note color="muted">{text.count}</Note>
              <Button>{text.add}</Button>
            </Cluster>
          </Pane.Foot>
        </Pane.Root>
      </Screen>
    </Shell>
  );
};

/** Filters collapsed, as a consumer would usually start. */
export const ArtistRosterEnglish: Story = {
  render: () => <ArtistRoster language="en" />,
};
export const ArtistRosterGerman: Story = {
  render: () => <ArtistRoster language="de" />,
};
/** Filters starting open. */
export const ArtistRosterExpandedEnglish: Story = {
  render: () => <ArtistRoster language="en" defaultExpanded />,
};
export const ArtistRosterExpandedGerman: Story = {
  render: () => <ArtistRoster language="de" defaultExpanded />,
};

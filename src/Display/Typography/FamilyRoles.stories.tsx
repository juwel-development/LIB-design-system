import { Cluster } from 'Arrangement/Cluster/Cluster';
import { Stack } from 'Arrangement/Stack/Stack';
import { Checklist } from 'Display/Checklist/Checklist';
import { DefinitionList } from 'Display/DefinitionList/DefinitionList';
import { Table } from 'Display/Table/Table';
import { Eyebrow } from 'Display/Typography/Eyebrow/Eyebrow';
import { H2 } from 'Display/Typography/H2/H2';
import { H3 } from 'Display/Typography/H3/H3';
import { Note } from 'Display/Typography/Note/Note';
import { P } from 'Display/Typography/P/P';
import { Prose } from 'Display/Typography/Prose/Prose';
import { Button } from 'Interaction/Button/Button';
import { Input } from 'Interaction/Input/Input';
import { Link } from 'Interaction/Link/Link';
import { Select } from 'Interaction/Select/Select';
import { PageHead } from 'Layout/PageHead/PageHead';
import { Section } from 'Layout/Section/Section';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties, FunctionComponent } from 'react';

// The family roles shown together on one representative page (#120). A story is the one place a
// consumer's theme is legitimately hand-written, so each story re-points roles on a wrapper with
// generic faces, never a product's; the markup is the same page every time and no component takes
// a face. A wrapper is a supported scope: the roles resolve on the element reading them, so a theme
// re-pointing only the two original roles still moves everything beneath it (docs/adr/0004).
type Faces = Partial<
  Record<
    | '--font-heading'
    | '--font-body'
    | '--font-primary'
    | '--font-secondary'
    | '--font-control',
    string
  >
>;

const SERIF = "Georgia, 'Iowan Old Style', 'Times New Roman', serif";
const SANS = "system-ui, 'Helvetica Neue', Arial, sans-serif";
const MONO = "ui-monospace, Menlo, Consolas, 'Liberation Mono', monospace";

const RepresentativePage: FunctionComponent = () => (
  <>
    <PageHead
      title={'Songs'}
      lede={'Every song under contract, with the markets it is selling in.'}
      intro={'Prices are weekly and in thousands.'}
    />
    <Section name={'Catalogue'}>
      <Stack gap={'region'}>
        <Stack>
          <Eyebrow>Catalogue</Eyebrow>
          <H2>Songs under contract</H2>
          <P>
            Compare entries side by side, then act on the one you need without
            leaving the list. A song that has stopped selling in every market
            can be <Link href={'#release'}>released from its contract</Link> at
            the end of the week, which frees its slot for the next signing.
          </P>
          <Cluster>
            <Link treatment={'quiet'} href={'#songs'} current={true}>
              Songs
            </Link>
            <Link treatment={'quiet'} href={'#artists'}>
              Artists
            </Link>
            <Link treatment={'quiet'} href={'#markets'}>
              Markets
            </Link>
          </Cluster>
        </Stack>
        <Cluster>
          <Input
            label={
              'Bezeichnung des Titels, wie sie auf dem Vertrag erscheint (Pflichtfeld)'
            }
            name={'title'}
            placeholder={'Beliebiger Titel'}
            hint={'Mit Interpret, falls abweichend'}
          />
          <Select.Root
            label={'Market'}
            name={'market'}
            placeholder={'Any market'}
          >
            <Select.Option value={'de'}>{'Germany'}</Select.Option>
            <Select.Option value={'gb'}>{'United Kingdom'}</Select.Option>
            <Select.Option value={'fr'}>{'France'}</Select.Option>
          </Select.Root>
          <Button variant={'secondary'}>Apply filters</Button>
        </Cluster>
        <Table.Root caption={'Songs under contract'}>
          <Table.Head>
            <Table.Row>
              <Table.HeaderCell scope={'col'}>Title</Table.HeaderCell>
              <Table.HeaderCell scope={'col'}>Artist</Table.HeaderCell>
              <Table.HeaderCell scope={'col'} align={'right'}>
                Price
              </Table.HeaderCell>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            <Table.Row>
              <Table.HeaderCell scope={'row'}>Harbour Lights</Table.HeaderCell>
              <Table.Cell>Mara Ellis</Table.Cell>
              <Table.Cell align={'right'}>12.4</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.HeaderCell scope={'row'}>Nachtzug</Table.HeaderCell>
              <Table.Cell>Die Spätvorstellung</Table.Cell>
              <Table.Cell align={'right'}>9.8</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.HeaderCell scope={'row'}>
                A Longer Title That Wraps Inside Its Cell
              </Table.HeaderCell>
              <Table.Cell>The Understudies</Table.Cell>
              <Table.Cell align={'right'}>21.0</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table.Root>
        <DefinitionList.Root>
          <DefinitionList.Item>
            <DefinitionList.Term>Contract</DefinitionList.Term>
            <DefinitionList.Description>
              The agreement under which a song sells. It names the markets, the
              weekly take and the week it ends.
            </DefinitionList.Description>
          </DefinitionList.Item>
          <DefinitionList.Item>
            <DefinitionList.Term>Market</DefinitionList.Term>
            <DefinitionList.Description>
              One country's chart, in which a song holds one position.
            </DefinitionList.Description>
          </DefinitionList.Item>
        </DefinitionList.Root>
        <Checklist.Root>
          <Checklist.Item>
            Confirm the markets the song is selling in
          </Checklist.Item>
          <Checklist.Item>Read the contract's closing week</Checklist.Item>
          <Checklist.Item>Sign the artist before the week ends</Checklist.Item>
        </Checklist.Root>
        <Stack>
          <H3>How prices are set</H3>
          <Prose.Root>
            <Prose.Lede>
              A price is the weekly take a song is expected to earn in its best
              market.
            </Prose.Lede>
            <Prose.Body>
              It moves with the charts, so a song that climbs is worth more next
              week than it was this week, and one that stalls is worth less. The
              figure in the table is this week's; last week's is kept in the{' '}
              <Link href={'#history'}>price history</Link> for every song.
            </Prose.Body>
            <Prose.Tail>Prices are rounded to the nearest hundred.</Prose.Tail>
          </Prose.Root>
          <Note>Prices update at the end of each week.</Note>
        </Stack>
        <Cluster>
          <Button>Sign the artist</Button>
          <Button variant={'ghost'}>Back to the list</Button>
        </Cluster>
      </Stack>
    </Section>
  </>
);

const themed = (faces: Faces) => (
  <div style={faces as CSSProperties}>
    <RepresentativePage />
  </div>
);

const meta: Meta = {
  title: 'Display/Typography/FamilyRoles',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The family roles on one page: `--font-heading` on every heading, `--font-body` on reading matter, `--font-control` on the box a viewer operates and `--font-secondary` on everything that names or routes. The three content-side roles fall back to `--font-primary` on the element reading them, so a theme re-points a name once - on `:root` or on a wrapper - and every element reading it moves; a theme that re-points only the two original roles renders as it did. No component takes a face (docs/adr/0004, Amendments).',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The library's own values: every role resolves through `inherit`, so the page is set in one
 *  face - whatever the document already had. Line boxes, wrapping and the focus ring are the same
 *  in every story below; only the face changes. */
export const LibraryDefaults: Story = {
  render: () => themed({}),
};

/** Serif headings over sans-serif body and controls - the shape the Label Manager asked for (#120).
 *  Only the heading role is re-pointed away from the primary face; body and controls follow
 *  primary, and the labels, nav and annotations take the secondary face. Generic stand-ins, not a
 *  product's faces. */
export const SerifHeadings: Story = {
  render: () =>
    themed({
      '--font-heading': SERIF,
      '--font-primary': SANS,
      '--font-secondary': SANS,
    }),
};

/** The control role addressed on its own: everything a viewer types into or presses takes a
 *  monospace while headings stay serif and reading matter and labels stay sans. A field's label,
 *  hint and error keep the secondary face - only the box moves - and the Button moves with the
 *  fields. */
export const ControlsApart: Story = {
  render: () =>
    themed({
      '--font-heading': SERIF,
      '--font-primary': SANS,
      '--font-secondary': SANS,
      '--font-control': MONO,
    }),
};

/** The body role addressed on its own: paragraphs, the reading block, the definition list, the
 *  checklist and the table's figures take a serif while headings and controls stay on the primary
 *  sans. A definition term is sized like a heading and moves with the body, because it is one. */
export const BodyApart: Story = {
  render: () =>
    themed({
      '--font-body': SERIF,
      '--font-primary': SANS,
      '--font-secondary': SANS,
    }),
};

/** A theme written before #120, setting only the two original roles: headings, body and controls
 *  all follow the serif primary, labels take the sans secondary, exactly as that theme rendered
 *  before the three roles existed. Written on a wrapper, the scope where a resolved-at-root default
 *  would have stranded it; the roles resolve on the element instead. */
export const LegacyTheme: Story = {
  render: () =>
    themed({
      '--font-primary': SERIF,
      '--font-secondary': SANS,
    }),
};

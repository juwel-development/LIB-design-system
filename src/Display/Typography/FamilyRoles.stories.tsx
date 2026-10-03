import { Cluster } from 'Arrangement/Cluster/Cluster';
import { Stack } from 'Arrangement/Stack/Stack';
import { Table } from 'Display/Table/Table';
import { Eyebrow } from 'Display/Typography/Eyebrow/Eyebrow';
import { H2 } from 'Display/Typography/H2/H2';
import { H3 } from 'Display/Typography/H3/H3';
import { Note } from 'Display/Typography/Note/Note';
import { P } from 'Display/Typography/P/P';
import { Prose } from 'Display/Typography/Prose/Prose';
import { Button } from 'Interaction/Button/Button';
import { Input } from 'Interaction/Input/Input';
import { Select } from 'Interaction/Select/Select';
import { PageHead } from 'Layout/PageHead/PageHead';
import { Section } from 'Layout/Section/Section';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties, FunctionComponent } from 'react';

// The four family roles shown together on one representative page (#120). A story is the one place
// a consumer's theme is legitimately hand-written, so each story re-points the roles on a wrapper -
// generic faces only, never a product's. No component here takes a face: what changes between
// stories is the theme, and the markup is the same page every time. A wrapper is not :root, so every
// story states all four roles: the var(--font-primary) default of the two added roles resolves where
// the library declares it, on :root, and a wrapper re-pointing primary alone does not move them
// (docs/adr/0004, Amendments) - a theme stylesheet on :root does, and that is verified in the browser.
type Faces = Partial<
  Record<
    '--font-heading' | '--font-primary' | '--font-secondary' | '--font-control',
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
            leaving the list.
          </P>
        </Stack>
        <Cluster>
          <Input label={'Title'} name={'title'} placeholder={'Any title'} />
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
              figure in the table is this week's.
            </Prose.Body>
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
          'The four family roles on one page: `--font-heading` on every heading, `--font-primary` on content, `--font-secondary` on everything that names or routes, `--font-control` on the box a viewer operates. A theme re-points a name once and every element reading it moves; no component takes a face. The heading and control roles default to `var(--font-primary)`, so a theme that re-points only the two original roles renders as it did (docs/adr/0004, Amendments).',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The library's own values: all four roles resolve through `inherit`, so the page is set in one
 *  face - whatever the document already had. Line boxes, wrapping and the focus ring are the same
 *  in every story below; only the face changes. */
export const LibraryDefaults: Story = {
  render: () => themed({}),
};

/** Serif headings over sans-serif body and controls - the shape the Label Manager asked for (#120).
 *  The controls take the sans with the content and the labels; only the heading ladder departs. A
 *  theme on `:root` could leave `--font-control` to follow `--font-primary`; this wrapper states it.
 *  The faces are generic stand-ins, not a product's. */
export const SerifHeadings: Story = {
  render: () =>
    themed({
      '--font-heading': SERIF,
      '--font-primary': SANS,
      '--font-secondary': SANS,
      '--font-control': SANS,
    }),
};

/** The control role addressed on its own: everything a viewer types into or presses takes a
 *  monospace while headings stay serif and content and labels stay sans. A field's label, hint and
 *  error keep the secondary face - only the box moves - and the Button moves with the fields. */
export const ControlsApart: Story = {
  render: () =>
    themed({
      '--font-heading': SERIF,
      '--font-primary': SANS,
      '--font-secondary': SANS,
      '--font-control': MONO,
    }),
};

/** Headings and controls in the content face and labels apart - the two-role split the contract
 *  offered before #120 and what a theme that never learns the new roles still gets. Written with the
 *  two new roles stated so it reads on this wrapper as it does on `:root`, where the
 *  `var(--font-primary)` default follows the re-pointed primary by itself. */
export const ContentAndLabelsOnly: Story = {
  render: () =>
    themed({
      '--font-heading': SERIF,
      '--font-primary': SERIF,
      '--font-secondary': SANS,
      '--font-control': SERIF,
    }),
};

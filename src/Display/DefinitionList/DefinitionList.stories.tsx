import type { Meta, StoryObj } from '@storybook/react-vite';
import { DefinitionList } from './DefinitionList';

const meta: Meta<typeof DefinitionList.Root> = {
  title: 'Display/DefinitionList',
  component: DefinitionList.Root,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default: single column below 64rem, two baseline-aligned columns at and above it. Resize the
 * canvas across 64rem to see the switch - it is a media query, not a prop.
 */
export const Default: Story = {
  render: () => (
    <DefinitionList.Root>
      <DefinitionList.Item>
        <DefinitionList.Term>Casting</DefinitionList.Term>
        <DefinitionList.Description>
          Shaping metal or resin by pouring it into a form and letting it set.
        </DefinitionList.Description>
      </DefinitionList.Item>
      <DefinitionList.Item>
        <DefinitionList.Term>Turning</DefinitionList.Term>
        <DefinitionList.Description>
          Cutting a rotating workpiece on a lathe to a round profile.
        </DefinitionList.Description>
      </DefinitionList.Item>
      <DefinitionList.Item>
        <DefinitionList.Term>Finishing</DefinitionList.Term>
        <DefinitionList.Description>
          The last passes that bring a surface to its final texture and
          tolerance.
        </DefinitionList.Description>
      </DefinitionList.Item>
    </DefinitionList.Root>
  ),
};

/** A single item, showing the hairline above and below and the term-above-description stack. */
export const SingleItem: Story = {
  render: () => (
    <DefinitionList.Root>
      <DefinitionList.Item>
        <DefinitionList.Term>Moulding</DefinitionList.Term>
        <DefinitionList.Description>
          Forming a part against a shaped tool, the reverse of the surface it
          leaves behind.
        </DefinitionList.Description>
      </DefinitionList.Item>
    </DefinitionList.Root>
  ),
};

/** Several terms sharing one description - the case the Item wrapper exists to keep intact. */
export const MultipleTerms: Story = {
  render: () => (
    <DefinitionList.Root>
      <DefinitionList.Item>
        <DefinitionList.Term>Casting</DefinitionList.Term>
        <DefinitionList.Term>Moulding</DefinitionList.Term>
        <DefinitionList.Description>
          Two names for shaping by pouring or pressing into a form and letting
          it set.
        </DefinitionList.Description>
      </DefinitionList.Item>
      <DefinitionList.Item>
        <DefinitionList.Term>Turning</DefinitionList.Term>
        <DefinitionList.Term>Milling</DefinitionList.Term>
        <DefinitionList.Description>
          Subtractive cutting - on a lathe for the first, against a rotating
          tool for the second.
        </DefinitionList.Description>
      </DefinitionList.Item>
    </DefinitionList.Root>
  ),
};

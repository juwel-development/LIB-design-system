import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Cluster, P, Prose, Rule, Stack } from 'index';
import type { CSSProperties } from 'react';
import { expect, within } from 'storybook/test';

const meta: Meta<typeof Rule> = {
  title: 'Display/Rule',
  component: Rule,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A decorative horizontal hairline between arbitrary blocks, without a box or list semantics. Import `Rule` from `@juwel-development/design-system` and place it between two children of a column `Stack`. The rule spans its holder and reads the theme’s `border` colour role; it is one CSS pixel thick. Stack supplies both surrounding gaps through `--space-stack` (default) or `--space-region`. Rule adds no margin or padding and accepts only `testId?: string`: no children, size, orientation, label, style or className. It is always hidden from assistive technology and never adds a tab stop. It is never a semantic separator; use semantic markup for a thematic break that needs to be announced. Use Collection instead for a semantic list of separated items. Light and dark themes resolve the same border token; forced colours use the system CanvasText colour. The consumer owns all content and actions.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const BetweenContentAndControls: Story = {
  render: () => (
    <Stack testId={'holder'}>
      <Prose.Root>
        <P>Dear colleague,</P>
        <P>The revised proposal is ready for your review.</P>
        <P>Thank you for your time.</P>
      </Prose.Root>
      <Rule testId={'rule'} />
      <Cluster>
        <Button>Accept proposal</Button>
        <Button variant={'secondary'}>Reply</Button>
      </Cluster>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rule = canvas.getByTestId('rule');
    const holder = canvas.getByTestId('holder');
    const bounds = rule.getBoundingClientRect();
    const paint = getComputedStyle(rule);
    await expect(bounds.width).toBeCloseTo(
      holder.getBoundingClientRect().width,
    );
    await expect(bounds.height).toBe(1);
    await expect(paint.borderTopStyle).toBe('solid');
    await expect(paint.marginTop).toBe('0px');
    await expect(paint.marginBottom).toBe('0px');
    const above = rule.previousElementSibling;
    const below = rule.nextElementSibling;
    if (!above || !below) throw new Error('The rule needs two content blocks');
    const gap = Number.parseFloat(getComputedStyle(holder).rowGap);
    await expect(bounds.top - above.getBoundingClientRect().bottom).toBeCloseTo(
      gap,
    );
    await expect(below.getBoundingClientRect().top - bounds.bottom).toBeCloseTo(
      gap,
    );
    await expect(rule).toHaveAttribute('aria-hidden', 'true');
    await expect(canvas.queryByRole('separator')).toBeNull();
  },
};

export const Dark: Story = {
  ...BetweenContentAndControls,
  globals: { theme: 'dark' },
};

export const RegionSpacing: Story = {
  ...BetweenContentAndControls,
  render: () => (
    <Stack gap={'region'} testId={'holder'}>
      <P>A complete group of content.</P>
      <Rule testId={'rule'} />
      <Button>Continue</Button>
    </Stack>
  ),
};

export const NarrowHolder: Story = {
  ...BetweenContentAndControls,
  decorators: [
    (Story) => (
      <div style={{ width: '18rem', maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
};

export const RepointedTokens: Story = {
  ...BetweenContentAndControls,
  decorators: [
    (Story) => (
      <div
        style={
          {
            '--color-border': 'var(--color-foreground)',
            '--space-stack': '2rem',
          } as CSSProperties
        }
      >
        <Story />
      </div>
    ),
  ],
};

export const ForcedColours: Story = {
  ...BetweenContentAndControls,
  parameters: {
    docs: {
      description: {
        story:
          'Enable forced-colors: active in browser rendering emulation or an operating-system contrast theme. The hairline uses CanvasText, stays one pixel thick and adds no focus stop. This story does not simulate forced colours with ordinary CSS.',
      },
    },
  },
};

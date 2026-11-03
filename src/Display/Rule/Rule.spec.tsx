import { render, screen } from '@testing-library/react';
import { Button, Rule, Stack } from 'index';
import type { ComponentProps } from 'react';
import { describe, expect, expectTypeOf, it } from 'vitest';

describe('Rule', () => {
  it('offers only an optional consumer test hook', () => {
    expectTypeOf<ComponentProps<typeof Rule>>().toEqualTypeOf<{
      testId?: string;
    }>();
  });

  it('keeps surrounding blocks and actions in their consumer-defined order', () => {
    render(
      <Stack>
        <Button>Before</Button>
        <Rule />
        <Button>After</Button>
      </Stack>,
    );

    const before = screen.getByRole('button', { name: 'Before' });
    const after = screen.getByRole('button', { name: 'After' });
    expect(before.nextElementSibling?.nextElementSibling).toBe(after);
    expect(before.nextElementSibling).not.toHaveAttribute('data-testid');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('separates visually without announcing a separator or adding a focus stop', () => {
    render(<Rule testId={'rule'} />);

    const rule = screen.getByTestId('rule');
    expect(rule).toBeEmptyDOMElement();
    expect(rule).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('separator', { hidden: true })).toBeNull();
    expect(rule.tabIndex).toBe(-1);
    rule.focus();
    expect(rule).not.toHaveFocus();
  });
});

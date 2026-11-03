import { fireEvent, render, screen, within } from '@testing-library/react';
import { Button, Callout, Cluster, Icon, P, Stack } from 'index';
import { Subject } from 'rxjs';
import { describe, expect, it } from 'vitest';

describe('Callout', () => {
  it('exposes a consumer-named group around unmodified content without inventing a heading', () => {
    render(
      <Callout tone="warning" name="Response required">
        <p>This message holds game time.</p>
      </Callout>,
    );
    const group = screen.getByRole('group', { name: 'Response required' });
    expect(group).toHaveTextContent('This message holds game time.');
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(group).not.toHaveAttribute('tabindex');
    expect(group).not.toHaveAttribute('aria-live');
  });
  it.each([undefined, ''])(
    'keeps unnamed content passive when name is %s',
    (name) => {
      render(
        <Callout name={name} testId="callout">
          <p>Warning: answer before continuing.</p>
        </Callout>,
      );
      const callout = screen.getByTestId('callout');
      expect(callout).not.toHaveAttribute('role');
      expect(callout).not.toHaveAttribute('aria-label');
      expect(callout).not.toHaveAttribute('tabindex');
      expect(callout).not.toHaveAttribute('aria-live');
    },
  );
  it.each(['warning', 'info', 'success', 'error'] as const)(
    'keeps %s content and controls independent of its passive mark',
    (tone) => {
      const action = new Subject<void>();
      const events: string[] = [];
      action.subscribe(() => events.push('activated'));
      const { rerender } = render(
        <Callout tone={tone} name="Response">
          <Stack>
            <P>Response required.</P>
            <Cluster>
              <Button onClick$={action}>Accept</Button>
              <Button variant="outlined" disabled>
                Decline
              </Button>
            </Cluster>
          </Stack>
        </Callout>,
      );
      const group = screen.getByRole('group', { name: 'Response' });
      const buttons = within(group).getAllByRole('button');
      expect(buttons.map((button) => button.textContent)).toEqual([
        'Accept',
        'Decline',
      ]);
      const accept = screen.getByRole('button', { name: 'Accept' });
      accept.focus();
      expect(accept).toHaveFocus();
      fireEvent.click(accept);
      fireEvent.click(screen.getByRole('button', { name: 'Decline' }));
      expect(events).toHaveLength(1);
      expect(group).not.toHaveAttribute('tabindex');
      expect(group).not.toHaveAttribute('aria-live');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      rerender(
        <Callout tone={tone}>
          <Icon name="bubble-exclamation" label="Response required" />
        </Callout>,
      );
      expect(
        screen.getByRole('img', { name: 'Response required' }),
      ).toBeInTheDocument();
      expect(action.closed).toBe(false);
    },
  );
});

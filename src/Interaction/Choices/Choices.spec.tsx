import { fireEvent, render, screen } from '@testing-library/react';
import {
  type FunctionComponent,
  type ReactNode,
  useEffect,
  useState,
} from 'react';
import { Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { Choices } from './Choices';
import { ChoicesCompositionError } from './ChoicesCompositionError';

// A fixed, uncontrolled composition: `selected` is pinned to what the test passes, so what these
// renders prove is that Choices renders the value it is given and never a selection of its own.
const cadenceChoices = (
  selected: string,
  onSelect$: Subject<string>,
  inert?: boolean,
): ReactNode => (
  <Choices.Root
    selected={selected}
    onSelect$={onSelect$}
    label={'Notification cadence'}
    inert={inert}
  >
    <Choices.Choice
      value={'daily'}
      description={'A short digest every morning.'}
    >
      Daily digest
    </Choices.Choice>
    <Choices.Choice
      value={'weekly'}
      description={'One summary at the start of the week.'}
    >
      Weekly summary
    </Choices.Choice>
    <Choices.Choice
      value={'quiet'}
      description={'Nothing arrives unless something needs you.'}
    >
      Quiet
    </Choices.Choice>
  </Choices.Root>
);

// The controlled harness the contract asks for: the consumer owns the selected key and feeds
// selection requests back into it, exactly as a consuming product would.
const ControlledCadence: FunctionComponent<{ onSelect$: Subject<string> }> = ({
  onSelect$,
}) => {
  const [selected, setSelected] = useState('daily');
  useEffect(() => {
    const subscription = onSelect$.subscribe(setSelected);
    return () => subscription.unsubscribe();
  }, [onSelect$]);
  return <>{cadenceChoices(selected, onSelect$)}</>;
};

describe('Choices Component', () => {
  it('renders a radio group named by the label prop', () => {
    render(cadenceChoices('daily', new Subject<string>()));
    expect(
      screen.getByRole('radiogroup', { name: 'Notification cadence' }),
    ).toBeInTheDocument();
  });

  it('renders every choice row in rendered order, named by its visible name', () => {
    render(cadenceChoices('daily', new Subject<string>()));
    const rows = screen.getAllByRole('radio');
    expect(
      rows.map((row) => row.getAttribute('aria-labelledby')),
    ).not.toContain(null);
    expect(screen.getByRole('radio', { name: 'Daily digest' })).toBe(rows[0]);
    expect(screen.getByRole('radio', { name: 'Weekly summary' })).toBe(rows[1]);
    expect(screen.getByRole('radio', { name: 'Quiet' })).toBe(rows[2]);
  });

  it('keeps every description visible and exposed as the accessible description', () => {
    render(cadenceChoices('daily', new Subject<string>()));
    expect(
      screen.getByRole('radio', { name: 'Daily digest' }),
    ).toHaveAccessibleDescription('A short digest every morning.');
    expect(
      screen.getByRole('radio', { name: 'Weekly summary' }),
    ).toHaveAccessibleDescription('One summary at the start of the week.');
    expect(
      screen.getByText('Nothing arrives unless something needs you.'),
    ).toBeVisible();
  });

  it('checks exactly the choice the selected prop names', () => {
    render(cadenceChoices('weekly', new Subject<string>()));
    expect(screen.getByRole('radio', { name: 'Weekly summary' })).toBeChecked();
    for (const name of ['Daily digest', 'Quiet']) {
      expect(screen.getByRole('radio', { name })).not.toBeChecked();
    }
  });

  it('marks the selected choice with the marker dot, so selection survives without colour', () => {
    render(cadenceChoices('weekly', new Subject<string>()));
    const dot = (name: string) =>
      screen
        .getByRole('radio', { name })
        .querySelector('[data-choice-marker-dot]');
    expect(dot('Weekly summary')).not.toBeNull();
    expect(dot('Daily digest')).toBeNull();
    expect(dot('Quiet')).toBeNull();
  });

  it('supports any caller-supplied row count, not just the first consumer’s two', () => {
    const rows = ['one', 'two', 'three', 'four', 'five'];
    render(
      <Choices.Root
        selected={'three'}
        onSelect$={new Subject<string>()}
        label={'Rows'}
      >
        {rows.map((value) => (
          <Choices.Choice
            key={value}
            value={value}
            description={`About ${value}.`}
          >
            {`Row ${value}`}
          </Choices.Choice>
        ))}
      </Choices.Root>,
    );
    expect(screen.getAllByRole('radio')).toHaveLength(5);
    expect(screen.getByRole('radio', { name: 'Row three' })).toBeChecked();
  });

  it('requests the clicked choice through the Subject, and renders no selection of its own', () => {
    const onSelect$ = new Subject<string>();
    const selected = vi.fn();
    onSelect$.subscribe(selected);
    render(cadenceChoices('daily', onSelect$));

    fireEvent.click(screen.getByRole('radio', { name: 'Weekly summary' }));

    expect(selected).toHaveBeenCalledWith('weekly');
    // The selected prop did not change, so neither does the rendered selection - no optimism.
    expect(screen.getByRole('radio', { name: 'Daily digest' })).toBeChecked();
    expect(
      screen.getByRole('radio', { name: 'Weekly summary' }),
    ).not.toBeChecked();
  });

  it('requests a choice from a click on its non-interactive text, description included', () => {
    const onSelect$ = new Subject<string>();
    const selected = vi.fn();
    onSelect$.subscribe(selected);
    render(cadenceChoices('daily', onSelect$));

    fireEvent.click(screen.getByText('One summary at the start of the week.'));
    expect(selected).toHaveBeenLastCalledWith('weekly');

    fireEvent.click(screen.getByText('Quiet'));
    expect(selected).toHaveBeenLastCalledWith('quiet');
  });

  it('emits nothing for the already-selected choice, and nothing on any render', () => {
    const onSelect$ = new Subject<string>();
    const selected = vi.fn();
    onSelect$.subscribe(selected);
    const { rerender } = render(cadenceChoices('daily', onSelect$));

    rerender(cadenceChoices('weekly', onSelect$));
    fireEvent.click(screen.getByRole('radio', { name: 'Weekly summary' }));

    expect(selected).not.toHaveBeenCalled();
  });

  it('follows the supplied selected prop when the consumer answers a selection request', () => {
    const onSelect$ = new Subject<string>();
    render(<ControlledCadence onSelect$={onSelect$} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Quiet' }));

    expect(screen.getByRole('radio', { name: 'Quiet' })).toBeChecked();
    expect(
      screen.getByRole('radio', { name: 'Daily digest' }),
    ).not.toBeChecked();
  });

  it('moves focus and requests selection with ArrowDown, staying on the operated row', () => {
    const onSelect$ = new Subject<string>();
    const selected = vi.fn();
    onSelect$.subscribe(selected);
    render(<ControlledCadence onSelect$={onSelect$} />);
    const daily = screen.getByRole('radio', { name: 'Daily digest' });
    daily.focus();

    fireEvent.keyDown(daily, { key: 'ArrowDown' });

    const weekly = screen.getByRole('radio', { name: 'Weekly summary' });
    expect(selected).toHaveBeenCalledWith('weekly');
    expect(weekly).toHaveFocus();
    expect(weekly).toBeChecked();
  });

  it('treats ArrowRight as next and ArrowLeft as previous, per the radio-group pattern', () => {
    const onSelect$ = new Subject<string>();
    const selected = vi.fn();
    onSelect$.subscribe(selected);
    render(<ControlledCadence onSelect$={onSelect$} />);
    const daily = screen.getByRole('radio', { name: 'Daily digest' });
    daily.focus();

    fireEvent.keyDown(daily, { key: 'ArrowRight' });
    expect(selected).toHaveBeenLastCalledWith('weekly');
    expect(screen.getByRole('radio', { name: 'Weekly summary' })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Weekly summary' }), {
      key: 'ArrowLeft',
    });
    expect(selected).toHaveBeenLastCalledWith('daily');
    expect(screen.getByRole('radio', { name: 'Daily digest' })).toHaveFocus();
  });

  it('wraps ArrowDown from the last row to the first, and ArrowUp from the first to the last', () => {
    const onSelect$ = new Subject<string>();
    const selected = vi.fn();
    onSelect$.subscribe(selected);
    render(<ControlledCadence onSelect$={onSelect$} />);
    const daily = screen.getByRole('radio', { name: 'Daily digest' });
    daily.focus();

    fireEvent.keyDown(daily, { key: 'ArrowUp' });
    expect(selected).toHaveBeenLastCalledWith('quiet');
    expect(screen.getByRole('radio', { name: 'Quiet' })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Quiet' }), {
      key: 'ArrowDown',
    });
    expect(selected).toHaveBeenLastCalledWith('daily');
    expect(screen.getByRole('radio', { name: 'Daily digest' })).toHaveFocus();
  });

  it('moves focus without emitting when arrowing back onto the already-selected choice', () => {
    const onSelect$ = new Subject<string>();
    const selected = vi.fn();
    onSelect$.subscribe(selected);
    // Uncontrolled on purpose: the request goes unanswered, so `daily` stays the selected value.
    render(cadenceChoices('daily', onSelect$));
    const daily = screen.getByRole('radio', { name: 'Daily digest' });
    daily.focus();

    fireEvent.keyDown(daily, { key: 'ArrowDown' });
    expect(selected).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Weekly summary' }), {
      key: 'ArrowUp',
    });

    expect(daily).toHaveFocus();
    expect(selected).toHaveBeenCalledTimes(1);
  });

  it('leaves other keys to the browser, so Tab and page scrolling keep working', () => {
    const onSelect$ = new Subject<string>();
    const selected = vi.fn();
    onSelect$.subscribe(selected);
    render(cadenceChoices('daily', onSelect$));
    const daily = screen.getByRole('radio', { name: 'Daily digest' });
    daily.focus();

    fireEvent.keyDown(daily, { key: 'Tab' });
    fireEvent.keyDown(daily, { key: 'Home' });

    expect(selected).not.toHaveBeenCalled();
    expect(daily).toHaveFocus();
  });

  it('enters the group at the selected row: roving tabindex, 0 on selected, -1 elsewhere', () => {
    render(cadenceChoices('weekly', new Subject<string>()));
    expect(
      screen.getByRole('radio', { name: 'Weekly summary' }),
    ).toHaveAttribute('tabindex', '0');
    for (const name of ['Daily digest', 'Quiet']) {
      expect(screen.getByRole('radio', { name })).toHaveAttribute(
        'tabindex',
        '-1',
      );
    }
  });

  it('exposes an inert group as unavailable, with every row disabled and no Tab stop', () => {
    render(cadenceChoices('weekly', new Subject<string>(), true));
    expect(
      screen.getByRole('radiogroup', { name: 'Notification cadence' }),
    ).toHaveAttribute('aria-disabled', 'true');
    for (const row of screen.getAllByRole('radio')) {
      expect(row).toBeDisabled();
      expect(row).not.toHaveAttribute('tabindex', '0');
    }
  });

  it('keeps the retained selection and every name and description visible while inert', () => {
    render(cadenceChoices('weekly', new Subject<string>(), true));
    const weekly = screen.getByRole('radio', { name: 'Weekly summary' });
    expect(weekly).toBeChecked();
    expect(weekly.querySelector('[data-choice-marker-dot]')).not.toBeNull();
    expect(screen.getByText('Daily digest')).toBeVisible();
    expect(
      screen.getByText('Nothing arrives unless something needs you.'),
    ).toBeVisible();
  });

  it('permits no selection change through pointer input while inert', () => {
    const onSelect$ = new Subject<string>();
    const selected = vi.fn();
    onSelect$.subscribe(selected);
    render(cadenceChoices('weekly', onSelect$, true));

    fireEvent.click(screen.getByRole('radio', { name: 'Daily digest' }));
    fireEvent.click(screen.getByText('A short digest every morning.'));

    expect(selected).not.toHaveBeenCalled();
  });

  it('permits no selection change through keyboard input while inert', () => {
    const onSelect$ = new Subject<string>();
    const selected = vi.fn();
    onSelect$.subscribe(selected);
    render(cadenceChoices('weekly', onSelect$, true));
    const weekly = screen.getByRole('radio', { name: 'Weekly summary' });

    fireEvent.keyDown(weekly, { key: 'ArrowDown' });

    expect(selected).not.toHaveBeenCalled();
    expect(
      screen.getByRole('radio', { name: 'Daily digest' }),
    ).not.toHaveFocus();
  });

  it('gives two instances collision-free name and description ids', () => {
    render(
      <>
        {cadenceChoices('daily', new Subject<string>())}
        {cadenceChoices('daily', new Subject<string>())}
      </>,
    );
    const ids = screen
      .getAllByRole('radio')
      .flatMap((row) => [
        row.getAttribute('aria-labelledby'),
        row.getAttribute('aria-describedby'),
      ]);
    expect(ids).not.toContain(null);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('throws when a member is composed outside Choices.Root, loud and early', () => {
    // The member cannot render without the Root's contract, so this is an invariant, not a state.
    expect(() =>
      render(
        <Choices.Choice value={'daily'} description={'A description.'}>
          Daily digest
        </Choices.Choice>,
      ),
    ).toThrowError(ChoicesCompositionError);
  });
});

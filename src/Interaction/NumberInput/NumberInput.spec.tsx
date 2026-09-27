import { act, fireEvent, render, screen } from '@testing-library/react';
import { NumberInput } from 'index';
import type { ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Subject } from 'rxjs';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';

describe('NumberInput', () => {
  it('is one public roster entry with a closed field surface and no attribute bag', () => {
    expectTypeOf<keyof ComponentProps<typeof NumberInput>>().toEqualTypeOf<
      | 'label'
      | 'name'
      | 'required'
      | 'optionalLabel'
      | 'hint'
      | 'invalid'
      | 'errorMessage'
      | 'disabled'
      | 'placeholder'
      | 'testId'
      | 'defaultValue'
      | 'onInput$'
      | 'reset$'
    >();
    expectTypeOf<
      ComponentProps<typeof NumberInput>['onInput$']
    >().toEqualTypeOf<Subject<string> | undefined>();
    expectTypeOf<ComponentProps<typeof NumberInput>['reset$']>().toEqualTypeOf<
      Subject<void> | undefined
    >();
    expectTypeOf<
      ComponentProps<typeof NumberInput>['defaultValue']
    >().toEqualTypeOf<string | undefined>();
  });

  it('renders a labelled text control that asks for a decimal keyboard without claiming spinbutton semantics', () => {
    render(<NumberInput label={'Maximum price'} name={'maxPrice'} />);
    const control = screen.getByRole('textbox', { name: 'Maximum price' });
    expect(control.tagName).toBe('INPUT');
    expect(control).toHaveAttribute('type', 'text');
    expect(control).toHaveAttribute('inputmode', 'decimal');
    expect(control).toHaveAttribute('name', 'maxPrice');
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Maximum price')).toBe(control);
  });

  it('carries no numeric validation attributes, so nothing eats, clamps or judges the entered text', () => {
    render(<NumberInput label={'Maximum price'} name={'maxPrice'} />);
    const control = screen.getByRole('textbox');
    for (const attribute of ['min', 'max', 'step', 'pattern', 'maxlength']) {
      expect(control).not.toHaveAttribute(attribute);
    }
  });

  it('keeps and emits blank, zero, incomplete, dot-decimal and comma-decimal edits as distinct text', () => {
    const onInput$ = new Subject<string>();
    const received: string[] = [];
    onInput$.subscribe((text) => received.push(text));
    render(
      <NumberInput
        label={'Minimum quality'}
        name={'minQuality'}
        onInput$={onInput$}
      />,
    );
    const control = screen.getByRole('textbox');

    for (const edit of ['0', '', '-', '1.', '1,5', '1.5', '']) {
      fireEvent.input(control, { target: { value: edit } });
      expect(control).toHaveValue(edit);
    }

    expect(received).toEqual(['0', '', '-', '1.', '1,5', '1.5', '']);
  });

  it('retains pasted text that is not a number, untruncated and unconverted, so the consumer can explain it', () => {
    const onInput$ = new Subject<string>();
    const received: string[] = [];
    onInput$.subscribe((text) => received.push(text));
    render(
      <NumberInput
        label={'Maximum price'}
        name={'maxPrice'}
        onInput$={onInput$}
      />,
    );
    const control = screen.getByRole('textbox');

    for (const pasted of [
      '12abc',
      '1e400',
      'Infinity',
      'NaN',
      ' 7 ',
      '1 000,50',
    ]) {
      fireEvent.input(control, { target: { value: pasted } });
      expect(control).toHaveValue(pasted);
    }

    expect(received).toEqual([
      '12abc',
      '1e400',
      'Infinity',
      'NaN',
      ' 7 ',
      '1 000,50',
    ]);
  });

  it('initialises from defaultValue and keeps the current edit when a rerender brings a new default', () => {
    const onInput$ = new Subject<string>();
    const received: string[] = [];
    onInput$.subscribe((text) => received.push(text));
    const field = (savedText: string) => (
      <NumberInput
        label={'Maximum price'}
        name={'maxPrice'}
        defaultValue={savedText}
        onInput$={onInput$}
      />
    );
    const { rerender } = render(field('250'));
    const control = screen.getByRole('textbox');
    expect(control).toHaveValue('250');

    fireEvent.input(control, { target: { value: '30' } });
    rerender(field('999'));

    expect(screen.getByRole('textbox')).toBe(control);
    expect(control).toHaveValue('30');
    expect(received).toEqual(['30']);
  });

  it('restores saved text when the consumer remounts the field with it as defaultValue', () => {
    const field = (savedText: string, mountKey: string) => (
      <NumberInput
        key={mountKey}
        label={'Maximum price'}
        name={'maxPrice'}
        defaultValue={savedText}
      />
    );
    const { rerender } = render(field('250', 'songs-tab'));
    const control = screen.getByRole('textbox');

    rerender(field('30', 'songs-tab-revisited'));

    expect(screen.getByRole('textbox')).not.toBe(control);
    expect(screen.getByRole('textbox')).toHaveValue('30');
  });

  it('empties the live node when reset$ emits, keeping focus and telling the output stream nothing', () => {
    const onInput$ = new Subject<string>();
    const received: string[] = [];
    onInput$.subscribe((text) => received.push(text));
    const reset$ = new Subject<void>();
    render(
      <NumberInput
        label={'Maximum price'}
        name={'maxPrice'}
        defaultValue={'250'}
        onInput$={onInput$}
        reset$={reset$}
      />,
    );
    const control = screen.getByRole('textbox');
    control.focus();

    act(() => reset$.next());

    expect(screen.getByRole('textbox')).toBe(control);
    expect(control).toHaveValue('');
    expect(control).toHaveFocus();
    expect(received).toEqual([]);
  });

  it('listens to the reset$ it is currently given and lets go of a replaced one and on unmount', () => {
    const firstReset$ = new Subject<void>();
    const secondReset$ = new Subject<void>();
    const field = (reset$: Subject<void>) => (
      <NumberInput
        label={'Maximum price'}
        name={'maxPrice'}
        defaultValue={'250'}
        reset$={reset$}
      />
    );
    const { rerender, unmount } = render(field(firstReset$));
    expect(firstReset$.observed).toBe(true);

    rerender(field(secondReset$));
    expect(firstReset$.observed).toBe(false);
    act(() => firstReset$.next());
    expect(screen.getByRole('textbox')).toHaveValue('250');
    act(() => secondReset$.next());
    expect(screen.getByRole('textbox')).toHaveValue('');

    unmount();
    expect(secondReset$.observed).toBe(false);
  });

  it('submits the text by name exactly as typed - a decimal comma or invalid content included', () => {
    render(
      <form aria-label={'Songs'}>
        <NumberInput label={'Song count'} name={'songCount'} />
      </form>,
    );
    const control = screen.getByRole('textbox');
    const form = screen.getByRole<HTMLFormElement>('form', { name: 'Songs' });

    fireEvent.input(control, { target: { value: '1,5' } });
    expect(new FormData(form).get('songCount')).toBe('1,5');

    // Numeric validity is the consumer's: the form happily submits text no number parser accepts.
    fireEvent.input(control, { target: { value: 'twelve' } });
    expect(new FormData(form).get('songCount')).toBe('twelve');
    expect(control).toBeValid();
  });

  it('lets required check presence only, so an empty field is rejected and a non-numeric one is not', () => {
    render(
      <form aria-label={'Songs'}>
        <NumberInput label={'Song count'} name={'songCount'} required={true} />
      </form>,
    );
    const control = screen.getByRole('textbox');
    const form = screen.getByRole<HTMLFormElement>('form', { name: 'Songs' });
    expect(control).toBeRequired();
    expect(control).toBeInvalid();
    expect(form.checkValidity()).toBe(false);

    fireEvent.input(control, { target: { value: 'twelve' } });

    expect(form.checkValidity()).toBe(true);
  });

  it('restores the form default on native reset without a user event, unlike reset$ which empties', () => {
    const onInput$ = new Subject<string>();
    const received: string[] = [];
    onInput$.subscribe((text) => received.push(text));
    render(
      <form aria-label={'Songs'}>
        <NumberInput
          label={'Maximum price'}
          name={'maxPrice'}
          defaultValue={'250'}
          onInput$={onInput$}
        />
      </form>,
    );
    const control = screen.getByRole('textbox');
    fireEvent.input(control, { target: { value: '30' } });

    screen.getByRole<HTMLFormElement>('form', { name: 'Songs' }).reset();

    expect(control).toHaveValue('250');
    expect(received).toEqual(['30']);
  });

  it('keeps a disabled field out of editing, emission and submission', () => {
    const onInput$ = new Subject<string>();
    const received: string[] = [];
    onInput$.subscribe((text) => received.push(text));
    render(
      <form aria-label={'Songs'}>
        <NumberInput
          label={'Maximum price'}
          name={'maxPrice'}
          defaultValue={'250'}
          disabled={true}
          onInput$={onInput$}
        />
      </form>,
    );
    const control = screen.getByRole('textbox');
    const form = screen.getByRole<HTMLFormElement>('form', { name: 'Songs' });
    expect(control).toBeDisabled();
    control.focus();
    expect(control).not.toHaveFocus();
    expect(new FormData(form).has('maxPrice')).toBe(false);

    fireEvent.input(control, { target: { value: '30' } });

    expect(received).toEqual([]);
  });

  it('still empties a disabled field when reset$ emits, since a programmatic clear is not a user edit', () => {
    const reset$ = new Subject<void>();
    render(
      <NumberInput
        label={'Maximum price'}
        name={'maxPrice'}
        defaultValue={'250'}
        disabled={true}
        reset$={reset$}
      />,
    );
    const control = screen.getByRole('textbox');

    act(() => reset$.next());

    expect(control).toHaveValue('');
  });

  it('emits nothing for rendering, message changes or remount initialisation - only the user speaks on onInput$', () => {
    const onInput$ = new Subject<string>();
    const received: string[] = [];
    onInput$.subscribe((text) => received.push(text));
    const field = (mountKey: string, invalid: boolean) => (
      <NumberInput
        key={mountKey}
        label={'Maximum price'}
        name={'maxPrice'}
        defaultValue={'12abc'}
        hint={invalid ? 'Whole dollars' : undefined}
        invalid={invalid}
        errorMessage={'Enter a whole-dollar amount'}
        onInput$={onInput$}
      />
    );
    const { rerender } = render(field('first', false));
    screen.getByRole('textbox').focus();
    rerender(field('first', true));
    rerender(field('first', false));
    rerender(field('second', true));

    expect(screen.getByRole('textbox')).toHaveValue('12abc');
    expect(received).toEqual([]);
  });

  it('names the control by its label and describes it by hint and error, dropping a stale error association', () => {
    const { rerender } = render(
      <NumberInput
        label={'Maximum commission'}
        name={'maxCommission'}
        hint={'Percent of the sale'}
        invalid={true}
        errorMessage={'Enter a number between 0 and 100'}
      />,
    );
    const control = screen.getByRole('textbox', { name: 'Maximum commission' });
    expect(control).toHaveAttribute('aria-invalid', 'true');
    expect(control).toHaveAccessibleDescription(
      'Percent of the sale Enter a number between 0 and 100',
    );

    rerender(
      <NumberInput
        label={'Maximum commission'}
        name={'maxCommission'}
        hint={'Percent of the sale'}
        errorMessage={'Enter a number between 0 and 100'}
      />,
    );
    expect(control).not.toHaveAttribute('aria-invalid');
    expect(control).toHaveAccessibleDescription('Percent of the sale');
    expect(
      screen.queryByText('Enter a number between 0 and 100'),
    ).not.toBeInTheDocument();
  });

  it("marks a non-required field only in the caller's wording and ships no wording of its own", () => {
    const { rerender, container } = render(
      <NumberInput
        label={'Höchstpreis'}
        name={'maxPrice'}
        optionalLabel={'freiwillig'}
      />,
    );
    expect(screen.getByRole('textbox')).not.toBeRequired();
    expect(screen.getByText('freiwillig')).toBeInTheDocument();

    rerender(
      <NumberInput
        label={'Höchstpreis'}
        name={'maxPrice'}
        required={true}
        optionalLabel={'freiwillig'}
      />,
    );
    expect(screen.queryByText('freiwillig')).not.toBeInTheDocument();
    expect(container.textContent).toBe('Höchstpreis');
  });

  it('keeps several fields apart: each label, hint and error reaches its own control through unique ids', () => {
    render(
      <>
        <NumberInput
          label={'Minimum quality'}
          name={'minQuality'}
          hint={'1 to 10'}
        />
        <NumberInput
          label={'Maximum price'}
          name={'maxPrice'}
          hint={'Whole dollars'}
          invalid={true}
          errorMessage={'Enter a whole-dollar amount'}
        />
      </>,
    );
    const quality = screen.getByRole('textbox', { name: 'Minimum quality' });
    const price = screen.getByRole('textbox', { name: 'Maximum price' });
    expect(quality.id).not.toBe(price.id);
    expect(quality).toHaveAccessibleDescription('1 to 10');
    expect(price).toHaveAccessibleDescription(
      'Whole dollars Enter a whole-dollar amount',
    );
    expect(quality).not.toHaveAttribute('aria-invalid');
  });

  it('renders static markup with name, default text, presence and associations, touching no browser global', () => {
    vi.stubGlobal('window', undefined);
    vi.stubGlobal('document', undefined);
    try {
      const markup = renderToStaticMarkup(
        <NumberInput
          label={'Song count'}
          name={'songCount'}
          defaultValue={'1,5'}
          required={true}
          hint={'Songs per month'}
          invalid={true}
          errorMessage={'Enter a whole number'}
        />,
      );
      const controlId = /<input[^>]*\sid="([^"]+)"/.exec(markup)?.[1];
      expect(controlId).toBeTruthy();
      expect(markup).toContain(`<label for="${controlId}"`);
      expect(markup).toMatch(/<input[^>]*\sname="songCount"/);
      expect(markup).toMatch(/<input[^>]*\svalue="1,5"/);
      expect(markup).toMatch(/<input[^>]*\srequired=""/);
      expect(markup).toMatch(/<input[^>]*\sinputmode="decimal"/i);
      expect(markup).toMatch(/<input[^>]*\saria-invalid="true"/);
      const describedBy = /aria-describedby="([^"]+)"/.exec(markup)?.[1] ?? '';
      for (const describingId of describedBy.split(' ')) {
        expect(markup).toContain(`id="${describingId}"`);
      }
      expect(markup).toContain('Songs per month');
      expect(markup).toContain('Enter a whole number');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('exposes the consumer test hook on the control', () => {
    render(
      <NumberInput
        label={'Song count'}
        name={'songCount'}
        testId={'song-count'}
      />,
    );
    expect(screen.getByRole('textbox')).toHaveAttribute(
      'data-testid',
      'song-count',
    );
  });
});
